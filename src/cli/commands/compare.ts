import { summarize, type Summary } from '../../analyze/summary';
import { PHASES, type PhaseId } from '../../classify/phases';
import { formatClock, formatDuration, parseSince } from '../../model/time';
import type { Session } from '../../model/types';
import { classifier, loadMany, loadOne } from '../load';
import type { Command, Ctx, Options } from '../main';
import { table } from '../table';

/** One side of a comparison: a session, or every session in a time range, summed. */
export interface Side {
  label: string;
  sessions: number;
  totalMs: number;
  /** Time inside turns, and background work between them (see Summary). */
  turnsMs: number;
  awayWorkMs: number;
  phases: Array<{ phase: PhaseId; label: string; ms: number; share: number }>;
  modelCalls: number;
  toolCalls: number;
  failures: number;
  reworkLoops: number;
}

const DAY = 86_400_000;

/** `2026-10-01..2026-10-15`, `2026-10-01`, `7d`, `14d..7d`: a time range, or undefined for a session. */
export function parseRange(text: string, now: number): { from: number; to: number } | undefined {
  const date = (s: string) => {
    const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : undefined;
  };
  const age = (s: string) => (/^\d+(\.\d+)?\s*[mhdw]$/.test(s) ? now - parseSince(s) : undefined);
  const [a = '', b] = text.split('..');
  if (b === undefined) {
    const day = date(a);
    if (day !== undefined) return { from: day, to: day + DAY };
    const since = age(a);
    return since !== undefined ? { from: since, to: now } : undefined;
  }
  const from = date(a) ?? age(a);
  // An end date includes that whole day.
  const to = date(b) !== undefined ? (date(b) as number) + DAY : age(b);
  if (from === undefined || to === undefined) return undefined;
  return from <= to ? { from, to } : { from: to, to: from };
}

function sideOf(label: string, summaries: Summary[]): Side {
  const totalMs = summaries.reduce((n, s) => n + s.totalMs, 0);
  const sum = (pick: (s: Summary) => number) => summaries.reduce((n, s) => n + pick(s), 0);
  return {
    label,
    sessions: summaries.length,
    totalMs,
    turnsMs: sum((s) => s.turnsMs),
    awayWorkMs: sum((s) => s.awayWorkMs),
    phases: PHASES.map(({ id, label: name }) => {
      const ms = sum((s) => s.phases.find((p) => p.phase === id)?.ms ?? 0);
      return { phase: id, label: name, ms, share: totalMs > 0 ? ms / totalMs : 0 };
    }),
    modelCalls: sum((s) => s.modelCalls),
    toolCalls: sum((s) => s.toolCalls),
    failures: sum((s) => s.failures),
    reworkLoops: sum((s) => s.rework.filter((w) => w.edits > 0).length),
  };
}

function load(ctx: Ctx, text: string, options: Options): Side {
  const classify = classifier();
  const range = parseRange(text, ctx.now);
  if (range) {
    const sessions: Session[] = loadMany(ctx, options).filter(
      (s) => s.startMs >= range.from && s.startMs < range.to,
    );
    if (sessions.length === 0) throw new Error(`no sessions in ${text}. Run "awf import" first?`);
    return sideOf(
      text,
      sessions.map((s) => summarize(classify(s)).summary),
    );
  }
  const session = loadOne(ctx, text, options, false);
  const { summary } = summarize(classify(session));
  return sideOf(`${session.id.slice(0, 8)} (${formatClock(session.startMs)})`, [summary]);
}

const pts = (a: number, b: number) => {
  const d = Math.round((b - a) * 100);
  return d === 0 ? '0' : `${d > 0 ? '+' : '−'}${Math.abs(d)} pts`;
};
const delta = (a: number, b: number) =>
  b === a ? '' : `${b > a ? '+' : '−'}${formatDuration(Math.abs(b - a))}`;
const count = (a: number, b: number) => (b === a ? '' : `${b > a ? '+' : '−'}${Math.abs(b - a)}`);

export const compareCommand: Command = {
  summary: 'Phase totals side by side for two sessions or date ranges',
  usage: `Usage: awf compare <before> <after> [--project <dir>] [--json]

Shows each phase's time and share for two sessions, or two time ranges summed, and the change
from the first to the second: a before/after check for a faster build or test setup.
Each side is a session (ID, its first characters, "last", or a file) or a range:
  2026-10-01..2026-10-15   those days (the end day included)
  2026-10-20               that day
  7d                       the last 7 days (also h, w, m for hours, weeks, minutes)
  14d..7d                  from 14 days ago to 7 days ago
  --project <dir>   only sessions started in this folder or below it
  --json            print JSON`,
  options: { project: { type: 'string' }, json: { type: 'boolean' } },
  run(ctx, args, options) {
    if (args.length !== 2) throw new Error('compare needs two sides: awf compare <before> <after>');
    const [a, b] = [load(ctx, args[0] as string, options), load(ctx, args[1] as string, options)];
    if (options.json) {
      const changes = a.phases.map((p, i) => ({
        phase: p.phase,
        ms: (b.phases[i]?.ms ?? 0) - p.ms,
        share: (b.phases[i]?.share ?? 0) - p.share,
      }));
      ctx.io.out(JSON.stringify({ before: a, after: b, changes }, null, 2));
      return 0;
    }
    const perSession = a.sessions > 1 || b.sessions > 1;
    ctx.io.out(
      `Before: ${a.label}${perSession ? ` · ${a.sessions} sessions` : ''} · ${formatDuration(a.totalMs)}`,
    );
    ctx.io.out(
      `After:  ${b.label}${perSession ? ` · ${b.sessions} sessions` : ''} · ${formatDuration(b.totalMs)}`,
    );
    ctx.io.out('');
    const rows = a.phases
      .map((p, i) => [p, b.phases[i]] as const)
      .filter(([p, q]) => p.ms > 0 || (q?.ms ?? 0) > 0)
      .map(([p, q]) => [
        p.label,
        formatDuration(p.ms),
        `${Math.round(p.share * 100)}%`,
        formatDuration(q?.ms ?? 0),
        `${Math.round((q?.share ?? 0) * 100)}%`,
        pts(p.share, q?.share ?? 0),
        delta(p.ms, q?.ms ?? 0),
      ]);
    rows.push([
      'Total',
      formatDuration(a.totalMs),
      '100%',
      formatDuration(b.totalMs),
      '100%',
      '',
      delta(a.totalMs, b.totalMs),
    ]);
    ctx.io.out(
      table(
        ['PHASE', 'BEFORE', 'SHARE', 'AFTER', 'SHARE', 'SHARE CHANGE', 'TIME CHANGE'],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
    );
    ctx.io.out('');
    const facts = [
      ['Failed checks', a.failures, b.failures],
      ['Rework loops', a.reworkLoops, b.reworkLoops],
      ['Model calls', a.modelCalls, b.modelCalls],
      ['Tool calls', a.toolCalls, b.toolCalls],
      ...(perSession ? [['Sessions', a.sessions, b.sessions] as const] : []),
    ] as const;
    ctx.io.out(
      table(
        ['', 'BEFORE', 'AFTER', 'CHANGE'],
        facts.map(([name, x, y]) => [name, String(x), String(y), count(x, y)]),
        [1, 2, 3],
      ),
    );
    if (perSession && a.sessions !== b.sessions)
      ctx.io.out(
        '\nThe sides have different numbers of sessions: compare the shares, not the times.',
      );
    return 0;
  },
};
