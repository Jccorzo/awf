import { type ClassifiedSession, classifySession } from '../classify/classify';
import { PHASE_LABEL, PHASES, type PhaseId } from '../classify/phases';
import type { Files } from '../classify/resolve';
import type { Rules } from '../classify/rules';
import { formatDuration } from '../model/time';
import type { Session, TokenUsage } from '../model/types';
import { detectRework, type ReworkWindow } from './rework';
import { phaseTotals } from './timeline';

export interface PhaseLine {
  phase: PhaseId;
  label: string;
  ms: number;
  share: number;
  /** Lint, tests, build: check runs and how many failed. */
  runs?: number;
  failed?: number;
  /** Writing and rework: edits. */
  edits?: number;
  /** Rework: failures that led to rework. */
  failures?: number;
  /** Exploring: calls. */
  calls?: number;
  /** Waiting on you: approvals, questions and idle gaps between turns. */
  approvals?: number;
  questions?: number;
  gaps?: number;
  /** Unclassified: steps. */
  steps?: number;
}

export interface Summary {
  id: string;
  title?: string;
  cwd?: string;
  agentVersion?: string;
  sources: string[];
  startMs: number;
  endMs: number;
  totalMs: number;
  /** Total without the idle time between turns. */
  activeMs: number;
  phases: PhaseLine[];
  modelCalls: number;
  toolCalls: number;
  subagents: number;
  failures: number;
  tokens?: TokenUsage;
  rework: ReworkWindow[];
  /** Time inside the session no step covered (agent overhead), included in Unclassified. */
  uncoveredMs: number;
}

export interface Analysis {
  session: ClassifiedSession;
  summary: Summary;
}

/** Classifies a session, detects rework and sums phase times: everything the outputs read. */
export function analyze(
  session: Session,
  options: { files?: Files; rules?: Rules } = {},
): Analysis {
  return summarize(classifySession(session, options));
}

