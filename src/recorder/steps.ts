import type { Session, Step, StepFlag } from '../model/types';
import type { RecorderEvent } from './event';

/** Tools that start a subagent. `Task` is the older name of `Agent`. */
export const AGENT_TOOLS = new Set(['Agent', 'Task']);

/** An Agent call that returned this long before its subagent finished ran it in the background. */
const BACKGROUND_AGENT_MS = 1000;

interface Ctx {
  /** Subagent ID; undefined for the main agent. */
  agentId?: string;
  /** Where new steps nest: the open turn (main) or the subagent step. */
  parentId: string | null;
  /** When the current stretch of model time started; null outside model time. */
  modelStart: number | null;
  /** Model time cut short by a compaction, waiting for the call it produces. */
  modelParts: Step[];
  /** The model step that produced the batch in flight. */
  lastModel: Step | null;
  /** A batch of calls is in flight: no PostToolBatch since its first call. */
  batchOpen: boolean;
  open: Map<string, Step>;
  lastToolEnd: number | null;
}

/**
 * Builds a session's steps from its recorder events. See docs/hook-events.md for the timing rules.
 *
 * Model time runs whenever the agent has no call in flight: from the prompt, or from the moment its
 * last open call ends, to its next call or the end of the turn. Claude Code starts a call as soon as
 * the model has written it, so inside a batch the gap between one call ending and the next starting
 * is the model still writing the next call.
 */
export function eventsToSession(sessionId: string, events: RecorderEvent[]): Session {
  const sorted = events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => a.event.t - b.event.t || a.index - b.index)
    .map((x) => x.event);
  const builder = new Builder(sessionId);
  for (const event of sorted) builder.handle(event);
  return builder.finish();
}

class Builder {
  private readonly steps: Step[] = [];
  private readonly ctxs = new Map<string, Ctx>();
  private readonly main: Ctx;
  private readonly inputHash = new Map<Step, string | undefined>();
  private readonly approvalAt = new Map<Step, number>();
  private readonly agentCalls: Step[] = [];
  private readonly linkedCalls = new Set<string>();
  private readonly subagents = new Map<string, Step>();
  private readonly compactions: Step[] = [];
  /** Calls already ended, by ID: a PreToolUse stamped after its call's end finds it here. */
  private readonly ended = new Map<string, Step>();
  /** Calls a PostToolBatch ended before their PostToolUse: one stamped the same moment still comes. */
  private readonly endedByBatch = new Map<string, { ctx: Ctx; step: Step }>();
  private turn: Step | null = null;
  private compaction: Step | null = null;
  private lastTurnEnd: number | null = null;
  private startMs = Infinity;
  private endMs = -Infinity;
  private cwd: string | undefined;
  private transcriptPath: string | undefined;
  private counter = 0;

  constructor(private readonly sessionId: string) {
    this.main = this.newCtx(undefined, null);
    this.ctxs.set('main', this.main);
  }

  handle(e: RecorderEvent): void {
    this.startMs = Math.min(this.startMs, e.t);
    this.endMs = Math.max(this.endMs, e.t);
    if (e.cwd && !this.cwd) this.cwd = e.cwd;
    if (e.tp) this.transcriptPath = e.tp;
    switch (e.e) {
      case 'UserPromptSubmit':
        this.startTurn(e);
        break;
      case 'PreToolUse':
        this.preTool(e);
        break;
      case 'PermissionRequest':
        this.permission(e);
        break;
      case 'PermissionDenied':
        this.denied(e);
        break;
      case 'PostToolUse':
      case 'PostToolUseFailure':
        this.postTool(e);
        break;
      case 'PostToolBatch':
        this.batchDone(e);
        break;
      case 'SubagentStart':
        this.subagentStart(e);
        break;
      case 'SubagentStop':
        this.subagentStop(e);
        break;
      case 'Stop':
      case 'StopFailure':
        this.stop(e);
        break;
      case 'PreCompact':
        this.compactStart(e.t, e.trigger);
        break;
      case 'PostCompact':
        this.compactEnd(e.t);
        break;
      case 'SessionEnd':
        this.closeAll(e.t);
        break;
    }
  }

