import os from 'node:os';
import path from 'node:path';
import type { Session } from '../../model/types';
import { formatClock, formatDuration, parseSince } from '../../model/time';
import { quickSessions } from '../../store/sessions';
import type { Command } from '../main';
import { homeRelative, table } from '../table';

export interface SessionRow {
  id: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  /**
   * Time inside turns: the session without the gaps between them. Background work in those gaps
   * isn't included; `awf summary` shows it (it needs the session classified).
   */
  turnsMs: number;
  turns: number;
  toolCalls: number;
  cwd?: string;
  sources: string[];
}

export function sessionRow(session: Session): SessionRow {
  const idleMs = session.steps
    .filter((s) => s.kind === 'idle')
    .reduce((sum, s) => sum + (s.endMs - s.startMs), 0);
  const durationMs = Math.max(0, session.endMs - session.startMs);
  const row: SessionRow = {
    id: session.id,
    startMs: session.startMs,
    endMs: session.endMs,
    durationMs,
    turnsMs: Math.max(0, durationMs - idleMs),
    turns: session.steps.filter((s) => s.kind === 'turn').length,
    toolCalls: session.steps.filter((s) => s.kind === 'tool').length,
    sources: session.sources,
  };
  if (session.cwd) row.cwd = session.cwd;
  return row;
}

export function inFolder(cwd: string | undefined, dir: string | undefined): boolean {
  if (!dir) return true;
  return !!cwd && (cwd === dir || cwd.startsWith(dir + path.sep));
}

/** Rows for every session awf has timings for: recorded by the hooks, imported from transcripts, or both. */
export function listSessionRows(env: Record<string, string | undefined>): SessionRow[] {
  const rows: SessionRow[] = [];
  for (const { ref, session } of quickSessions(env)) {
    const row = sessionRow(session);
    const fromTranscript = ref.imported || session.sources.includes('transcript');
    row.sources = [...(ref.events ? ['hooks'] : []), ...(fromTranscript ? ['transcript'] : [])];
    rows.push(row);
  }
  return rows.sort((a, b) => b.startMs - a.startMs);
}

export const sessionsCommand: Command = {
  summary: 'List sessions with start time and duration',
  usage: `Usage: awf sessions [--since 30d] [--project <dir>] [--json]

Lists sessions newest first: those the recorder captured and those "awf import" read from transcripts.
IN TURNS is the time from each prompt (or notice) to the end of the agent's answer, without the
gaps between turns. Background work in those gaps (subagents, builds left running) isn't in it:
"awf summary <session>" shows it.
  --since <age>     only sessions that started within this age (30d, 12h)
  --project <dir>   only sessions started in this folder or below it
  --json            print JSON`,
  options: {
    since: { type: 'string' },
    project: { type: 'string' },
    json: { type: 'boolean' },
  },
  run(ctx, _args, options) {
    const since =
      typeof options.since === 'string' ? ctx.now - parseSince(options.since) : -Infinity;
    const project =
      typeof options.project === 'string' ? path.resolve(ctx.cwd, options.project) : undefined;
    const rows = listSessionRows(ctx.env).filter(
      (row) => row.startMs >= since && inFolder(row.cwd, project),
    );
    if (options.json) {
      ctx.io.out(JSON.stringify(rows, null, 2));
      return 0;
    }
    if (rows.length === 0) {
      ctx.io.out(
        'No sessions yet. Install the awf plugin to record new sessions, or run "awf import" to read past ones.',
      );
      return 0;
    }
    const home = ctx.env.HOME ?? os.homedir();
    ctx.io.out(
      table(
        ['SESSION', 'STARTED', 'DURATION', 'IN TURNS', 'TURNS', 'TOOLS', 'SOURCE', 'PROJECT'],
        rows.map((r) => [
          r.id.slice(0, 8),
          formatClock(r.startMs),
          formatDuration(r.durationMs),
          formatDuration(r.turnsMs),
          String(r.turns),
          String(r.toolCalls),
          r.sources.join('+'),
          homeRelative(r.cwd, home),
        ]),
        [2, 3, 4, 5],
      ),
    );
    return 0;
  },
};
