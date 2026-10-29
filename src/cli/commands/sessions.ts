import os from 'node:os';
import type { Session } from '../../model/types';
import { formatClock, formatDuration, parseSince } from '../../model/time';
import { listEventFiles, loadRecordedSession } from '../../store/events';
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

export const sessionsCommand: Command = {
  summary: 'List recorded sessions with start time and duration',
  usage: `Usage: awf sessions [--since 30d] [--json]

Lists the sessions the recorder captured, newest first.
  --since <age>   only sessions that started within this age (30d, 12h)
  --json          print JSON`,
  options: {
    since: { type: 'string' },
    json: { type: 'boolean' },
  },
  run(ctx, _args, options) {
    const since =
      typeof options.since === 'string' ? ctx.now - parseSince(options.since) : -Infinity;
    const rows = listEventFiles(ctx.env)
      .map((file) => sessionRow(loadRecordedSession(file)))
      .filter((row) => row.startMs >= since && row.endMs > 0)
      .sort((a, b) => b.startMs - a.startMs);
    if (options.json) {
      ctx.io.out(JSON.stringify(rows, null, 2));
      return 0;
    }
    if (rows.length === 0) {
      ctx.io.out(
        'No recorded sessions yet. Install the awf plugin, then run a Claude Code session.',
      );
      return 0;
    }
    const home = ctx.env.HOME ?? os.homedir();
    ctx.io.out(
      table(
        ['SESSION', 'STARTED', 'DURATION', 'ACTIVE', 'TURNS', 'TOOLS', 'PROJECT'],
        rows.map((r) => [
          r.id.slice(0, 8),
          formatClock(r.startMs),
          formatDuration(r.durationMs),
          formatDuration(r.activeMs),
          String(r.turns),
          String(r.toolCalls),
          homeRelative(r.cwd, home),
        ]),
        [2, 3, 4, 5],
      ),
    );
    return 0;
  },
};