  finish(): Session {
    if (!Number.isFinite(this.startMs)) return this.session(0, 0);
    this.closeAll(this.endMs);
    this.dropLateCompactions();
    for (const step of this.steps) {
      if (step.endMs < step.startMs) step.endMs = step.startMs;
    }
    for (const sub of this.subagents.values()) {
      const call = this.agentCalls.find((c) => c.id === sub.parentId);
      if (
        call &&
        call.endMs + BACKGROUND_AGENT_MS < sub.endMs &&
        !sub.flags.includes('background')
      ) {
        sub.flags.push('background');
      }
    }
    // The session spans its steps: first prompt to last turn end (or the last subagent to finish).
    if (this.steps.length === 0) return this.session(this.startMs, this.endMs);
    return this.session(
      Math.min(...this.steps.map((s) => s.startMs)),
      Math.max(...this.steps.map((s) => s.endMs)),
    );
  }

  private session(startMs: number, endMs: number): Session {
    const session: Session = {
      id: this.sessionId,
      agent: 'claude-code',
      sources: ['recorder'],
      startMs,
      endMs,
      steps: this.steps,
    };
    if (this.cwd) session.cwd = this.cwd;
    if (this.transcriptPath) session.transcriptPath = this.transcriptPath;
    return session;
  }

  private newCtx(agentId: string | undefined, parentId: string | null): Ctx {
    return {
      agentId,
      parentId,
      modelStart: null,
      modelParts: [],
      lastModel: null,
      batchOpen: false,
      open: new Map(),
      lastToolEnd: null,
    };
  }

  private id(prefix: string): string {
    return `${prefix}:${++this.counter}`;
  }

  private push(step: Step): Step {
    this.steps.push(step);
    return step;
  }

  /** The context an event belongs to; a subagent's context is created on first sight. */
  private ctxFor(e: RecorderEvent): Ctx {
    if (!e.aid) return this.main;
    const existing = this.ctxs.get(e.aid);
    if (existing) return existing;
    this.openSubagent(e.aid, e.at, e.t);
    return this.ctxs.get(e.aid) as Ctx;
  }

  private openTurn(t: number, flags: StepFlag[] = []): void {
    // Only gaps between turns count as waiting; time before the first prompt and after the last turn doesn't.
    if (this.lastTurnEnd !== null && t > this.lastTurnEnd) this.addIdle(this.lastTurnEnd, t);
    this.turn = this.push({
      id: this.id('turn'),
      parentId: null,
      kind: 'turn',
      startMs: t,
      endMs: t,
      flags,
    });
    this.main.parentId = this.turn.id;
    this.main.modelParts = [];
    this.main.lastModel = null;
    this.main.batchOpen = false;
    this.main.lastToolEnd = null;
  }

  /**
   * Idle time between turns, with compactions you waited for (`/compact`) carved out of it. A
   * compaction while you're away stays in it.
   */
  private addIdle(from: number, to: number): void {
    let cursor = from;
    const cuts = this.compactions
      .filter(
        (c) =>
          c.parentId === null &&
          !c.flags.includes('background') &&
          c.endMs > from &&
          c.startMs < to,
      )
      .sort((a, b) => a.startMs - b.startMs);
    for (const cut of cuts) {
      if (cut.startMs > cursor) this.pushIdle(cursor, cut.startMs);
      cursor = Math.max(cursor, cut.endMs);
    }
    if (to > cursor) this.pushIdle(cursor, to);
  }

  private pushIdle(from: number, to: number): void {
    this.push({
      id: this.id('idle'),
      parentId: null,
      kind: 'idle',
      startMs: from,
      endMs: to,
      flags: [],
    });
  }

  private startTurn(e: RecorderEvent): void {
    if (this.turn) {
      // The previous turn never stopped: interrupted, or its Stop event was lost.
      this.closeModel(this.main, e.t, ['interrupted']);
      this.closeOpenTools(this.main, e.t, 'interrupted');
      this.closeTurn(e.t);
    }
    // Started by a background task's notice, or a notice from the app: not by your prompt.
    this.openTurn(e.t, e.src ? ['notification'] : []);
    this.main.modelStart = e.t;
  }

  private ensureTurn(t: number): void {
    if (!this.turn) this.openTurn(t);
  }

  private closeTurn(t: number): void {
    if (!this.turn) return;
    this.turn.endMs = Math.max(this.turn.endMs, t);
    this.lastTurnEnd = this.turn.endMs;
    this.turn = null;
  }

