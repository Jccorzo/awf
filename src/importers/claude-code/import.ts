import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanCommand, maskSecrets } from '../../model/mask';
import type { Session, SessionDiagnostics, Step, StepDetail, TokenUsage } from '../../model/types';
import { type RecorderEvent, toolActions } from '../../recorder/event';
import { eventsToSession } from '../../recorder/steps';
import {
  BLOCK_TYPES,
  contentBlocks,
  EXIT_CODE,
  type Entry,
  messageText,
  obj,
  parseNotification,
  promptKind,
  READ_TYPES,
  resultText,
  SKIPPED_TYPES,
  str,
  SYSTEM_SUBTYPES,
  type TaskNotification,
  timestampMs,
} from './format';

export interface ImportOptions {
  /**
   * Also read the first prompt, call descriptions and output, masked. Only the report asks for
   * them; nothing that awf stores carries them.
   */
  detail?: boolean;
}

const FILE_KEYS = ['file_path', 'notebook_path', 'path'];
/** Calls that stop a background task. */
const STOP_TOOLS = new Set(['TaskStop', 'KillShell', 'KillBash']);
/** Calls that name a background task without starting one: they read or stop it. */
const TASK_REFS = new Set([...STOP_TOOLS, 'TaskOutput', 'BashOutput']);
const MAX_OUTPUT = 4000;
/** A Monitor's timeout when its call names none, and the longest Claude Code allows. */
const MONITOR_TIMEOUT_MS = 300_000;
const MONITOR_MAX_TIMEOUT_MS = 1_800_000;
/** A Monitor's result, when it has no `toolUseResult` (some subagent transcripts). */
const MONITOR_STARTED = /^Monitor started \(task ([\w-]+)/;

interface ToolUse {
  name: string;
  messageId?: string;
  agentId?: string;
}

interface Message {
  agentId?: string;
  lastMs: number;
  model?: string;
  tokens?: TokenUsage;
  /**
   * When the request that produced this answer was sent, if it was sent more than once: the
   * answer's model time starts there. Before it, the agent resent the same request and wasn't
   * generating.
   */
  sentMs?: number;
}

/** Turns a Claude Code transcript (and its subagents' transcripts) into a session. */
export function importClaudeCodeTranscript(file: string, options: ImportOptions = {}): Session {
  const sessionId = path.basename(file, '.jsonl');
  const reader = new TranscriptReader(options);
  reader.readMain(readLines(file));
  const subDir = path.join(path.dirname(file), sessionId, 'subagents');
  if (existsSync(subDir)) {
    for (const name of readdirSync(subDir).sort()) {
      const match = /^agent-(.+)\.jsonl$/.exec(name);
      if (match?.[1]) reader.readSubagent(match[1], readLines(path.join(subDir, name)));
    }
  }
  return reader.build(sessionId, file);
}

function readLines(file: string): string[] {
  return readFileSync(file, 'utf8').split('\n');
}

class TranscriptReader {
  private readonly events: RecorderEvent[] = [];
  private readonly diagnostics: SessionDiagnostics = {
    unknownEntries: {},
    badLines: 0,
    warnings: [],
  };
  private readonly toolUses = new Map<string, ToolUse>();
  private readonly messages = new Map<string, Message>();
  private readonly details = new Map<string, StepDetail>();
  private readonly startEvents = new Map<string, RecorderEvent>();
  /** Calls of each assistant message still waiting for a result, to know when its batch is done. */
  private readonly batches = new Map<
    string,
    { ids: string[]; pending: Set<string>; lastMs: number; agentId?: string }
  >();
  private readonly notifications: TaskNotification[] = [];
  /** Subagent type per agent ID, from the Agent call that ran it. */
  private readonly agentTypes = new Map<string, string>();
  /** When each model request was sent (`api-request` entries), by request ID. */
  private readonly requests = new Map<string, number>();
  /** Requests each agent ('' for the main one) sent since its last input, not yet answered. */
  private readonly sends = new Map<string, number[]>();
  /** Monitor calls by tool_use_id: how long each may run before Claude Code kills it. */
  private readonly monitors = new Map<string, { timeoutMs: number; persistent: boolean }>();
  /** The latest timestamp in the transcripts: Claude Code was still running then. */
  private lastMs = -Infinity;
  private turnOpen = false;
  private turnStart = 0;
  private lastActivity = 0;
  private turnEndMark: number | undefined;
  /** A message after the turn ended that wasn't a prompt (an app notice, a `!` command). */
  private pendingPrompt: number | undefined;
  private cwd: string | undefined;
  private version: string | undefined;
  private title: string | undefined;

  constructor(private readonly options: ImportOptions) {}

  private count(key: string): void {
    this.diagnostics.unknownEntries[key] = (this.diagnostics.unknownEntries[key] ?? 0) + 1;
  }

  private emit(event: Omit<RecorderEvent, 'v' | 'sid'>): void {
    this.events.push({ v: 1, sid: '', ...event });
  }

  private parse(lines: string[]): Entry[] {
    const entries: Entry[] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (obj(entry)) entries.push(entry as Entry);
        else this.diagnostics.badLines++;
      } catch {
        this.diagnostics.badLines++;
      }
    }
    return entries;
  }

  /** Checks an entry's type, notes its version and cwd; returns false for entries to skip. */
  private accept(entry: Entry): boolean {
    const type = str(entry.type) ?? '<no type>';
    const version = str(entry.version);
    if (version && (!this.version || compareVersions(version, this.version) > 0))
      this.version = version;
    if (!this.cwd && str(entry.cwd)) this.cwd = str(entry.cwd);
    if (SKIPPED_TYPES.has(type)) return false;
    if (!READ_TYPES.has(type)) {
      this.count(type);
      return false;
    }
    return true;
  }

  readMain(lines: string[]): void {
    for (const entry of this.parse(lines)) {
      if (!this.accept(entry)) continue;
      const ms = timestampMs(entry);
      if (ms === undefined) continue;
      this.lastMs = Math.max(this.lastMs, ms);
      // Older versions kept subagent entries in the main file, marked as sidechain.
      const agentId = entry.isSidechain === true ? (str(entry.agentId) ?? 'sidechain') : undefined;
      switch (entry.type) {
        case 'user':
          this.user(entry, ms, agentId);
          break;
        case 'assistant':
          this.assistant(entry, ms, agentId);
          break;
        case 'system':
          this.system(entry, ms);
          break;
        case 'api-request':
          this.request(entry, ms, agentId);
          break;
        case 'queue-operation':
        case 'attachment': {
          const text =
            entry.type === 'attachment'
              ? JSON.stringify(entry.attachment ?? '')
              : (str(entry.content) ?? '');
          const notice = parseNotification(text, ms);
          if (notice && (entry.type === 'attachment' || entry.operation === 'enqueue')) {
            this.notifications.push(notice);
          }
          break;
        }
      }
    }
    if (this.turnOpen) this.closeTurn();
  }

  readSubagent(agentId: string, lines: string[]): void {
    const entries = this.parse(lines).filter((e) => this.accept(e) && timestampMs(e) !== undefined);
    const first = entries[0];
    const last = entries[entries.length - 1];
    if (!first || !last) return;
    const at = this.agentTypes.get(agentId) ?? str(first.agentType);
    this.emit({
      e: 'SubagentStart',
      t: timestampMs(first) as number,
      aid: agentId,
      ...(at ? { at } : {}),
    });
    for (const entry of entries) {
      const ms = timestampMs(entry) as number;
      this.lastMs = Math.max(this.lastMs, ms);
      if (entry.type === 'user') {
        this.sends.delete(agentId);
        this.toolResults(entry, ms, agentId);
      } else if (entry.type === 'assistant') this.assistant(entry, ms, agentId);
      else if (entry.type === 'api-request') this.request(entry, ms, agentId);
      else if (entry.type === 'attachment') {
        // The subagent's own background tasks finishing, queued for it.
        const notice = parseNotification(JSON.stringify(entry.attachment ?? ''), ms);
        if (notice) this.notifications.push(notice);
      }
    }
    this.emit({ e: 'SubagentStop', t: timestampMs(last) as number, aid: agentId });
  }

  private user(entry: Entry, ms: number, agentId: string | undefined): void {
    // New input: requests sent before it were for an earlier answer.
    this.sends.delete(agentId ?? '');
    if (agentId) {
      this.toolResults(entry, ms, agentId);
      return;
    }
    const kind = promptKind(entry);
    if (kind === 'none') {
      const ended = !this.turnOpen || this.turnEndMark !== undefined;
      if (messageText(entry).startsWith('[Request interrupted')) {
        // "[Request interrupted by user]": the turn ends here, unless it had ended already.
        if (!ended) this.lastActivity = Math.max(this.lastActivity, ms);
      } else if (
        ended &&
        entry.isCompactSummary !== true &&
        !contentBlocks(entry).some((b) => b.type === 'tool_result')
      ) {
        // Sent after the turn ended, but not a prompt: if the model answers it, a turn starts here.
        // A compaction's summary isn't one: the model doesn't answer it (an idle compaction).
        this.pendingPrompt ??= ms;
      }
      this.toolResults(entry, ms, undefined);
      return;
    }
    if (this.turnOpen) this.closeTurn();
    const text = messageText(entry);
    if (kind === 'notification') {
      const notice = parseNotification(text, ms);
      if (notice) this.notifications.push(notice);
    } else if (this.options.detail && !this.title) {
      this.title = oneLine(text);
    }
    this.startTurn(ms, kind === 'notification' ? 'task-notification' : undefined);
  }

  private startTurn(ms: number, src: string | undefined): void {
    this.emit({ e: 'UserPromptSubmit', t: ms, ...(src ? { src } : {}) });
    this.turnOpen = true;
    this.turnStart = ms;
    this.lastActivity = ms;
    this.turnEndMark = undefined;
    this.pendingPrompt = undefined;
  }

  private closeTurn(): void {
    const end =
      this.turnEndMark !== undefined && this.turnEndMark >= this.lastActivity
        ? this.turnEndMark
        : this.lastActivity;
    this.emit({ e: 'Stop', t: Math.max(end, this.turnStart) });
    this.turnOpen = false;
  }

  private toolResults(entry: Entry, ms: number, agentId: string | undefined): void {
    const result = obj(entry.toolUseResult);
    const decision = obj(entry.permissionDecision);
    for (const block of contentBlocks(entry)) {
      if (block.type !== 'tool_result') {
        if (!BLOCK_TYPES.has(String(block.type))) this.count(`block:${String(block.type)}`);
        continue;
      }
      const tuid = str(block.tool_use_id);
      if (!tuid) continue;
      if (!agentId) this.lastActivity = Math.max(this.lastActivity, ms);
      const text = resultText(block);
      const failed = block.is_error === true;
      const source = str(decision?.source) ?? '';
      const use = this.toolUses.get(tuid);
      if (source.startsWith('user')) {
        // You decided this call: it waited for you. The transcript doesn't say for how long.
        const startEvent = this.startEvents.get(tuid);
        if (startEvent)
          this.emit({
            e: 'PermissionRequest',
            t: startEvent.t,
            tool: startEvent.tool,
            ih: tuid,
            ...(agentId ? { aid: agentId } : {}),
          });
      }
      if (str(decision?.decision) === 'reject') {
        this.emit({ e: 'PermissionDenied', t: ms, tuid, ...(agentId ? { aid: agentId } : {}) });
        this.resolveBatch(use, tuid, ms);
        continue;
      }
      const code = failed ? EXIT_CODE.exec(text) : null;
      const event: Omit<RecorderEvent, 'v' | 'sid'> = {
        e: failed ? 'PostToolUseFailure' : 'PostToolUse',
        t: ms,
        tuid,
        ok: !failed,
      };
      if (use) event.tool = use.name;
      if (agentId) event.aid = agentId;
      if (code) event.code = Number(code[1]);
      if (result?.interrupted === true) event.intr = true;
      const child = str(result?.agentId);
      if (child && use && (use.name === 'Agent' || use.name === 'Task')) {
        event.child = child;
        const type = str(result?.agentType);
        if (type && !this.agentTypes.has(child)) this.agentTypes.set(child, type);
      }
      let bgid = str(result?.backgroundTaskId);
      const monitor = this.monitors.get(tuid);
      if (monitor && !failed) {
        // A Monitor runs its command in the background as a task, like a background shell.
        bgid ??= str(result?.taskId) ?? MONITOR_STARTED.exec(text)?.[1];
        if (typeof result?.timeoutMs === 'number') monitor.timeoutMs = result.timeoutMs;
        if (result?.persistent === true) monitor.persistent = true;
      }
      if (bgid) event.bgid = bgid;
      this.emit(event);
      this.resolveBatch(use, tuid, ms);
      if (this.options.detail) {
        const detail = this.details.get(tuid) ?? {};
        if (text) detail.output = clip(maskSecrets(text));
        this.details.set(tuid, detail);
      }
    }
  }

  /** When the last call of an assistant message has its result, the batch is done (like PostToolBatch). */
  private resolveBatch(use: ToolUse | undefined, tuid: string, ms: number): void {
    const batch = use?.messageId ? this.batches.get(use.messageId) : undefined;
    if (!batch || !batch.pending.delete(tuid)) return;
    batch.lastMs = Math.max(batch.lastMs, ms);
    if (batch.pending.size === 0) {
      this.emit({
        e: 'PostToolBatch',
        t: batch.lastMs,
        ids: batch.ids,
        ...(batch.agentId ? { aid: batch.agentId } : {}),
      });
    }
  }

  private assistant(entry: Entry, ms: number, agentId: string | undefined): void {
    const message = obj(entry.message) ?? {};
    const messageId = str(message.id) ?? str(entry.uuid);
    if (!agentId && (!this.turnOpen || (this.turnEndMark !== undefined && ms > this.turnEndMark))) {
      // The model works again after its turn ended with no prompt in between (it answered an app
      // notice or a reminder): that's a turn of its own, from the message it answered.
      if (this.turnOpen) this.closeTurn();
      this.startTurn(Math.min(this.pendingPrompt ?? ms, ms), 'system');
    }
    if (!agentId) this.lastActivity = Math.max(this.lastActivity, ms);
    if (messageId) {
      const known = this.messages.get(messageId);
      const record: Message = known ?? { lastMs: ms };
      if (!known) {
        const sentMs = this.resentAt(agentId ?? '', str(entry.requestRef), ms);
        if (sentMs !== undefined) record.sentMs = sentMs;
      }
      record.lastMs = Math.max(record.lastMs, ms);
      if (agentId) record.agentId = agentId;
      const model = str(message.model);
      if (model && model !== '<synthetic>') record.model = model;
      const usage = obj(message.usage);
      if (usage) record.tokens = tokens(usage);
      this.messages.set(messageId, record);
    }
    if (entry.isApiErrorMessage === true && !agentId) {
      this.emit({ e: 'StopFailure', t: ms, err: 'api_error' });
      this.turnOpen = false;
      return;
    }
    for (const block of contentBlocks(entry)) {
      if (!BLOCK_TYPES.has(String(block.type))) this.count(`block:${String(block.type)}`);
      if (block.type !== 'tool_use') continue;
      const tuid = str(block.id);
      const name = str(block.name);
      if (!tuid || !name) continue;
      const input = obj(block.input) ?? {};
      const event: Omit<RecorderEvent, 'v' | 'sid'> = {
        e: 'PreToolUse',
        t: ms,
        tool: name,
        tuid,
        ih: tuid,
      };
      const command = str(input.command);
      if (command) event.cmd = cleanCommand(command);
      const files = FILE_KEYS.map((key) => str(input[key])).filter((f): f is string => !!f);
      if (files.length > 0) event.files = files;
      if (input.run_in_background === true) event.bg = true;
      const sub = str(input.subagent_type);
      if (sub) event.sub = sub;
      const act = toolActions(name, input);
      if (act) event.act = act;
      const ref = str(input.task_id) ?? str(input.bash_id) ?? str(input.shell_id);
      if (ref) event.bgid = ref;
      if (name === 'Monitor') {
        const asked = typeof input.timeout_ms === 'number' ? input.timeout_ms : MONITOR_TIMEOUT_MS;
        this.monitors.set(tuid, {
          timeoutMs: Math.min(asked, MONITOR_MAX_TIMEOUT_MS),
          persistent: input.persistent === true,
        });
      }
      if (agentId) event.aid = agentId;
      this.emit(event);
      this.startEvents.set(tuid, this.events[this.events.length - 1] as RecorderEvent);
      const use: ToolUse = { name };
      if (messageId) {
        use.messageId = messageId;
        const batch = this.batches.get(messageId) ?? {
          ids: [],
          pending: new Set<string>(),
          lastMs: ms,
        };
        if (agentId) batch.agentId = agentId;
        batch.ids.push(tuid);
        batch.pending.add(tuid);
        this.batches.set(messageId, batch);
      }
      if (agentId) use.agentId = agentId;
      this.toolUses.set(tuid, use);
      if (this.options.detail) {
        const description = str(input.description);
        if (description) this.details.set(tuid, { description: oneLine(description) });
      }
    }
  }

  /** An `api-request` entry: a model request sent by the main agent or a subagent. */
  private request(entry: Entry, ms: number, agentId: string | undefined): void {
    const id = str(entry.id);
    if (id) this.requests.set(id, ms);
    const key = agentId ?? '';
    this.sends.set(key, [...(this.sends.get(key) ?? []), ms]);
  }

  /**
   * When the request behind an answer was sent, if the agent had sent it before: after an API
   * error, a timeout or a rate limit, Claude Code sends the same request again, sometimes for an
   * hour. Undefined when it went out once. `requestRef` names the send that was answered; without
   * it, the last send before the answer.
   */
  private resentAt(key: string, ref: string | undefined, ms: number): number | undefined {
    const sends = this.sends.get(key) ?? [];
    this.sends.delete(key);
    const referenced = ref ? this.requests.get(ref) : undefined;
    const sentMs = referenced ?? sends.filter((s) => s <= ms).at(-1);
    if (sentMs === undefined || sentMs > ms) return undefined;
    return sends.some((s) => s < sentMs) ? sentMs : undefined;
  }

  private system(entry: Entry, ms: number): void {
    const subtype = str(entry.subtype) ?? '<none>';
    if (!SYSTEM_SUBTYPES.has(subtype)) {
      this.count(`system:${subtype}`);
      return;
    }
    if (subtype === 'turn_duration' || subtype === 'stop_hook_summary') {
      this.turnEndMark = Math.max(this.turnEndMark ?? 0, ms);
    } else if (subtype === 'compact_boundary') {
      const meta = obj(entry.compactMetadata) ?? {};
      const duration = typeof meta.durationMs === 'number' ? meta.durationMs : 0;
      const trigger = str(meta.trigger);
      this.emit({ e: 'PreCompact', t: ms - duration, ...(trigger ? { trigger } : {}) });
      this.emit({ e: 'PostCompact', t: ms, ...(trigger ? { trigger } : {}) });
    }
  }

  build(sessionId: string, file: string): Session {
    const session = eventsToSession(sessionId, this.events);
    session.sources = ['transcript'];
    session.transcriptPath = file;
    if (this.cwd) session.cwd = this.cwd;
    if (this.version) session.agentVersion = this.version;
    if (this.title) session.title = this.title;
    session.diagnostics = this.diagnostics;
    this.addBackgroundSteps(session);
    this.addModelDetails(session);
    if (this.options.detail) {
      for (const step of session.steps) {
        const detail = this.details.get(step.id);
        if (detail) step.detail = detail;
      }
    }
    if (session.steps.length > 0) {
      session.startMs = Math.min(...session.steps.map((s) => s.startMs));
      session.endMs = Math.max(...session.steps.map((s) => s.endMs));
    }
    return session;
  }

  /**
   * A background shell runs from its call until its completion notice, or until a TaskStop or
   * KillShell call stops it: a stopped task gets no notice. A Monitor's command runs the same way,
   * and no longer than its timeout. A notice without a status (a Monitor's event) isn't an end.
   */
  private addBackgroundSteps(session: Session): void {
    const stops = session.steps.filter(
      (s) => s.kind === 'tool' && s.backgroundId && STOP_TOOLS.has(s.tool ?? '') && s.ok !== false,
    );
    for (const call of session.steps.filter(
      (s) => s.kind === 'tool' && s.backgroundId && !TASK_REFS.has(s.tool ?? ''),
    )) {
      const notice = this.notifications
        .filter(
          (n) =>
            n.status !== undefined &&
            (n.taskId === call.backgroundId || n.toolUseId === call.id) &&
            n.ms >= call.startMs,
        )
        .sort((a, b) => a.ms - b.ms)[0];
      const stop = stops
        .filter((s) => s.backgroundId === call.backgroundId && s.startMs >= call.endMs)
        .sort((a, b) => a.endMs - b.endMs)[0];
      const stopped = stop !== undefined && (!notice || stop.endMs < notice.ms);
      let endMs = stopped ? stop.endMs : notice?.ms;
      let unfinished = false;
      const monitor = this.monitors.get(call.id);
      if (monitor) {
        // Killed at its timeout, which starts when the call returns. With no notice, it ran until
        // then, or until the transcript's last entry: Claude Code kills it when it exits.
        const deadline = Math.min(
          monitor.persistent ? Infinity : call.endMs + monitor.timeoutMs,
          this.lastMs,
        );
        if (endMs === undefined) unfinished = true;
        endMs = Math.min(endMs ?? Infinity, deadline);
      }
      if (endMs === undefined || endMs < call.startMs) continue;
      const step: Step = {
        id: `bg:${call.backgroundId}`,
        parentId: call.id,
        kind: 'background',
        startMs: call.startMs,
        endMs,
        flags: stopped
          ? ['background', 'interrupted']
          : unfinished
            ? ['background', 'unfinished']
            : ['background'],
        backgroundId: call.backgroundId,
      };
      if (call.tool) step.tool = call.tool;
      if (call.command) step.command = call.command;
      if (call.agentId) step.agentId = call.agentId;
      if (!stopped && notice?.status) step.ok = notice.status === 'completed';
      session.steps.push(step);
    }
  }

  /**
   * The model and tokens of the model call behind each model step. A step whose request was resent
   * starts at the send that was answered: model time covers generating, not resending.
   */
  private addModelDetails(session: Session): void {
    const byAgent = new Map<string, Message[]>();
    for (const message of this.messages.values()) {
      const key = message.agentId ?? '';
      byAgent.set(key, [...(byAgent.get(key) ?? []), message]);
    }
    for (const step of session.steps) {
      if (step.kind !== 'model') continue;
      const produced = step.produces?.[0];
      const use = produced ? this.toolUses.get(produced) : undefined;
      let message = use?.messageId ? this.messages.get(use.messageId) : undefined;
      if (!message && !produced) {
        message = (byAgent.get(step.agentId ?? '') ?? [])
          .filter((m) => m.lastMs >= step.startMs && m.lastMs <= step.endMs + 1)
          .sort((a, b) => b.lastMs - a.lastMs)[0];
      }
      if (message?.model) step.model = message.model;
      if (message?.tokens) step.tokens = message.tokens;
      const sent = message?.sentMs;
      if (sent !== undefined && sent > step.startMs && sent < step.endMs) {
        step.startMs = sent;
        step.flags.push('resent');
      }
    }
  }
}

