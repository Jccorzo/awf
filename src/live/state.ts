// What a Claude Code session is doing now, from its transcript (and the recorder's events, when
// there are any). See docs/transcript-format.md for the entries read here.
import {
  contentBlocks,
  type Entry,
  messageText,
  obj,
  promptKind,
  str,
  timestampMs,
} from '../importers/claude-code/format';
import { maskSecrets } from '../model/mask';
import type { RecorderEvent } from '../recorder/event';

/** Calls that wait for you to answer: a question, a plan to approve, computer use asking for access. */
const QUESTION_TOOLS = new Set([
  'AskUserQuestion',
  'ExitPlanMode',
  'mcp__computer-use__request_access',
]);
/** Calls that stop a background task, and calls that only read one. */
const STOP_TOOLS = new Set(['TaskStop', 'KillShell', 'KillBash']);
const TASK_REFS = new Set([...STOP_TOOLS, 'TaskOutput', 'BashOutput']);
/** Calls whose result names a task that keeps running in the background. */
const TASK_TOOLS = new Set(['Monitor', 'Workflow']);
/** Stop reasons of a model response that ends the turn (end_turn; stop_sequence on API errors). */
const END_REASONS = new Set(['end_turn', 'stop_sequence']);
/** Your turn for this long reads as idle. */
export const IDLE_AFTER_MS = 5 * 60_000;
const MAX_TITLE = 160;
/**
 * Entries the agent writes while it works. Claude Code also writes untimestamped entries
 * (cost-state, last-prompt) when the process exits or the app reopens a session, and timestamped
 * links (pr-link): those aren't activity.
 */
const ACTIVITY = new Set([
  'user',
  'assistant',
  'system',
  'api-request',
  'queue-operation',
  'attachment',
]);

/**
 * Commands that serve or watch until they're stopped: dev servers, proxies, tunnels, `tail -f`. A
 * background shell running one doesn't keep the session working, since nothing waits for it to end.
 */
const SERVERS = [
  // A package script that serves: pnpm dev, pnpm -C core dev, yarn dev:web, npm start, npx serve.
  /\b(?:npm|pnpm|yarn|bun|npx|bunx)\b[^;&|]*?\s(?:dev|start|serve|server|preview|watch|storybook)(?::[\w-]+)*(?=$|[\s;&|)])/,
  /\b(?:next|vite|nuxt|nuxi|astro|remix|gatsby|expo|storybook|wrangler|webpack|rspack|ng|react-scripts|vue-cli-service)\s+(?:dev|develop|start|serve|preview)\b/,
  /\bvite(?=$|\s+-|\s*[;&|)])/,
  /(?:^|[\s;&|(/])(?:nodemon|http-server|live-server|json-server|browser-sync|uvicorn|gunicorn|hypercorn|daphne|streamlit|gradio|jupyter|puma|rackup|foreman|overmind|ngrok|cloudflared|caddy|cloud-sql-proxy|cloud_sql_proxy|redis-server|mongod|mailhog|mailpit)(?=$|[\s;&|)])/,
  /\bpython[\d.]*\s+-m\s+http\.server\b|\bflask\s+run\b|\brails\s+s(?:erver)?\b|\bphp\s+-S\b/,
  /\b(?:docker|podman)[\s-]compose\s+(?:\S+\s+)*?up\b(?![^;&|]*\s(?:-d|--detach)\b)/,
  /\bkubectl\s+port-forward\b|\btail\s+-[fF]\b/,
  // Any program's serve subcommand: firebase serve, registry serve, manage.py runserver.
  /\s(?:serve|server|runserver)(?=$|[\s;&|)])/,
  // A server by its file (node server.mjs), or by where it listens (PORT=8080 ./api, --port 3000).
  /\bserver\.(?:[cm]?js|[cm]?ts|py|rb)\b/,
  /(?:^|[\s;&|(])(?:PORT=\d|[A-Z_]*_(?:BIND|LISTEN)(?:_ADDR)?=)|\s--(?:port|bind|listen)[=\s]/,
];
/** A command that ends by itself, or a test run that brings up a server for itself. */
const ENDS =
  /\b(?:kill|pkill|killall|timeout|gtimeout|test|tests|spec|e2e|playwright|cypress|jest|vitest|pytest|xcodebuild)\b|\s--(?:help|version)\b/;