  /** Ends the current stretch of model time. Returns its steps (more than one if a compaction cut it). */
  private closeModel(ctx: Ctx, t: number, flags: StepFlag[]): Step[] {
    const segments = ctx.modelParts;
    ctx.modelParts = [];
    if (ctx.modelStart !== null && t >= ctx.modelStart) {
      segments.push(this.modelStep(ctx, ctx.modelStart, t));
    }
    ctx.modelStart = null;
    for (const segment of segments) {
      for (const flag of flags) if (!segment.flags.includes(flag)) segment.flags.push(flag);
    }
    return segments;
  }

  private modelStep(ctx: Ctx, start: number, end: number): Step {
    const step: Step = {
      id: this.id('model'),
      parentId: ctx.parentId,
      kind: 'model',
      startMs: start,
      endMs: end,
      flags: [],
    };
    if (ctx.agentId) step.agentId = ctx.agentId;
    return this.push(step);
  }

  private preTool(e: RecorderEvent): void {
    // Async hooks are spawned side by side, so a fast call's PostToolUse can be stamped before its
    // own PreToolUse. The call is already built from its duration: take what only this event has.
    const done = e.tuid ? this.ended.get(e.tuid) : undefined;
    if (done) {
      if (e.tool) done.tool ??= e.tool;
      if (e.cmd) done.command ??= e.cmd;
      if (e.files) done.files ??= e.files;
      if (e.act) done.actions ??= e.act;
      if (e.sub) done.agentType ??= e.sub;
      if (e.tool && AGENT_TOOLS.has(e.tool) && !this.agentCalls.includes(done)) {
        this.agentCalls.push(done);
      }
      return;
    }
    const ctx = this.ctxFor(e);
    if (!ctx.agentId) this.ensureTurn(e.t);
    let producers: Step[] = [];
    if (ctx.modelStart !== null || ctx.modelParts.length > 0) {
      producers = this.closeModel(ctx, e.t, []);
    } else if (ctx.batchOpen && ctx.lastModel) {
      // Started while another call of the batch was still running: written during that call.
      producers = [ctx.lastModel];
    }

    const step: Step = {
      id: e.tuid ?? this.id('tool'),
      parentId: ctx.parentId,
      kind: 'tool',
      startMs: e.t,
      endMs: e.t,
      flags: e.bg ? ['background'] : [],
    };
    if (e.tool) step.tool = e.tool;
    if (e.cmd) step.command = e.cmd;
    if (e.files) step.files = e.files;
    if (e.sub) step.agentType = e.sub;
    if (e.act) step.actions = e.act;
    if (e.bgid) step.backgroundId = e.bgid;
    if (ctx.agentId) step.agentId = ctx.agentId;
    for (const producer of producers) (producer.produces ??= []).push(step.id);
    if (producers.length > 0) ctx.lastModel = producers[producers.length - 1] ?? null;
    this.push(step);
    this.inputHash.set(step, e.ih);
    ctx.open.set(step.id, step);
    ctx.batchOpen = true;
    if (e.tool && AGENT_TOOLS.has(e.tool)) this.agentCalls.push(step);
  }

  private findOpen(id: string): { ctx: Ctx; step: Step } | undefined {
    for (const ctx of this.ctxs.values()) {
      const step = ctx.open.get(id);
      if (step) return { ctx, step };
    }
    return undefined;
  }

  private permission(e: RecorderEvent): void {
    const ctx = this.ctxFor(e);
    const candidates = [...ctx.open.values()].filter((s) => s.tool === e.tool).reverse();
    const step = candidates.find((s) => this.inputHash.get(s) === e.ih) ?? candidates[0];
    if (!step) return;
    if (!step.flags.includes('approval')) step.flags.push('approval');
    this.approvalAt.set(step, e.t);
  }

  private denied(e: RecorderEvent): void {
    const found = e.tuid ? this.findOpen(e.tuid) : undefined;
    if (!found) return;
    found.step.endMs = e.t;
    found.step.ok = false;
    found.step.flags.push('denied');
    this.toolClosed(found.ctx, found.step, e.t);
  }

  /** A call its batch ended first: the batch's hook was stamped at or before this call's own end. */
  private reopen(id: string): { ctx: Ctx; step: Step } | undefined {
    const found = this.endedByBatch.get(id);
    if (!found) return undefined;
    this.endedByBatch.delete(id);
    found.step.flags = found.step.flags.filter((flag) => flag !== 'unfinished');
    return found;
  }

