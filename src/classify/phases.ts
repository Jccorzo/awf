// The phases of docs/phases.md. Don't add one without asking (CLAUDE.md).

export type PhaseId =
  | 'writing-code'
  | 'writing-tests'
  | 'lint'
  | 'tests'
  | 'build'
  | 'rework'
  | 'exploring'
  | 'running'
  | 'planning'
  | 'waiting'
  | 'unclassified';

export type CheckPhase = 'lint' | 'tests' | 'build';

export const PHASES: Array<{ id: PhaseId; label: string }> = [
  { id: 'writing-code', label: 'Writing code' },
  { id: 'writing-tests', label: 'Writing tests' },
  { id: 'lint', label: 'Lint and format' },
  { id: 'tests', label: 'Running tests' },
  { id: 'build', label: 'Build' },
  { id: 'rework', label: 'Rework' },
  { id: 'exploring', label: 'Exploring' },
  { id: 'running', label: 'Running scripts' },
  { id: 'planning', label: 'Planning and answering' },
  { id: 'waiting', label: 'Waiting on you' },
  { id: 'unclassified', label: 'Unclassified' },
];

export const PHASE_LABEL = Object.fromEntries(PHASES.map((p) => [p.id, p.label])) as Record<
  PhaseId,
  string
>;

export function isCheckPhase(phase: string | undefined): phase is CheckPhase {
  return phase === 'lint' || phase === 'tests' || phase === 'build';
}

/**
 * Rank used when one command or one instant has several phases (docs/phases.md, rule 2 and overlaps).
 * Higher wins.
 */
export const RANK: Record<PhaseId, number> = {
  build: 11,
  tests: 10,
  lint: 9,
  rework: 8,
  'writing-tests': 7,
  'writing-code': 6,
  running: 5,
  exploring: 4,
  planning: 3,
  waiting: 2,
  unclassified: 1,
};

export function topPhase(phases: Iterable<PhaseId>): PhaseId | undefined {
  let best: PhaseId | undefined;
  for (const phase of phases) if (!best || RANK[phase] > RANK[best]) best = phase;
  return best;
}