/** A shell command that serves or watches until it's stopped. */
export function isServer(command: string): boolean {
  return !ENDS.test(command) && SERVERS.some((pattern) => pattern.test(command));
}

export interface OpenCall {
  id: string;
  tool: string;
  ms: number;
  /** A Bash call's command. */
  command?: string;
}

/** What the transcript says about the session now. */
export interface TranscriptFacts {
  /** The folder the session started in. */
  cwd?: string;
  /** The session's name (custom-title), else Claude Code's title for it, else its first prompt. */
  title?: string;
  /** A prompt, a model request or a tool call came after the last turn ended. */
  turnOpen: boolean;
  /** When the last turn ended; undefined while a turn is open. */
  endedMs?: number;
  /** The main agent's tool calls without a result, in the open turn. */
  openCalls: OpenCall[];
  /** Background shells, background subagents, monitors and workflows not finished yet. */
  background: OpenCall[];
  /** When the agent last wrote something: a prompt, a reply, a request, a notice. */
  lastMs?: number;
}

/** Reads a main transcript's text. Lines that aren't JSON are skipped. */
export function transcriptFacts(text: string): TranscriptFacts {
  let cwd: string | undefined;
  let customTitle: string | undefined;
  let aiTitle: string | undefined;
  let firstPrompt: string | undefined;
  let firstCommand: string | undefined;
  let turnOpen = false;
  /** The open turn has a prompt and nothing else yet. */
  let promptOnly = false;
  let endedMs: number | undefined;
  let lastMs: number | undefined;
  const open = new Map<string, OpenCall>();
  const calls = new Map<string, OpenCall>();
  const background = new Map<string, OpenCall>();
  const finished = new Set<string>();

  const work = () => {
    turnOpen = true;
    promptOnly = false;
    endedMs = undefined;
  };
  const end = (ms: number) => {
    turnOpen = false;
    endedMs = ms;
    open.clear();
  };
  const finish = (taskId: string | undefined, callId?: string) => {
    if (taskId) {
      finished.add(taskId);
      background.delete(taskId);
    }
    if (callId) for (const [id, task] of background) if (task.id === callId) background.delete(id);
  };
  // A notice ends a task only with a status: a monitor's events come without one while it runs.
  const notices = (text: string) => {
    for (const chunk of text.split('<task-notification>').slice(1)) {
      const tag = (name: string) =>
        new RegExp(`<${name}>([^<]*)</${name}>`).exec(chunk)?.[1]?.trim() || undefined;
      if (tag('status')) finish(tag('task-id'), tag('tool-use-id'));
    }
  };

  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    const entry = obj(parsed) as Entry | undefined;
    if (!entry) continue;
    if (entry.type === 'custom-title') customTitle = str(entry.customTitle) ?? customTitle;
    if (entry.type === 'ai-title') aiTitle = str(entry.aiTitle) ?? aiTitle;
    if (entry.type === 'cost-state') {
      // Written when the process exits: what was running died with it (a resumed session reports
      // its shells killed). A turn left open ended there; the session waits for you.
      if (turnOpen && lastMs !== undefined) end(lastMs);
      open.clear();
      background.clear();
      continue;
    }
    // Older versions kept subagent entries in the main file.
    if (entry.isSidechain === true) continue;
    const ms = timestampMs(entry);
    if (ms === undefined || !ACTIVITY.has(String(entry.type))) continue;
    cwd ??= str(entry.cwd);
    lastMs = Math.max(lastMs ?? ms, ms);

    switch (entry.type) {
      case 'user': {
        const kind = promptKind(entry);
        const text = messageText(entry);
        if (kind !== 'none') {
          if (kind === 'notification') notices(text);
          else if (!firstPrompt) {
            const clean = oneLine(text);
            if (clean.startsWith('/')) firstCommand ??= clean;
            else if (clean) firstPrompt = clean;
          }
          work();
          promptOnly = true;
          break;
        }
        // A slash command that ran without the model (/model, /login): its output ends the turn.
        if (promptOnly && turnOpen && text.trimStart().startsWith('<local-command-stdout>')) {
          end(ms);
          break;
        }
        const result = obj(entry.toolUseResult);
        for (const block of contentBlocks(entry)) {
          if (block.type !== 'tool_result') continue;
          const id = str(block.tool_use_id);
          if (!id) continue;
          // A result for a call no longer open (killed as the process exited) starts nothing.
          if (open.delete(id)) work();
          const call = calls.get(id);
          const tool = call?.tool;
          if (block.is_error === true || !result || !tool || TASK_REFS.has(tool)) continue;
          const taskId =
            str(result.backgroundTaskId) ??
            (result.isAsync === true || result.status === 'async_launched'
              ? str(result.agentId)
              : undefined) ??
            (TASK_TOOLS.has(tool) ? str(result.taskId) : undefined);
          if (taskId && !finished.has(taskId)) background.set(taskId, { ...call, ms });
        }
        // "[Request interrupted by user]", "... for tool use": the turn ends where it stands.
        if (text.trimStart().startsWith('[Request interrupted')) end(ms);
        break;
      }
      case 'assistant': {
        work();
        if (entry.isApiErrorMessage === true) {
          end(ms);
          break;
        }
        let used = false;
        for (const block of contentBlocks(entry)) {
          if (block.type !== 'tool_use') continue;
          const id = str(block.id);
          const tool = str(block.name);
          if (!id || !tool) continue;
          used = true;
          const input = obj(block.input) ?? {};
          const command = tool === 'Bash' ? str(input.command) : undefined;
          const call: OpenCall = command ? { id, tool, ms, command } : { id, tool, ms };
          open.set(id, call);
          calls.set(id, call);
          if (STOP_TOOLS.has(tool)) {
            finish(str(input.task_id) ?? str(input.bash_id) ?? str(input.shell_id));
          }
        }
        const reason = str(obj(entry.message)?.stop_reason);
        if (!used && reason && END_REASONS.has(reason) && open.size === 0) end(ms);
        break;
      }
      case 'api-request':
        // A model request went out: the agent works, even after its turn ended (a notice came in).
        work();
        break;
      case 'system': {
        const subtype = str(entry.subtype);
        if (subtype === 'turn_duration' || subtype === 'stop_hook_summary') end(ms);
        break;
      }
      case 'queue-operation':
        if (entry.operation === 'enqueue') notices(str(entry.content) ?? '');
        break;
      case 'attachment':
        notices(JSON.stringify(entry.attachment ?? ''));
        break;
    }
  }

  const facts: TranscriptFacts = {
    turnOpen,
    openCalls: [...open.values()],
    background: [...background.values()],
  };
  if (cwd) facts.cwd = cwd;
  const title = oneLine(customTitle ?? '') || oneLine(aiTitle ?? '') || firstPrompt || firstCommand;
  if (title) facts.title = title;
  if (endedMs !== undefined) facts.endedMs = endedMs;
  if (lastMs !== undefined) facts.lastMs = lastMs;
  return facts;
}

