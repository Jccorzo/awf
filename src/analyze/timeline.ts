// Gives every instant of a session exactly one phase, so phase times add up to the session's total.
// See docs/phases.md, "Overlaps and waiting".
import type { ClassifiedSession, ClassifiedStep } from '../classify/classify';
import { PHASES, type PhaseId, RANK } from '../classify/phases';

/**
 * Foreground work beats background work, which beats idle time between turns. A process left
 * running in the background that is Running scripts or Unclassified (a dev server, a watcher, a
 * poller) ranks last: it isn't work you wait on.
 */
const FOREGROUND = 0;
const BACKGROUND = 1;
const IDLE = 2;
const SERVICE = 3;

const isBackground = (step: ClassifiedStep, background: (s: ClassifiedStep) => boolean) =>
  step.kind === 'background' || background(step);

/**
 * A background shell running a server, a watcher or anything awf has no rule for. A Monitor's
 * command is a watcher by design (each line it prints is an event), whatever it runs: a poller,
 * or a `tail -F` that would otherwise count as Exploring.
 */
const isService = (step: ClassifiedStep) =>
  (step.kind === 'background' || step.flags.includes('background')) &&
  (step.phase === 'running' ||
    step.phase === 'unclassified' ||
    (step.kind === 'background' && step.tool === 'Monitor'));

export interface Interval {
  start: number;
  end: number;
  phase: PhaseId;
  tier: number;
  stepId: string;
}

export interface PhaseTotals {
  totalMs: number;
  byPhase: Record<PhaseId, number>;
  /** Time inside the session that no step covered (agent overhead); counted as Unclassified. */
  uncoveredMs: number;
  /**
   * The part of uncoveredMs before a request that was answered only after being sent again (an API
   * error, a timeout, a rate limit): the agent waited on the API.
   */
  resendMs: number;
  /** Time between turns that background work took (any phase but Waiting on you). */
  awayWorkMs: number;
}

/** The leaf intervals of a session: what was running when, at which tier. */
export function intervals(session: ClassifiedSession): Interval[] {
  const byId = new Map(session.steps.map((s) => [s.id, s]));
  const background = (step: ClassifiedStep): boolean => {
    if (step.flags.includes('background') || step.kind === 'background') return true;
    // Steps inside a background subagent run in the background too.
    let parent = step.parentId ? byId.get(step.parentId) : undefined;
    for (let depth = 0; parent && depth < 8; depth++) {
      if (parent.kind === 'subagent' && parent.flags.includes('background')) return true;
      parent = parent.parentId ? byId.get(parent.parentId) : undefined;
    }
    return false;
  };
  const out: Interval[] = [];
  for (const step of session.steps) {
    if (!step.phase || step.endMs <= step.startMs) continue;
    if (step.kind === 'turn' || step.kind === 'subagent') continue;
    const tier =
      step.kind === 'idle'
        ? IDLE
        : isBackground(step, background)
          ? step.phase === 'unclassified' || isService(step)
            ? SERVICE
            : BACKGROUND
          : FOREGROUND;
    const wait =
      step.kind === 'tool' && step.waitMs ? Math.min(step.waitMs, step.endMs - step.startMs) : 0;
    if (wait > 0) {
      out.push({
        start: step.startMs,
        end: step.startMs + wait,
        phase: 'waiting',
        tier,
        stepId: step.id,
      });
      if (step.startMs + wait < step.endMs) {
        out.push({
          start: step.startMs + wait,
          end: step.endMs,
          phase: step.phase,
          tier,
          stepId: step.id,
        });
      }
    } else {
      out.push({ start: step.startMs, end: step.endMs, phase: step.phase, tier, stepId: step.id });
    }
  }
  return out;
}

const PHASE_INDEX = new Map(PHASES.map((p, i) => [p.id, i]));

/** A stretch of the session with one phase. Uncovered stretches (no step running) are Unclassified. */
export interface Segment {
  start: number;
  end: number;
  phase: PhaseId;
  covered: boolean;
}

/**
 * Sweeps the session's timeline, giving each instant to the best interval running then. Returns
 * the stretches in order, adjacent ones with the same phase merged; together they cover the session.
 */
