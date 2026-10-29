// What the importers for other agents share. Each one reads a session's own log into recorder
// events, and the recorder's step builder makes the steps, so every agent's timings follow the
// same rules: model time is time with no call in flight, idle time sits between turns.
import { cleanCommand, maskSecrets } from '../model/mask';
import type {
  AgentName,
  Session,
  SessionDiagnostics,
  StepDetail,
  TokenUsage,
} from '../model/types';
import type { RecorderEvent } from '../recorder/event';
import { eventsToSession } from '../recorder/steps';

export type Json = Record<string, unknown>;

export function obj(value: unknown): Json | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Json)
    : undefined;
}

export function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export interface ImportOptions {
  /** Also read the first prompt, call descriptions and output, masked: only the report asks. */
  detail?: boolean;
}

const MAX_OUTPUT = 4000;

/** Long output keeps its start and its end, where the failures usually are. */
export function clipOutput(text: string): string {
  if (text.length <= MAX_OUTPUT) return text;
  const head = text.slice(0, 1500);
  const tail = text.slice(-2400);
  return `${head}\n… ${text.length - head.length - tail.length} characters cut …\n${tail}`;
}

/** First line of a prompt, masked, at most 160 characters. */
export function oneLine(text: string): string {
  const plain = maskSecrets(text.replace(/\s+/g, ' ').trim());
  return plain.length > 160 ? plain.slice(0, 157) + '…' : plain;
}

