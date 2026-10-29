import { cleanCommand } from '../model/mask';

/**
 * One line of ~/.awf/events/<session_id>.jsonl. Short keys keep the files small.
 * Only timings, tool names, commands, file paths and IDs: never prompts, tool output or assistant text.
 */
export interface RecorderEvent {
  v: 1;
  /** hook_event_name */
  e: string;
  /** Epoch ms when Claude Code started the hook process. */
  t: number;
  sid: string;
  /** agent_id: set when the event fired inside a subagent (or is about one, for SubagentStart/Stop). */
  aid?: string;
  /** agent_type */
  at?: string;
  pid?: string;
  tool?: string;
  tuid?: string;
  /** Bash command, secrets masked and heredoc bodies dropped. */
  cmd?: string;
  files?: string[];
  /** tool_input.run_in_background */
  bg?: true;
  /** Agent/Task calls: tool_input.subagent_type */
  sub?: string;
  /** Browser and computer-use calls: what each call did, `tool` or `tool:action`. Names only. */
  act?: string[];
  /** Hash of tool_input, to pair PermissionRequest (no tool_use_id) with its PreToolUse. */
  ih?: string;
  ok?: boolean;
  /** duration_ms: execution time without permission prompts. */
  dur?: number;
  /** is_interrupt, or an interrupted Bash result */
  intr?: true;
  /** Exit code from a failed Bash call's error line. */
  code?: number;
  /** PostToolBatch: tool_use_ids of the batch. */
  ids?: string[];
  /** Agent/Task PostToolUse: agentId of the subagent the call ran. */
  child?: string;
  /** Background task: the one a background Bash call started (PostToolUse), or the one a call reads (PreToolUse). */
  bgid?: string;
  /** SessionStart source, or 'task-notification' on a UserPromptSubmit a background task's notice sent */
  src?: string;
  model?: string;
  /** SessionEnd reason */
  reason?: string;
  /** StopFailure error type */
  err?: string;
  /** PreCompact/PostCompact trigger */
  trigger?: string;
  cwd?: string;
  /** transcript_path */
  tp?: string;
  /** SubagentStop agent_transcript_path */
  atp?: string;
  /** permission_mode */
  pm?: string;
  /** Stop: background tasks still running. */
  bgt?: Array<{ id: string; type?: string; cmd?: string }>;
}

type Json = Record<string, unknown>;

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function obj(value: unknown): Json | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Json)
    : undefined;
}