function tokens(usage: Record<string, unknown>): TokenUsage {
  const n = (key: string) => (typeof usage[key] === 'number' ? (usage[key] as number) : 0);
  return {
    input: n('input_tokens'),
    output: n('output_tokens'),
    cacheRead: n('cache_read_input_tokens'),
    cacheWrite: n('cache_creation_input_tokens'),
  };
}

/** First line of text, tags removed, masked, at most 160 characters. */
function oneLine(text: string): string {
  const plain = text
    .replace(/<(system-reminder|local-command-caveat|command-message)>[\s\S]*?<\/\1>/g, ' ')
    .replace(/<command-name>([^<]*)<\/command-name>/g, '$1 ')
    .replace(/<\/?[a-z][a-z0-9_-]*(?:\s[^>]*)?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const masked = maskSecrets(plain);
  return masked.length > 160 ? masked.slice(0, 157) + '…' : masked;
}

function clip(text: string): string {
  if (text.length <= MAX_OUTPUT) return text;
  const head = text.slice(0, 1500);
  const tail = text.slice(-2400);
  return `${head}\n… ${text.length - head.length - tail.length} characters cut …\n${tail}`;
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.-]/).map((x) => Number.parseInt(x, 10) || 0);
  const pb = b.split(/[.-]/).map((x) => Number.parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