  private postTool(e: RecorderEvent): void {
    const found = e.tuid ? (this.findOpen(e.tuid) ?? this.reopen(e.tuid)) : undefined;
    let ctx: Ctx;
    let step: Step;
    if (found) {
      ({ ctx, step } = found);
    } else {
      // No PreToolUse seen for this call: rebuild it from its duration.
      ctx = this.ctxFor(e);
      if (!ctx.agentId) this.ensureTurn(e.t);
      if (ctx.modelStart !== null) this.closeModel(ctx, e.t - (e.dur ?? 0), []);
      step = this.push({
        id: e.tuid ?? this.id('tool'),
        parentId: ctx.parentId,
        kind: 'tool',
        startMs: e.t - (e.dur ?? 0),
        endMs: e.t,
        flags: [],
      });
      if (e.tool) step.tool = e.tool;
      if (ctx.agentId) step.agentId = ctx.agentId;
      ctx.open.set(step.id, step);
    }
    step.endMs = Math.max(step.startMs, e.t);
    step.ok = e.ok === true && !e.intr;
    if (e.intr && !step.flags.includes('interrupted')) step.flags.push('interrupted');
    if (e.dur !== undefined) step.runMs = Math.min(e.dur, step.endMs - step.startMs);
    if (e.code !== undefined) step.exitCode = e.code;
    if (e.bgid) step.backgroundId = e.bgid;
    if (e.child) this.linkSubagent(e.child, step);
    const approvedAt = this.approvalAt.get(step);
    if (approvedAt !== undefined) {
      const total = step.endMs - step.startMs;
      step.waitMs =
        step.runMs !== undefined ? total - step.runMs : Math.max(0, step.endMs - approvedAt);
    }
    this.toolClosed(ctx, step, e.t);
  }

  private toolClosed(ctx: Ctx, step: Step, t: number): void {
    ctx.open.delete(step.id);
    this.ended.set(step.id, step);
    ctx.lastToolEnd = Math.max(ctx.lastToolEnd ?? t, t);
    if (ctx.open.size === 0) ctx.modelStart = t;
  }

  private batchDone(e: RecorderEvent): void {
    const ctx = this.ctxFor(e);
    const ids = new Set(e.ids ?? []);
    if (ids.size > 1) {
      for (const step of this.steps) {
        if (step.kind === 'tool' && ids.has(step.id) && !step.flags.includes('parallel')) {
          step.flags.push('parallel');
        }
      }
    }
    // Every call of a resolved batch has ended. One stopped before it ran (a deny rule, a hook, an
    // approval you rejected, input that failed validation) gets no PostToolUse: it ends here. One
    // whose PostToolUse was only stamped after the batch's takes its own end when that comes.
    for (const id of ids) {
      const found = this.findOpen(id);
      if (!found) continue;
      found.step.endMs = Math.max(found.step.startMs, e.t);
      if (!found.step.flags.includes('unfinished')) found.step.flags.push('unfinished');
      this.toolClosed(found.ctx, found.step, e.t);
      this.endedByBatch.set(id, found);
    }
    ctx.batchOpen = false;
    if (ctx.open.size === 0 && ctx.modelStart === null) ctx.modelStart = ctx.lastToolEnd ?? e.t;
  }

  private openSubagent(agentId: string, agentType: string | undefined, t: number): Step {
    const existing = this.subagents.get(agentId);
    if (existing) return existing;
    // The Agent call that started it: the latest unlinked one, preferring a matching subagent type.
    const unlinked = [...this.agentCalls].reverse().filter((c) => !this.linkedCalls.has(c.id));
    const call = unlinked.find((c) => c.agentType === agentType) ?? unlinked[0];
    const step: Step = {
      id: `agent:${agentId}`,
      parentId: call?.id ?? this.turn?.id ?? null,
      kind: 'subagent',
      startMs: t,
      endMs: t,
      flags: call?.flags.includes('background') ? ['background'] : [],
      agentId,
    };
    if (agentType) step.agentType = agentType;
    if (call) this.linkedCalls.add(call.id);
    this.subagents.set(agentId, step);
    this.ctxs.set(agentId, this.newCtx(agentId, step.id));
    return this.push(step);
  }