/** One line of plain text: tags, control characters and secrets out. */
export function oneLine(text: string): string {
  const plain = text
    .replace(/<(system-reminder|local-command-caveat|command-message)>[\s\S]*?<\/\1>/g, ' ')
    .replace(/<command-name>([^<]*)<\/command-name>/g, '$1 ')
    .replace(/<\/?[a-z][a-z0-9_-]*(?:\s[^>]*)?>/gi, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const masked = maskSecrets(plain);
  return masked.length > MAX_TITLE ? masked.slice(0, MAX_TITLE - 1) + '…' : masked;
}

export type StateKind = 'working' | 'approval' | 'your-turn' | 'idle';

export interface LiveState {
  kind: StateKind;
  /** working: a turn is open, or only background work is left. */
  why?: 'turn' | 'background';
  /** your-turn, idle: since when the agent has been waiting for you. */
  sinceMs?: number;
  /** your-turn, idle: the open call that asks you something. */
  question?: string;
  /** Background tasks and subagents still running. */
  background: number;
  /** Of those, servers left running (see `isServer`): they don't keep the session working. */
  servers: number;
}

/**
 * The session's state: working (mid-turn, a call open, or background work it waits for running),
 * approval (the recorder saw a permission prompt nobody answered yet), your turn (the turn ended,
 * or a question waits for you), idle (your turn for IDLE_AFTER_MS or more). A server left running
 * after the turn ended is your turn: the agent comes back when background work ends, and a server
 * doesn't end.
 */
export function liveState(
  facts: TranscriptFacts,
  now: number,
  events?: RecorderEvent[],
): LiveState {
  const background = facts.background.length;
  const servers = facts.background.filter((task) => task.command && isServer(task.command)).length;
  const counts = { background, servers };
  if (facts.turnOpen) {
    const question = facts.openCalls.find((c) => QUESTION_TOOLS.has(c.tool));
    if (question) return waiting(question.ms, now, counts, question.tool);
  }
  if (facts.turnOpen || background > servers) {
    if (events && approvalPending(events, facts)) return { kind: 'approval', ...counts };
    return { kind: 'working', why: facts.turnOpen ? 'turn' : 'background', ...counts };
  }
  return waiting(facts.endedMs ?? facts.lastMs ?? now, now, counts);
}

function waiting(
  sinceMs: number,
  now: number,
  counts: { background: number; servers: number },
  question?: string,
): LiveState {
  const state: LiveState = {
    kind: now - sinceMs >= IDLE_AFTER_MS ? 'idle' : 'your-turn',
    sinceMs,
    ...counts,
  };
  if (question) state.question = question;
  return state;
}

/**
 * The recorder saw a PermissionRequest whose call hasn't ended. It has no tool_use_id, so it is
 * paired with the call's PreToolUse by the hash of the tool's input. A main-agent call must also be
 * open in the transcript (hooks run asynchronously, and one can be lost); a subagent's call must
 * belong to a subagent that hasn't stopped.
 */
export function approvalPending(events: RecorderEvent[], facts: TranscriptFacts): boolean {
  const calls: RecorderEvent[] = [];
  const ended = new Set<string>();
  const stopped = new Set<string>();
  const requests: RecorderEvent[] = [];
  for (const event of events) {
    switch (event.e) {
      case 'PreToolUse':
        if (event.tuid) calls.push(event);
        break;
      case 'PostToolUse':
      case 'PostToolUseFailure':
      case 'PermissionDenied':
        if (event.tuid) ended.add(event.tuid);
        break;
      case 'SubagentStop':
        if (event.aid) stopped.add(event.aid);
        break;
      case 'PermissionRequest':
        requests.push(event);
        break;
    }
  }
  const openInTranscript = new Set(facts.openCalls.map((c) => c.id));
  return requests.some((request) => {
    if (!request.ih) return false;
    const call = calls.findLast(
      (c) =>
        c.ih === request.ih &&
        c.tool === request.tool &&
        c.aid === request.aid &&
        !ended.has(c.tuid as string),
    );
    if (!call) return false;
    return call.aid ? !stopped.has(call.aid) : openInTranscript.has(call.tuid as string);
  });
}

/** "working", "approval?", "your turn", "idle 12m". */
export function stateLabel(state: LiveState, now: number): string {
  switch (state.kind) {
    case 'working':
      return 'working';
    case 'approval':
      return 'approval?';
    case 'your-turn':
      return 'your turn';
    case 'idle':
      return `idle ${idleFor(now - (state.sinceMs ?? now))}`;
  }
}

/** "12m", "3h05m", "2d". */
export function idleFor(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h${String(minutes % 60).padStart(2, '0')}m`;
  return `${Math.floor(hours / 24)}d`;
}