/** `["bash", "-lc", "npm test"]` is the command `npm test`. */
export function commandFromArgv(argv: unknown): string | undefined {
  if (typeof argv === 'string') return argv;
  if (!Array.isArray(argv) || !argv.every((a) => typeof a === 'string')) return undefined;
  const words = argv as string[];
  if (words.length >= 3 && /^(ba|z|da|k)?sh$/.test(words[0]?.split('/').pop() ?? '')) {
    const flag = words[1] ?? '';
    if (/^-[a-z]*c[a-z]*$/.test(flag)) return words[2];
  }
  return words
    .map((w) => (/^[\w@%+=:,./-]+$/.test(w) ? w : `'${w.replace(/'/g, `'\\''`)}'`))
    .join(' ');
}

/** A tool call, with Claude Code's tool name for what it does, so the phase rules apply. */
export interface Call {
  id: string;
  tool: string;
  command?: string;
  files?: string[];
  /** Agent calls: the subagent type. */
  sub?: string;
  /** Set when the call ran inside a subagent. */
  agentId?: string;
  description?: string;
}

export interface CallResult {
  ok: boolean;
  code?: number;
  /** Run time without waiting, when the agent logs it. */
  durMs?: number;
  interrupted?: boolean;
  output?: string;
  agentId?: string;
}

/** Collects one session's events in time order, with the details only the report shows. */
export class SessionLog {
  private readonly events: RecorderEvent[] = [];
  private readonly details = new Map<string, StepDetail>();
  private readonly usages: Array<{
    ms: number;
    tokens: TokenUsage;
    model?: string;
    agentId?: string;
  }> = [];
  private turnOpen = false;
  private lastMs = -Infinity;
  title?: string;
  cwd?: string;
  version?: string;
  readonly diagnostics: SessionDiagnostics = { unknownEntries: {}, badLines: 0, warnings: [] };

  constructor(
    private readonly id: string,
    private readonly agent: AgentName,
    private readonly options: ImportOptions,
  ) {}

  private emit(event: Omit<RecorderEvent, 'v' | 'sid'>): void {
    this.events.push({ v: 1, sid: this.id, ...event } as RecorderEvent);
    this.lastMs = Math.max(this.lastMs, event.t);
  }

  get latest(): number {
    return this.lastMs;
  }

  unknown(kind: string): void {
    this.diagnostics.unknownEntries[kind] = (this.diagnostics.unknownEntries[kind] ?? 0) + 1;
  }

  /** You sent a prompt: the open turn ends where its last activity did, and a new one starts. */
  prompt(ms: number, text?: string): void {
    this.stop();
    this.turnOpen = true;
    this.emit({ e: 'UserPromptSubmit', t: ms });
    if (this.options.detail && !this.title && text?.trim()) this.title = oneLine(text);
  }

  start(ms: number, call: Call): void {
    if (!this.turnOpen && !call.agentId) this.prompt(ms);
    const event: Omit<RecorderEvent, 'v' | 'sid'> = {
      e: 'PreToolUse',
      t: ms,
      tool: call.tool,
      tuid: call.id,
    };
    if (call.command) event.cmd = cleanCommand(call.command);
    if (call.files?.length) event.files = call.files;
    if (call.sub) event.sub = call.sub;
    if (call.agentId) event.aid = call.agentId;
    this.emit(event);
    if (this.options.detail && call.description)
      this.detail(call.id).description = oneLine(call.description);
  }

  end(ms: number, id: string, result: CallResult): void {
    const event: Omit<RecorderEvent, 'v' | 'sid'> = {
      e: result.ok ? 'PostToolUse' : 'PostToolUseFailure',
      t: ms,
      tuid: id,
      ok: result.ok,
    };
    if (result.code !== undefined) event.code = result.code;
    if (result.durMs !== undefined) event.dur = Math.max(0, Math.round(result.durMs));
    if (result.interrupted) event.intr = true;
    if (result.agentId) event.aid = result.agentId;
    this.emit(event);
    if (this.options.detail && result.output)
      this.detail(id).output = clipOutput(maskSecrets(result.output));
  }

  subagentStart(ms: number, agentId: string, type?: string): void {
    this.emit({ e: 'SubagentStart', t: ms, aid: agentId, ...(type ? { at: type } : {}) });
  }

  subagentStop(ms: number, agentId: string, type?: string): void {
    this.emit({ e: 'SubagentStop', t: ms, aid: agentId, ...(type ? { at: type } : {}) });
  }

  /** Tokens of one model call, reported when it finished: the turn lasts at least until then. */
  usage(ms: number, tokens: TokenUsage, model?: string, agentId?: string): void {
    this.usages.push({ ms, tokens, ...(model ? { model } : {}), ...(agentId ? { agentId } : {}) });
    if (!agentId) this.lastMs = Math.max(this.lastMs, ms);
  }

  /** The agent was still working at `ms` (a reply logged without a tool call). */
  active(ms: number): void {
    this.lastMs = Math.max(this.lastMs, ms);
  }

  /** The turn ends: at `ms`, or at its last activity. */
  stop(ms?: number): void {
    if (!this.turnOpen) return;
    this.turnOpen = false;
    this.emit({ e: 'Stop', t: Math.max(ms ?? this.lastMs, this.lastMs) });
  }

  private detail(id: string): StepDetail {
    let detail = this.details.get(id);
    if (!detail) this.details.set(id, (detail = {}));
    return detail;
  }

  build(file: string): Session {
    this.stop();
    // Stable sort: events at the same instant keep the order they were logged in.
    const events = this.events
      .map((event, i) => ({ event, i }))
      .sort((a, b) => a.event.t - b.event.t || a.i - b.i)
      .map((x) => x.event);
    const session = eventsToSession(this.id, events);
    session.agent = this.agent;
    session.sources = ['transcript'];
    session.transcriptPath = file;
    if (this.cwd) session.cwd = this.cwd;
    if (this.version) session.agentVersion = this.version;
    if (this.title) session.title = this.title;
    session.diagnostics = this.diagnostics;
    // Each model call's tokens go to the model step that ended last before they were reported.
    const models = session.steps
      .filter((s) => s.kind === 'model')
      .sort((a, b) => a.endMs - b.endMs);
    for (const usage of this.usages) {
      const step = models
        .filter(
          (s) =>
            !s.tokens && (s.agentId ?? '') === (usage.agentId ?? '') && s.endMs <= usage.ms + 1000,
        )
        .at(-1);
      if (!step) continue;
      step.tokens = usage.tokens;
      if (usage.model) step.model = usage.model;
    }
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
}