  /** PostToolUse of an Agent call names the subagent it ran; fix the link if the guess was wrong. */
  private linkSubagent(agentId: string, call: Step): void {
    const sub = this.subagents.get(agentId);
    if (!sub || sub.parentId === call.id) return;
    if (sub.parentId) this.linkedCalls.delete(sub.parentId);
    this.linkedCalls.add(call.id);
    sub.parentId = call.id;
  }

  private subagentStart(e: RecorderEvent): void {
    if (!e.aid) return;
    const seen = this.ctxs.has(e.aid);
    const sub = this.openSubagent(e.aid, e.at, e.t);
    const ctx = this.ctxs.get(e.aid);
    if (!seen && ctx) ctx.modelStart = e.t;
    sub.startMs = Math.min(sub.startMs, e.t);
  }

  private subagentStop(e: RecorderEvent): void {
    if (!e.aid) return;
    const ctx = this.ctxs.get(e.aid);
    const sub = this.subagents.get(e.aid);
    if (ctx) {
      this.closeModel(ctx, e.t, ['answer']);
      this.closeOpenTools(ctx, e.t, 'unfinished');
    }
    if (sub) sub.endMs = Math.max(sub.endMs, e.t);
  }

  private stop(e: RecorderEvent): void {
    const flags: StepFlag[] = e.e === 'StopFailure' ? ['answer', 'api-error'] : ['answer'];
    this.closeModel(this.main, e.t, flags);
    this.closeOpenTools(this.main, e.t, 'unfinished');
    this.closeTurn(e.t);
  }

  /**
   * A compaction with no turn open that you didn't ask for is an idle compaction: Claude Code
   * compacts a session left idle before its prompt cache expires. It runs while you're away and
   * holds nothing up, so it's flagged background.
   */
  private compactStart(t: number, trigger?: string): void {
    if (this.turn && this.main.modelStart !== null) {
      this.main.modelParts.push(this.modelStep(this.main, this.main.modelStart, t));
      this.main.modelStart = null;
    }
    this.compaction = this.newCompaction(t, !this.turn && trigger !== 'manual');
  }

  private newCompaction(t: number, idle: boolean): Step {
    const step = this.push({
      id: this.id('compact'),
      parentId: this.turn?.id ?? null,
      kind: 'compact',
      startMs: t,
      endMs: t,
      flags: idle ? ['background'] : [],
    });
    this.compactions.push(step);
    return step;
  }

  private compactEnd(t: number): void {
    const compaction = this.compaction;
    if (!compaction) return;
    compaction.endMs = t;
    this.compaction = null;
    if (this.turn && compaction.flags.includes('background') && this.turn.startMs < t) {
      // You came back while it ran: from your prompt on, your turn waited for it.
      compaction.endMs = Math.max(compaction.startMs, this.turn.startMs);
      this.newCompaction(compaction.endMs, false).endMs = t;
    }
    if (this.turn && this.main.open.size === 0) this.main.modelStart = t;
  }

  /**
   * Time after the last turn isn't part of the session, and neither is a compaction while you were
   * away then: it doesn't stretch the session.
   */
  private dropLateCompactions(): void {
    const lastTurnEnd = this.lastTurnEnd;
    if (lastTurnEnd === null) return;
    const late = new Set(
      this.compactions.filter((c) => c.flags.includes('background') && c.startMs >= lastTurnEnd),
    );
    if (late.size === 0) return;
    const kept = this.steps.filter((s) => !late.has(s));
    this.steps.length = 0;
    this.steps.push(...kept);
  }

  private closeOpenTools(ctx: Ctx, t: number, flag: StepFlag): void {
    for (const step of ctx.open.values()) {
      step.endMs = Math.max(step.startMs, t);
      if (!step.flags.includes(flag)) step.flags.push(flag);
    }
    ctx.open.clear();
  }

  /** Session end, or end of data: close everything still open at t. */
  private closeAll(t: number): void {
    if (this.compaction) this.compactEnd(t);
    for (const [key, ctx] of this.ctxs) {
      if (key === 'main') continue;
      this.closeModel(ctx, t, ['unfinished']);
      this.closeOpenTools(ctx, t, 'unfinished');
      const sub = this.subagents.get(key);
      if (sub && sub.endMs === sub.startMs && t > sub.startMs) sub.endMs = t;
    }
    if (this.turn) {
      this.closeModel(this.main, t, ['unfinished']);
      this.closeOpenTools(this.main, t, 'unfinished');
      this.closeTurn(t);
    }
  }
}