export function summarize(classified: ClassifiedSession): Analysis {
  const { session, windows } = detectRework(classified);
  const totals = phaseTotals(session);
  const tools = session.steps.filter((s) => s.kind === 'tool');
  const count = (phase: PhaseId) => tools.filter((s) => s.phase === phase).length;
  const runners = session.steps.filter(
    (s) => (s.kind === 'tool' || s.kind === 'background') && s.checks.length > 0,
  );
  const checks = runners.flatMap((s) => s.checks);
  const phases: PhaseLine[] = PHASES.map(({ id, label }) => {
    const ms = totals.byPhase[id];
    const line: PhaseLine = {
      phase: id,
      label,
      ms,
      share: totals.totalMs > 0 ? ms / totals.totalMs : 0,
    };
    if (id === 'lint' || id === 'tests' || id === 'build') {
      // One command is one run, however many tools it ran: `pnpm lint` is one lint run.
      const runs = runners.filter((s) => s.checks.some((c) => c.phase === id));
      line.runs = runs.length;
      line.failed = runs.filter((s) => s.checks.some((c) => c.phase === id && c.failed)).length;
    } else if (id === 'writing-code' || id === 'writing-tests') {
      line.edits = count(id);
    } else if (id === 'rework') {
      line.edits = count('rework');
      line.failures = windows.filter((w) => w.edits > 0).length;
    } else if (id === 'exploring') {
      line.calls = count('exploring');
    } else if (id === 'waiting') {
      line.approvals = tools.filter((s) => s.flags.includes('approval')).length;
      line.questions = tools.filter((s) => s.tool === 'AskUserQuestion').length;
      line.gaps = session.steps.filter((s) => s.kind === 'idle').length;
    } else if (id === 'unclassified') {
      line.steps = session.steps.filter((s) => s.phase === 'unclassified').length;
    }
    return line;
  });
  const idleMs = session.steps
    .filter((s) => s.kind === 'idle')
    .reduce((n, s) => n + (s.endMs - s.startMs), 0);
  const tokens = session.steps.reduce<TokenUsage | undefined>((sum, s) => {
    if (!s.tokens) return sum;
    const base = sum ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    return {
      input: base.input + s.tokens.input,
      output: base.output + s.tokens.output,
      cacheRead: base.cacheRead + s.tokens.cacheRead,
      cacheWrite: base.cacheWrite + s.tokens.cacheWrite,
    };
  }, undefined);
  const summary: Summary = {
    id: session.id,
    sources: session.sources,
    startMs: session.startMs,
    endMs: session.startMs + totals.totalMs,
    totalMs: totals.totalMs,
    activeMs: Math.max(0, totals.totalMs - idleMs),
    phases,
    modelCalls: session.steps.filter((s) => s.kind === 'model').length,
    toolCalls: tools.length,
    subagents: session.steps.filter((s) => s.kind === 'subagent').length,
    failures: checks.filter((c) => c.failed).length,
    rework: windows,
    uncoveredMs: totals.uncoveredMs,
  };
  if (session.title) summary.title = session.title;
  if (session.cwd) summary.cwd = session.cwd;
  if (session.agentVersion) summary.agentVersion = session.agentVersion;
  if (tokens) summary.tokens = tokens;
  return { session, summary };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "3 runs, 2 failed", "11 edits after 4 failed checks", ... */
export function phaseDetail(line: PhaseLine): string {
  switch (line.phase) {
    case 'lint':
    case 'tests':
    case 'build':
      return line.runs
        ? `${plural(line.runs, 'run')}${line.failed ? `, ${line.failed} failed` : ''}`
        : '';
    case 'writing-code':
    case 'writing-tests':
      return line.edits ? plural(line.edits, 'edit') : '';
    case 'rework':
      return line.edits
        ? `${plural(line.edits, 'edit')} after ${plural(line.failures ?? 0, 'failed check')}`
        : '';
    case 'exploring':
      return line.calls ? plural(line.calls, 'call') : '';
    case 'waiting': {
      const parts = [
        line.approvals ? plural(line.approvals, 'approval') : '',
        line.questions ? plural(line.questions, 'question') : '',
        line.gaps ? plural(line.gaps, 'idle gap') : '',
      ].filter(Boolean);
      return parts.join(', ');
    }
    case 'unclassified':
      return line.steps ? plural(line.steps, 'step') : '';
    default:
      return '';
  }
}

/** Phases always shown, even at zero: the plan's summary always lists rework, waiting and unclassified. */
const ALWAYS = new Set<PhaseId>(['rework', 'waiting', 'unclassified']);

/** "Build  6m 10s · 28% · 3 runs, 2 failed", one line per phase, then the total. */
export function formatSummaryLines(summary: Summary): string[] {
  const lines = summary.phases.filter((p) => p.ms > 0 || ALWAYS.has(p.phase));
  const labelWidth = Math.max(...lines.map((p) => PHASE_LABEL[p.phase].length), 'Total'.length);
  const timeWidth = Math.max(
    ...lines.map((p) => formatDuration(p.ms).length),
    formatDuration(summary.totalMs).length,
  );
  const out = lines.map((p) => {
    const pct = `${Math.round(p.share * 100)}%`.padStart(4);
    const detail = phaseDetail(p);
    return `${p.label.padEnd(labelWidth)}  ${formatDuration(p.ms).padStart(timeWidth)} · ${pct}${detail ? ` · ${detail}` : ''}`;
  });
  const totals = [
    plural(summary.modelCalls, 'model call'),
    plural(summary.toolCalls, 'tool call'),
    ...(summary.subagents ? [plural(summary.subagents, 'subagent')] : []),
    plural(summary.failures, 'failure'),
  ];
  out.push(
    `${'Total'.padEnd(labelWidth)}  ${formatDuration(summary.totalMs).padStart(timeWidth)} · 100% · ${totals.join(', ')}`,
  );
  return out;
}
