import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import type { Stats } from 'node:fs';
import path from 'node:path';
import { summarize, type Summary } from '../../analyze/summary';
import { PHASE_LABEL, type PhaseId } from '../../classify/phases';
import { cacheDir, eventsDir, safeId } from '../../store/paths';
import { loadSession, resolveSession } from '../../store/sessions';
import { VERSION } from '../../version';
import { classifier } from '../load';
import type { Command, Ctx } from '../main';

/** Bump when the line's format changes, so cached lines from an older format aren't shown. */
const FORMAT = 1;
/** Visible characters, about 60; the third phase is dropped to stay within it. */
const MAX_WIDTH = 64;
/** Cached lines of sessions untouched this long are deleted. */
const KEEP_MS = 30 * 86_400_000;

/** Short names: the status line has room for about 60 characters. */
export const SHORT_NAME: Record<PhaseId, string> = {
  'writing-code': 'code',
  'writing-tests': 'test code',
  lint: 'lint',
  tests: 'tests',
  build: 'build',
  rework: 'rework',
  exploring: 'explore',
  running: 'scripts',
  planning: 'plan',
  waiting: 'waiting',
  unclassified: 'unclassified',
};

/**
 * The report's phase colours (src/report/client/styles.css), moved to mid-tones where its light and
 * dark values differ, so the words read on light and dark terminals alike.
 */
const COLOR: Record<PhaseId, string> = {
  'writing-code': '#2a78d6',
  'writing-tests': '#d95926',
  lint: '#199e70',
  tests: '#c98500',
  build: '#d55181',
  rework: '#7a6ae0',
  exploring: '#008300',
  running: '#2a8ca3',
  planning: '#7b8494',
  waiting: '#a9a8a0',
  unclassified: '#8c8b84',
};
const FAILED_COLOR = '#d03b3b';

export type ColorMode = 'truecolor' | '256' | 'none';

export interface StatusParts {
  /** The phases that took the most time, without Waiting on you; share is of the working time. */
  phases: Array<{ phase: PhaseId; ms: number; share: number }>;
  /** Lint, test and build runs that failed. */
  failed: number;
  reworkMs: number;
  /** The session's time without Waiting on you. */
  workingMs: number;
}

/** What the line shows, from a session's summary. */
export function statusParts(summary: Summary, top = 3): StatusParts {
  const working = summary.phases.filter((p) => p.phase !== 'waiting');
  const workingMs = working.reduce((n, p) => n + p.ms, 0);
  const phases = working
    .filter((p) => p.ms > 0)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, top)
    .map((p) => ({ phase: p.phase, ms: p.ms, share: workingMs > 0 ? p.ms / workingMs : 0 }));
  return {
    phases,
    failed: summary.phases.reduce((n, p) => n + (p.failed ?? 0), 0),
    reworkMs: summary.phases.find((p) => p.phase === 'rework')?.ms ?? 0,
    workingMs,
  };
}