export function phaseSegments(session: ClassifiedSession): Segment[] {
  const start = session.startMs;
  const end = sessionEnd(session);
  const events: Array<{ t: number; key: number; delta: number }> = [];
  for (const iv of intervals(session)) {
    const a = Math.max(iv.start, start);
    const b = Math.min(iv.end, end);
    if (b <= a) continue;
    const key = iv.tier * 100 + (PHASE_INDEX.get(iv.phase) ?? 0);
    events.push({ t: a, key, delta: 1 }, { t: b, key, delta: -1 });
  }
  events.sort((x, y) => x.t - y.t || x.delta - y.delta);
  const active = new Map<number, number>();
  const segments: Segment[] = [];
  let cursor = start;
  const best = (): PhaseId | undefined => {
    let chosen: { tier: number; phase: PhaseId } | undefined;
    for (const [key, count] of active) {
      if (count <= 0) continue;
      const tier = Math.floor(key / 100);
      const phase = PHASES[key % 100]?.id as PhaseId;
      if (
        !chosen ||
        tier < chosen.tier ||
        (tier === chosen.tier && RANK[phase] > RANK[chosen.phase])
      ) {
        chosen = { tier, phase };
      }
    }
    return chosen?.phase;
  };
  const credit = (until: number) => {
    if (until <= cursor) return;
    const phase = best();
    const covered = phase !== undefined;
    const last = segments.at(-1);
    if (
      last &&
      last.end === cursor &&
      last.phase === (phase ?? 'unclassified') &&
      last.covered === covered
    ) {
      last.end = until;
    } else {
      segments.push({ start: cursor, end: until, phase: phase ?? 'unclassified', covered });
    }
    cursor = until;
  };
  for (const event of events) {
    credit(event.t);
    active.set(event.key, (active.get(event.key) ?? 0) + event.delta);
  }
  credit(end);
  return segments;
}

/**
 * Where the session ends for its phase times: its last step, except that a background process
 * still running after everything else (a dev server left on) doesn't stretch it.
 */
export function sessionEnd(session: ClassifiedSession): number {
  const start = session.startMs;
  const end = Math.max(session.endMs, start);
  let lastService = -Infinity;
  let lastOther = start;
  for (const step of session.steps) {
    if (isService(step)) lastService = Math.max(lastService, step.endMs);
    else lastOther = Math.max(lastOther, step.endMs);
  }
  // Only when that background work is what the session's end came from.
  return lastService > lastOther && end > lastOther && end <= lastService ? lastOther : end;
}

/** Phase times that add up to the session's total. */
export function phaseTotals(session: ClassifiedSession): PhaseTotals {
  const byPhase = Object.fromEntries(PHASES.map((p) => [p.id, 0])) as Record<PhaseId, number>;
  let uncoveredMs = 0;
  let awayWorkMs = 0;
  let resendMs = 0;
  const resent = new Set(
    session.steps
      .filter((s) => s.kind === 'model' && s.flags.includes('resent'))
      .map((s) => s.startMs),
  );
  const gaps = session.steps
    .filter((s) => s.kind === 'idle' && s.endMs > s.startMs)
    .sort((a, b) => a.startMs - b.startMs);
  let g = 0;
  for (const segment of phaseSegments(session)) {
    byPhase[segment.phase] += segment.end - segment.start;
    if (!segment.covered) {
      uncoveredMs += segment.end - segment.start;
      if (resent.has(segment.end)) resendMs += segment.end - segment.start;
    }
    if (segment.phase === 'waiting') continue;
    // Work done while the agent waited for your next prompt: the segment's overlap with idle gaps.
    while (g < gaps.length && (gaps[g] as ClassifiedStep).endMs <= segment.start) g++;
    for (let k = g; k < gaps.length && (gaps[k] as ClassifiedStep).startMs < segment.end; k++) {
      const gap = gaps[k] as ClassifiedStep;
      awayWorkMs += Math.max(
        0,
        Math.min(segment.end, gap.endMs) - Math.max(segment.start, gap.startMs),
      );
    }
  }
  return {
    totalMs: sessionEnd(session) - session.startMs,
    byPhase,
    uncoveredMs,
    resendMs,
    awayWorkMs,
  };
}
