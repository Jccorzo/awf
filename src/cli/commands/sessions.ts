import os from 'node:os';
import path from 'node:path';
import type { Session } from '../../model/types';
import { formatClock, formatDuration, parseSince } from '../../model/time';
import { readEvents } from '../../store/events';
import { readImported } from '../../store/imported';
import { sessionIndex } from '../../store/sessions';
import { eventsToSession } from '../../recorder/steps';
import type { Command } from '../main';
import { homeRelative, table } from '../table';

export interface SessionRow {
  id: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  activeMs: number;
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
    activeMs: Math.max(0, durationMs - idleMs),
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
  for (const ref of sessionIndex(env).values()) {
    const recorded = ref.events ? eventsToSession(ref.id, readEvents(ref.events.path)) : undefined;
    const imported = ref.imported ? readImported(ref.id, env)?.session : undefined;
    const base = recorded ?? imported;
    if (!base || base.steps.length === 0) continue;
    const row = sessionRow(base);
    row.sources = [...(recorded ? ['hooks'] : []), ...(imported ? ['transcript'] : [])];
    if (!row.cwd && imported?.cwd) row.cwd = imported.cwd;
    rows.push(row);
  }
  return rows.sort((a, b) => b.startMs - a.startMs);
}

export const sessionsCommand: Command = {
  summary: 'List sessions with start time and duration',
  usage: `Usage: awf sessions [--since 30d] [--project <dir>] [--json]

Lists sessions newest first: those the recorder captured and those "awf import" read from transcripts.
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
        ['SESSION', 'STARTED', 'DURATION', 'ACTIVE', 'TURNS', 'TOOLS', 'SOURCE', 'PROJECT'],
        rows.map((r) => [
          r.id.slice(0, 8),
          formatClock(r.startMs),
          formatDuration(r.durationMs),
          formatDuration(r.activeMs),
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
