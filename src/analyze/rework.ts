// Rework: after a lint, test or build check fails, the edits (and the model time before them) until
// that same check passes, or the session ends, count as rework for it.
import type { ClassifiedSession, ClassifiedStep } from '../classify/classify';
import { type PhaseId, topPhase } from '../classify/phases';
import { AGENT_TOOLS } from '../recorder/steps';

export interface ReworkWindow {
  /** The check that failed, like "tests:vitest". */
  check: string;
  failedStepId: string;
  failedAtMs: number;
  /** When the same check passed again; undefined if it never did in this session. */
  passedAtMs?: number;
  /** Edits counted as rework for this failure. */
  edits: number;
}

export interface ReworkResult {
  session: ClassifiedSession;
  windows: ReworkWindow[];
}

const EDIT_PHASES = new Set<PhaseId>(['writing-code', 'writing-tests']);

function isEdit(step: ClassifiedStep): boolean {
  return (
    (step.kind === 'tool' || step.kind === 'background') &&
    !!step.phase &&
    EDIT_PHASES.has(step.phase)
  );
}

/** Relabels edits made while a failed check was waiting to pass. */
export function detectRework(input: ClassifiedSession): ReworkResult {
  const steps = input.steps.map((s) => ({ ...s, tags: [...s.tags] }));
  const session: ClassifiedSession = { ...input, steps };
  const ordered = steps
    .filter((s) => s.kind === 'tool' || s.kind === 'background')
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const open = new Map<string, ReworkWindow>();
  const windows: ReworkWindow[] = [];

  for (const step of ordered) {
    if (isEdit(step) && open.size > 0) {
      // The most recent failure this edit follows.
      const window = [...open.values()]
        .filter((w) => w.failedAtMs <= step.startMs)
        .sort((a, b) => b.failedAtMs - a.failedAtMs)[0];
      if (window) {
        step.tags.push(`was:${step.phase}`);
        step.phase = 'rework';
        step.reworkFor = window.check;
        window.edits++;
      }
    }
    for (const check of step.checks) {
      const current = open.get(check.key);
      if (check.failed) {
        if (!current) {
          const window: ReworkWindow = {
            check: check.key,
            failedStepId: step.id,
            failedAtMs: step.endMs,
            edits: 0,
          };
          open.set(check.key, window);
          windows.push(window);
        }
      } else if (current && !step.flags.includes('interrupted')) {
        current.passedAtMs = step.endMs;
        open.delete(check.key);
      }
    }
  }

  // Model time before a rework edit is rework too (rule 1, on the relabelled calls).
  const byId = new Map(steps.map((s) => [s.id, s]));
  for (const step of steps) {
    if (step.kind !== 'model' || !step.produces?.length) continue;
    const phases: PhaseId[] = [];
    for (const id of step.produces) {
      const produced = byId.get(id);
      if (!produced) continue;
      if (produced.tool && AGENT_TOOLS.has(produced.tool)) phases.push('planning');
      else if (produced.phase === 'waiting') phases.push('planning');
      else if (produced.phase) phases.push(produced.phase);
    }
    const phase = topPhase(phases);
    if (phase === 'rework' && step.phase !== 'rework') {
      step.tags.push(`was:${step.phase}`);
      step.phase = 'rework';
      step.reworkFor = step.produces.map((id) => byId.get(id)?.reworkFor).find(Boolean);
    }
  }
  return { session, windows };
}
