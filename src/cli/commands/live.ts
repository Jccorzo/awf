import { readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { PhaseId } from '../../classify/phases';
import {
  liveState,
  type LiveState,
  stateLabel,
  transcriptFacts,
  type TranscriptFacts,
} from '../../live/state';
import { parseSince } from '../../model/time';
import type { RecorderEvent } from '../../recorder/event';
import { readEvents } from '../../store/events';
import { eventsDir, safeId } from '../../store/paths';
import { type ActiveTranscript, activeTranscripts } from '../../store/sessions';
import { type BoardRow, projectName, renderBoard } from '../board';
import type { Command, Ctx, Options } from '../main';
import { type ColorMode, colorMode, parsePin, phaseLine } from './statusline';

export interface LiveOptions {
  /** Sessions active this recently. */
  sinceMs: number;
  /** As typed: "2h". */
  since: string;
  limit: number;
  everyMs: number;
  pin: PhaseId[];
}

/** One session on the board. */
export interface LiveRow {
  id: string;
  transcript: string;
  cwd?: string;
  project: string;
  title?: string;
  state: LiveState;
  label: string;
  /** The status line's phase split: '' when nothing worked yet, undefined when not read (yet). */
  line?: string;
  /** The session's last entry, or the latest change to a subagent's transcript. */
  activityMs: number;
  /** Why the phase line is missing. */
  error?: string;
}

/** What earlier passes read, kept until the file changes, so a redraw reads only what changed. */
export interface LiveMemo {
  facts: Map<string, { stamp: string; facts: TranscriptFacts }>;
  events: Map<string, { stamp: string; events: RecorderEvent[] }>;
  /** The last phase line computed per session, shown while its new one is computed. */
  lines: Map<string, string>;
}

export function newMemo(): LiveMemo {
  return { facts: new Map(), events: new Map(), lines: new Map() };
}

function readFacts(file: ActiveTranscript, memo: LiveMemo): TranscriptFacts {
  const stamp = `${file.size}:${file.mtimeMs}`;
  const known = memo.facts.get(file.path);
  if (known?.stamp === stamp) return known.facts;
  const facts = transcriptFacts(readFileSync(file.path, 'utf8'));
  memo.facts.set(file.path, { stamp, facts });
  return facts;
}

/** The recorder's events for a session, when the awf plugin recorded it. */
function readSessionEvents(
  env: Ctx['env'],
  id: string,
  memo: LiveMemo,
): RecorderEvent[] | undefined {
  const file = path.join(eventsDir(env), `${safeId(id)}.jsonl`);
  const stat = statSync(file, { throwIfNoEntry: false });
  if (!stat?.isFile()) return undefined;
  const stamp = `${stat.size}:${stat.mtimeMs}`;
  const known = memo.events.get(file);
  if (known?.stamp === stamp) return known.events;
  const events = readEvents(file);
  memo.events.set(file, { stamp, events });
  return events;
}

/**
 * The sessions to show, newest activity first, with their state. Phase lines are left out: see
 * `fillLine`. A transcript that can't be read, or has nothing in it, is skipped.
 *
 * Activity is the transcript's last entry, not its file's time: Claude Code adds entries without a
 * time when the process exits or the app reopens a session, so an old session's file can look new.
 * Files changed within --since are read; those with no activity in it are left out.
 */
export function scan(
  ctx: Pick<Ctx, 'env'>,
  options: LiveOptions,
  memo: LiveMemo,
  now: number,
): { rows: LiveRow[]; total: number } {
  const sinceMs = now - options.sinceMs;
  const changed = activeTranscripts(ctx.env, sinceMs);
  const home = ctx.env.HOME || os.homedir();
  const active: LiveRow[] = [];
  for (const file of changed) {
    let row: LiveRow | undefined;
    try {
      row = readRow(ctx, file, memo, now, home);
    } catch {
      row = undefined;
    }
    if (row && row.activityMs >= sinceMs) active.push(row);
  }
  const rows = active.sort((a, b) => b.activityMs - a.activityMs).slice(0, options.limit);
  // Sessions that left the board are forgotten, so a board left open for days doesn't grow.
  const shown = new Set(rows.map((row) => row.id));
  const files = new Set(changed.map((file) => file.path));
  for (const file of memo.facts.keys()) if (!files.has(file)) memo.facts.delete(file);
  for (const id of memo.lines.keys()) if (!shown.has(id)) memo.lines.delete(id);
  for (const file of memo.events.keys())
    if (!shown.has(path.basename(file, '.jsonl'))) memo.events.delete(file);
  return { rows, total: active.length };
}

function readRow(
  ctx: Pick<Ctx, 'env'>,
  file: ActiveTranscript,
  memo: LiveMemo,
  now: number,
  home: string,
): LiveRow | undefined {
  const facts = readFacts(file, memo);
  if (facts.lastMs === undefined) return undefined;
  let events: RecorderEvent[] | undefined;
  try {
    events = readSessionEvents(ctx.env, file.id, memo);
  } catch {
    events = undefined;
  }
  const state = liveState(facts, now, events);
  const row: LiveRow = {
    id: file.id,
    transcript: file.path,
    project: facts.cwd ? projectName(facts.cwd, home) : file.project,
    state,
    label: stateLabel(state, now),
    activityMs: Math.max(facts.lastMs ?? 0, file.subagentsMs ?? 0),
  };
  if (facts.cwd) row.cwd = facts.cwd;
  if (facts.title) row.title = facts.title;
  return row;
}

/**
 * Sets the row's phase line: from the status line's cache, or, unless `cachedOnly`, by reading and
 * classifying the session (and caching it). Returns false when only a computed line would do.
 */
export function fillLine(
  ctx: Pick<Ctx, 'env'>,
  row: LiveRow,
  options: LiveOptions,
  mode: ColorMode,
  now: number,
  cachedOnly: boolean,
): boolean {
  try {
    const line = phaseLine({ env: ctx.env, now }, row.transcript, row.id, {
      pin: options.pin,
      mode,
      cachedOnly,
    });
    if (line === undefined) {
      if (cachedOnly) return false;
      row.error = 'transcript not found';
      return true;
    }
    row.line = line;
    delete row.error;
    return true;
  } catch (error) {
    row.error = error instanceof Error ? error.message : String(error);
    delete row.line;
    return true;
  }
}

function clock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function every(ms: number): string {
  return ms % 60_000 === 0 ? `${ms / 60_000}m` : `${Math.round(ms / 1000)}s`;
}

/** "awf live · 4 active · every 20s · 22:41" */
export function header(
  total: number,
  shown: number,
  options: LiveOptions,
  now: number,
  live: boolean,
): string {
  const count =
    total === 0
      ? `nothing active in the last ${options.since}`
      : shown < total
        ? `${total} active, ${shown} shown`
        : `${total} active`;
  return ['awf live', count, ...(live ? [`every ${every(options.everyMs)}`] : []), clock(now)].join(
    ' · ',
  );
}

function boardRows(rows: LiveRow[]): BoardRow[] {
  return rows.map((row) => {
    const board: BoardRow = { project: row.project, label: row.label, state: row.state.kind };
    if (row.title) board.title = row.title;
    if (row.line) board.line = row.line;
    return board;
  });
}

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g;

function jsonRow(row: LiveRow) {
  return {
    id: row.id,
    project: row.project,
    cwd: row.cwd,
    title: row.title,
    state: row.state.kind,
    label: row.label,
    ...(row.state.sinceMs !== undefined ? { sinceMs: row.state.sinceMs } : {}),
    ...(row.state.question ? { question: row.state.question } : {}),
    background: row.state.background,
    servers: row.state.servers,
    activityMs: row.activityMs,
    line: row.line?.replace(ANSI, ''),
    ...(row.error ? { error: row.error } : {}),
    transcript: row.transcript,
  };
}

/** The terminal `awf live` draws in. */
export interface Terminal {
  isTTY: boolean;
  columns: number | undefined;
  rows: number | undefined;
  write(text: string): void;
  /** Calls `listener` when the terminal is resized; returns a function that stops it. */
  onResize(listener: () => void): () => void;
  /** Calls `listener` on Ctrl-C, or when asked to stop; returns a function that stops it. */
  onStop(listener: () => void): () => void;
}

const SHOW_CURSOR = '\x1b[?25h';
const HIDE_CURSOR = '\x1b[?25l';

export const processTerminal: Terminal = {
  get isTTY() {
    return Boolean(process.stdout.isTTY);
  },
  // A terminal that reports no size (0) has none to fit.
  get columns() {
    return (process.stdout.isTTY && process.stdout.columns) || undefined;
  },
  get rows() {
    return (process.stdout.isTTY && process.stdout.rows) || undefined;
  },
  write: (text) => process.stdout.write(text),
  onResize(listener) {
    process.stdout.on('resize', listener);
    return () => process.stdout.off('resize', listener);
  },
  onStop(listener) {
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;
    for (const signal of signals) process.on(signal, listener);
    // Whatever ends the process, the cursor comes back.
    const restore = () => process.stdout.write(SHOW_CURSOR);
    process.on('exit', restore);
    return () => {
      for (const signal of signals) process.off(signal, listener);
      process.off('exit', restore);
    };
  },
};

/**
 * The width to fit: one pass takes COLUMNS when it's set (for scripts), else the terminal's; the
 * live board follows the terminal, which can be resized.
 */
function columnsOf(env: Ctx['env'], terminal: Terminal, live: boolean): number | undefined {
  const fromEnv = Number(env.COLUMNS);
  const set = Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : undefined;
  return live ? (terminal.columns ?? set) : (set ?? terminal.columns);
}

/** One pass with every phase line read, as `--once` and `--json` print it. */
export function onePass(
  ctx: Ctx,
  options: LiveOptions,
  mode: ColorMode,
): { rows: LiveRow[]; total: number } {
  const memo = newMemo();
  const pass = scan(ctx, options, memo, ctx.now);
  for (const row of pass.rows) {
    fillLine(ctx, row, options, mode, ctx.now, false);
    if (row.error && ctx.env.AWF_DEBUG) ctx.io.err(`awf live: ${row.id}: ${row.error}`);
  }
  return pass;
}

/**
 * Redraws the board every `everyMs` until Ctrl-C: cursor home, each line cleared to its end, the
 * rest of the screen cleared, in one write, so nothing flickers. Rows show at once with the last
 * phase line known; lines that changed are read one session at a time, and the board is redrawn
 * after each.
 */
export function liveLoop(
  ctx: Pick<Ctx, 'env'>,
  options: LiveOptions,
  terminal: Terminal,
  now: () => number = Date.now,
): Promise<number> {
  const mode = colorMode(ctx.env);
  const memo = newMemo();
  let frame: { header: string; rows: LiveRow[] } | undefined;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const draw = () => {
    if (!frame || stopped) return;
    const lines = renderBoard(frame.header, boardRows(frame.rows), {
      mode,
      columns: columnsOf(ctx.env, terminal, true),
      height: terminal.rows,
    });
    terminal.write('\x1b[H' + lines.map((line) => line + '\x1b[K').join('\n') + '\x1b[J');
  };

  return new Promise((resolve) => {
    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (timer) clearTimeout(timer);
      offResize();
      offStop();
      terminal.write('\n' + SHOW_CURSOR);
      resolve(0);
    };
    const offStop = terminal.onStop(stop);
    const offResize = terminal.onResize(draw);
    terminal.write(HIDE_CURSOR + '\x1b[H\x1b[2J');

    const pass = async () => {
      const started = now();
      try {
        const { rows, total } = scan(ctx, options, memo, started);
        const stale: LiveRow[] = [];
        for (const row of rows) {
          if (fillLine(ctx, row, options, mode, started, true)) continue;
          const last = memo.lines.get(row.id);
          if (last !== undefined) row.line = last;
          stale.push(row);
        }
        frame = { header: header(total, rows.length, options, started, true), rows };
        draw();
        for (const row of stale) {
          // Let Ctrl-C and resizes in between sessions.
          await new Promise((next) => setImmediate(next));
          if (stopped) return;
          fillLine(ctx, row, options, mode, started, false);
          if (row.line !== undefined) memo.lines.set(row.id, row.line);
          draw();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        frame = { header: `awf live · ${message} · ${clock(started)}`, rows: [] };
        draw();
      }
      if (stopped) return;
      timer = setTimeout(pass, Math.max(1000, options.everyMs - (now() - started)));
    };
    void pass();
  });
}

function parseEvery(value: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(s|m)?$/.exec(value.trim());
  if (!match) throw new Error(`can't read --every "${value}": use seconds, like 20 or 20s, or 1m`);
  const ms = Number(match[1]) * (match[2] === 'm' ? 60_000 : 1000);
  if (ms < 1000) throw new Error('--every is at least 1s');
  return ms;
}

export function liveOptions(options: Options): LiveOptions {
  const since = typeof options.since === 'string' ? options.since : '2h';
  const limit = typeof options.limit === 'string' ? Number(options.limit) : 10;
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error(`--limit is a whole number of sessions, like 10`);
  return {
    since,
    sinceMs: parseSince(since),
    limit,
    everyMs: typeof options.every === 'string' ? parseEvery(options.every) : 20_000,
    pin: parsePin(typeof options.pin === 'string' ? options.pin : undefined),
  };
}

export const liveCommand: Command = {
  summary: 'A board of every active Claude Code session: project, task, state and phase split',
  usage: `Usage: awf live [--since 2h] [--limit 10] [--every 20s] [--pin tests] [--once] [--json]

A board for a spare terminal tab: every Claude Code session active recently (its last entry, or a
subagent's transcript changing), newest activity first, redrawn in place until Ctrl-C. It reads
the transcripts, so it shows sessions of the desktop app too, where the status line never shows.

  acme-billing/web   CI pipeline for demo-000…   working     tests 35% · build 33% · explore 12%
  deploys            Cache key rollout…          your turn   tests 4% · scripts 57% · rework 14m

Each row: the session's folder, its title or first prompt, its state, and the status line's
phase split (see "awf statusline --help"). The state, from the end of the transcript:
  working     a turn is under way (a model or tool call open), or background tasks or
              subagents it started are still running; a server left running (pnpm dev,
              next dev, PORT=8080 ./api) doesn't count, since nothing waits for it to end
  approval?   a permission prompt is waiting; only known when the awf plugin recorded the session
  your turn   the turn ended, or a question waits for your answer
  idle 12m    your turn for 5 minutes or more
Without the plugin a call waiting for your approval reads as working. When the session's
process exits, what it was running ends with it: your turn.

Phase lines are kept in ~/.awf/cache/statusline/ with the status line's, so a pass reads only
sessions that changed. Colours follow the status line; NO_COLOR turns them off.

  --since <age>    sessions active this recently (default 2h; 30m, 1d)
  --limit <n>      at most this many sessions (default 10)
  --every <time>   redraw this often (default 20s; 5s, 1m)
  --pin <phases>   the phases always shown, first, as in "awf statusline" (default tests)
  --once           print one pass and exit (also when output isn't a terminal)
  --json           print one pass as JSON`,
  options: {
    since: { type: 'string' },
    limit: { type: 'string' },
    every: { type: 'string' },
    pin: { type: 'string' },
    once: { type: 'boolean' },
    json: { type: 'boolean' },
  },
  run(ctx, _args, options) {
    const live = liveOptions(options);
    const mode = colorMode(ctx.env);
    if (options.json) {
      // The lines in the cache's colour mode, uncoloured here: a cache in another mode would
      // replace the status line's and make both read the session again.
      const { rows } = onePass(ctx, live, mode);
      ctx.io.out(JSON.stringify(rows.map(jsonRow), null, 2));
      return 0;
    }
    const terminal = processTerminal;
    if (options.once || !terminal.isTTY) {
      const { rows, total } = onePass(ctx, live, mode);
      const lines = renderBoard(header(total, rows.length, live, ctx.now, false), boardRows(rows), {
        mode,
        columns: columnsOf(ctx.env, terminal, false),
      });
      ctx.io.out(lines.join('\n'));
      return 0;
    }
    return liveLoop(ctx, live, terminal);
  },
};