/** "45s", "12m", "1h05m". */
export function shortDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`;
}

function percent(share: number): string {
  const n = Math.round(share * 100);
  return n === 0 ? '<1%' : `${n}%`;
}

/** Colours from the environment: none with NO_COLOR, 24-bit when the terminal says it has it. */
export function colorMode(env: Record<string, string | undefined>): ColorMode {
  if (env.NO_COLOR) return 'none';
  return /truecolor|24bit/i.test(env.COLORTERM ?? '') ? 'truecolor' : '256';
}

/** The nearest colour of xterm's 6×6×6 cube. */
function xterm256(r: number, g: number, b: number): number {
  const levels = [0, 95, 135, 175, 215, 255];
  const nearest = (v: number) =>
    levels.reduce(
      (best, level, i) => (Math.abs(level - v) < Math.abs(levels[best]! - v) ? i : best),
      0,
    );
  return 16 + 36 * nearest(r) + 6 * nearest(g) + nearest(b);
}

function paint(text: string, hex: string, mode: ColorMode): string {
  if (mode === 'none') return text;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
  const code = mode === 'truecolor' ? `38;2;${r};${g};${b}` : `38;5;${xterm256(r, g, b)}`;
  return `\x1b[${code}m${text}\x1b[39m`;
}

interface Item {
  name: string;
  color: string;
  value?: string;
}

/** "tests 36% · explore 29% · scripts 15% · 15 failed · rework 2m", coloured unless mode is none. */
export function renderStatus(parts: StatusParts, mode: ColorMode): string {
  const phases: Item[] = parts.phases.map((p) => ({
    name: SHORT_NAME[p.phase],
    color: COLOR[p.phase],
    value: percent(p.share),
  }));
  if (phases.length === 0) return '';
  const tail: Item[] = [];
  if (parts.failed > 0) tail.push({ name: `${parts.failed} failed`, color: FAILED_COLOR });
  if (parts.reworkMs >= 1000 && !parts.phases.some((p) => p.phase === 'rework'))
    tail.push({ name: 'rework', color: COLOR.rework, value: shortDuration(parts.reworkMs) });
  const text = (item: Item) => (item.value ? `${item.name} ${item.value}` : item.name);
  const width = (items: Item[]) => items.map(text).join(' · ').length;
  while (phases.length > 1 && width([...phases, ...tail]) > MAX_WIDTH) phases.pop();
  const separator = mode === 'none' ? ' · ' : ' \x1b[2m·\x1b[22m ';
  return [...phases, ...tail]
    .map((item) => paint(item.name, item.color, mode) + (item.value ? ` ${item.value}` : ''))
    .join(separator);
}

function stamp(stat: Stats | undefined): string {
  return stat ? `${stat.size}:${stat.mtimeMs}` : '-';
}

/** Subagents write their own transcripts next to the session's; their growth changes the line too. */
function subagentStamp(transcript: string): string {
  const dir = path.join(path.dirname(transcript), path.basename(transcript, '.jsonl'), 'subagents');
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return '-';
  }
  let size = 0;
  let mtime = 0;
  for (const name of names) {
    const stat = statSync(path.join(dir, name), { throwIfNoEntry: false });
    if (!stat) continue;
    size += stat.size;
    mtime = Math.max(mtime, stat.mtimeMs);
  }
  return `${names.length}:${size}:${mtime}`;
}

function readCache(file: string, key: string): string | undefined {
  try {
    const cached = JSON.parse(readFileSync(file, 'utf8')) as { key?: unknown; line?: unknown };
    return cached.key === key && typeof cached.line === 'string' ? cached.line : undefined;
  } catch {
    return undefined;
  }
}

/** Writes the line and deletes lines of sessions untouched for a month. Best effort. */
function writeCache(file: string, key: string, line: string, now: number): void {
  try {
    const dir = path.dirname(file);
    mkdirSync(dir, { recursive: true });
    // Status lines can run at once; renaming a whole file means no reader sees half of one.
    const temp = `${file}.${process.pid}.tmp`;
    writeFileSync(temp, JSON.stringify({ key, line }));
    renameSync(temp, file);
    for (const name of readdirSync(dir)) {
      const other = path.join(dir, name);
      const stat = statSync(other, { throwIfNoEntry: false });
      if (stat && now - stat.mtimeMs > KEEP_MS) rmSync(other, { force: true });
    }
  } catch {
    // The line still shows; it's only computed again next time.
  }
}

interface Payload {
  session_id?: unknown;
  transcript_path?: unknown;
}

/** The status line for Claude Code's JSON, or '' when there's nothing to show. Throws on bad input. */
function statusLine(ctx: Ctx, input: string, json: boolean): string {
  const payload = JSON.parse(input) as Payload | null;
  const transcript = payload?.transcript_path;
  if (typeof transcript !== 'string' || !transcript.endsWith('.jsonl')) return '';
  const transcriptStat = statSync(transcript, { throwIfNoEntry: false });
  if (!transcriptStat?.isFile()) return '';
  const id =
    typeof payload?.session_id === 'string' && payload.session_id
      ? payload.session_id
      : path.basename(transcript, '.jsonl');
  const events = path.join(eventsDir(ctx.env), `${safeId(id)}.jsonl`);
  const eventsStat = statSync(events, { throwIfNoEntry: false });
  const mode = colorMode(ctx.env);
  const key = [
    FORMAT,
    VERSION,
    mode,
    stamp(transcriptStat),
    stamp(eventsStat),
    subagentStamp(transcript),
  ].join('|');
  const cacheFile = path.join(cacheDir(ctx.env), 'statusline', `${safeId(id)}.json`);
  if (!json) {
    const cached = readCache(cacheFile, key);
    if (cached !== undefined) return cached;
  }

  const ref = resolveSession(transcript, ctx.env);
  if (eventsStat?.isFile())
    ref.events = { id, path: events, mtimeMs: eventsStat.mtimeMs, size: eventsStat.size };
  const { summary } = summarize(classifier()(loadSession(ref, { detail: true, env: ctx.env })));
  const parts = statusParts(summary);
  if (json) {
    return JSON.stringify(
      {
        id: summary.id,
        sources: summary.sources,
        workingMs: parts.workingMs,
        phases: parts.phases.map((p) => ({
          ...p,
          label: PHASE_LABEL[p.phase],
          name: SHORT_NAME[p.phase],
        })),
        failed: parts.failed,
        reworkMs: parts.reworkMs,
        line: renderStatus(parts, 'none'),
      },
      null,
      2,
    );
  }
  const line = renderStatus(parts, mode);
  writeCache(cacheFile, key, line, ctx.now);
  return line;
}

export const statuslineCommand: Command = {
  summary: "One short line for Claude Code's status line: the session's phase split so far",
  usage: `Usage: awf statusline [--json]

For Claude Code's status line. Reads the JSON Claude Code sends on stdin (session_id,
transcript_path), and prints one line: the three phases that took the most time so far, then
failed lint, test and build runs, and rework time when it isn't one of the three:

  tests 36% · explore 29% · scripts 15% · 15 failed · rework 2m

Shares are of the time the agent worked, without Waiting on you, so they hold still while you're
away. Phases are named code, test code, lint, tests, build, rework, explore, scripts, plan and
unclassified. Colours follow the report; NO_COLOR turns them off.

It never breaks the status line: on any error it prints nothing and exits 0 (AWF_DEBUG=1 prints
the error on stderr). The line is kept in ~/.awf/cache/statusline/ until the transcript, the
recorder's events or a subagent's transcript changes.

Set it up in ~/.claude/settings.json:
  "statusLine": { "type": "command", "command": "awf statusline", "padding": 0 }

  --json   print the phases, failures and rework as JSON (not cached)`,
  options: { json: { type: 'boolean' } },
  run(ctx, _args, options) {
    let input: string | undefined;
    try {
      input = ctx.io.input?.();
    } catch {
      return 0;
    }
    if (input === undefined) {
      ctx.io.err(
        'awf statusline reads the JSON Claude Code sends on stdin. Run "awf statusline --help".',
      );
      return 0;
    }
    try {
      const line = statusLine(ctx, input, Boolean(options.json));
      if (line) ctx.io.out(line);
    } catch (error) {
      if (ctx.env.AWF_DEBUG)
        ctx.io.err(`awf statusline: ${error instanceof Error ? error.message : String(error)}`);
    }
    return 0;
  },
};