/** FNV-1a, 32 bit, as 8 hex digits. */
export function hashText(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** A tool or action name as a tool's schema spells it. Free text (a description) doesn't pass. */
export const ACTION_NAME = /^[A-Za-z][\w.-]{0,63}$/;
const MAX_ACTIONS = 50;

/**
 * What an MCP call did, when its input says: a call's own `action` (`computer:screenshot`), or each
 * call of a batch (`navigate`, `computer:left_click`). Names only, never URLs, typed text or selectors.
 */
export function toolActions(tool: string, input: Json): string[] | undefined {
  if (!tool.startsWith('mcp__')) return undefined;
  const short = tool.slice(tool.lastIndexOf('__') + 2);
  const named = (name: unknown, action: unknown): string | undefined => {
    const n = str(name);
    if (!n || !ACTION_NAME.test(n)) return undefined;
    const a = str(action);
    return a && ACTION_NAME.test(a) ? `${n}:${a}` : n;
  };
  if (short.endsWith('batch') && Array.isArray(input.actions)) {
    const out: string[] = [];
    for (const item of input.actions.slice(0, MAX_ACTIONS)) {
      const call = obj(item);
      if (!call) continue;
      // Browsers batch { name, input }; computer use batches { action }, each action also a tool.
      const action =
        call.name !== undefined
          ? named(call.name, obj(call.input)?.action)
          : named(call.action, undefined);
      if (action) out.push(action);
    }
    return out.length > 0 ? out : undefined;
  }
  const action = named(short, input.action);
  return action?.includes(':') ? [action] : undefined;
}

const FILE_KEYS = ['file_path', 'notebook_path', 'path'];
const WITH_CWD = new Set(['SessionStart', 'UserPromptSubmit', 'SessionEnd']);
const WITH_TRANSCRIPT = new Set(['SessionStart', 'UserPromptSubmit', 'Stop', 'SessionEnd']);

/** Turns a hook's stdin JSON into the line the recorder stores. Returns null for input it can't use. */
export function toEvent(input: Json, t: number): RecorderEvent | null {
  const e = str(input.hook_event_name);
  const sid = str(input.session_id);
  if (!e || !sid) return null;
  const ev: RecorderEvent = { v: 1, e, t, sid };

  const aid = str(input.agent_id);
  if (aid) ev.aid = aid;
  const at = str(input.agent_type);
  if (at) ev.at = at;
  const pid = str(input.prompt_id);
  if (pid) ev.pid = pid;
  const tool = str(input.tool_name);
  if (tool) ev.tool = tool;
  const tuid = str(input.tool_use_id);
  if (tuid) ev.tuid = tuid;
  if (WITH_CWD.has(e) && str(input.cwd)) ev.cwd = str(input.cwd);
  if (WITH_TRANSCRIPT.has(e) && str(input.transcript_path)) ev.tp = str(input.transcript_path);

  const toolInput = obj(input.tool_input);
  if (toolInput && (e === 'PreToolUse' || e === 'PermissionRequest')) {
    ev.ih = hashText(JSON.stringify(toolInput));
  }
  if (toolInput && e === 'PreToolUse') {
    const command = str(toolInput.command);
    if (command) ev.cmd = cleanCommand(command);
    const files = FILE_KEYS.map((key) => str(toolInput[key])).filter((f): f is string => !!f);
    if (files.length > 0) ev.files = files;
    if (toolInput.run_in_background === true) ev.bg = true;
    const sub = str(toolInput.subagent_type);
    if (sub) ev.sub = sub;
    const act = tool ? toolActions(tool, toolInput) : undefined;
    if (act) ev.act = act;
    // TaskOutput, BashOutput, TaskStop: the background task they read or stop.
    const ref = str(toolInput.task_id) ?? str(toolInput.bash_id) ?? str(toolInput.shell_id);
    if (ref) ev.bgid = ref;
  }

  switch (e) {
    case 'UserPromptSubmit': {
      const pm = str(input.permission_mode);
      if (pm) ev.pm = pm;
      // Not the prompt itself: only whether a background task's notice started this turn.
      if (/^\s*<task-notification>/.test(str(input.prompt) ?? '')) ev.src = 'task-notification';
      break;
    }
    case 'PostToolUse':
    case 'PostToolUseFailure': {
      ev.ok = e === 'PostToolUse';
      if (typeof input.duration_ms === 'number') ev.dur = Math.round(input.duration_ms);
      if (input.is_interrupt === true) ev.intr = true;
      const response = obj(input.tool_response);
      if (response) {
        const child = str(response.agentId);
        if (child) ev.child = child;
        const bgid = str(response.backgroundTaskId);
        if (bgid) ev.bgid = bgid;
        if (response.interrupted === true) ev.intr = true;
      }
      const error = str(input.error);
      const code = error ? /^(?:Error: )?Exit code (\d+)/.exec(error) : null;
      if (code) ev.code = Number(code[1]);
      break;
    }
    case 'PostToolBatch': {
      if (Array.isArray(input.tool_calls)) {
        ev.ids = input.tool_calls
          .map((call) => str(obj(call)?.tool_use_id))
          .filter((id): id is string => !!id);
      }
      break;
    }
    case 'SessionStart': {
      const src = str(input.source);
      if (src) ev.src = src;
      const model = str(input.model) ?? str(obj(input.model)?.id);
      if (model) ev.model = model;
      break;
    }
    case 'SessionEnd': {
      const reason = str(input.reason);
      if (reason) ev.reason = reason;
      break;
    }
    case 'StopFailure': {
      const err = str(input.error);
      if (err) ev.err = err;
      break;
    }
    case 'Stop': {
      if (Array.isArray(input.background_tasks) && input.background_tasks.length > 0) {
        ev.bgt = input.background_tasks.slice(0, 20).map((task) => {
          const t = obj(task) ?? {};
          const command = str(t.command);
          return {
            id: str(t.id) ?? '?',
            ...(str(t.type) ? { type: str(t.type) } : {}),
            ...(command ? { cmd: cleanCommand(command) } : {}),
          };
        });
      }
      break;
    }
    case 'PreCompact':
    case 'PostCompact': {
      const trigger = str(input.trigger);
      if (trigger) ev.trigger = trigger;
      break;
    }
    case 'SubagentStop': {
      const atp = str(input.agent_transcript_path);
      if (atp) ev.atp = atp;
      break;
    }
  }
  return ev;
}
