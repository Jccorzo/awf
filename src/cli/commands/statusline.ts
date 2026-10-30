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
import { loadSession, resolveSession, subagentFiles } from '../../store/sessions';
import { VERSION } from '../../version';
import { classifier } from '../load';
import type { Command, Ctx } from '../main';

/** Bump when the line's format changes, so cached lines from an older format aren't shown. */
const FORMAT = 2;
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
export const FAILED_COLOR = '#d03b3b';

export type ColorMode = 'truecolor' | '256' | 'none';

export interface StatusParts {
  /**
   * The pinned phases first, then those that took the most time, without Waiting on you; share
   * is of the working time.
   */
  phases: Array<{ phase: PhaseId; ms: number; share: number; pinned?: boolean }>;
  /** Lint, test and build runs that failed. */
  failed: number;
  reworkMs: number;
  /** The session's time without Waiting on you. */
  workingMs: number;
}

/** Phases the line always shows, first, even when they aren't among the top ones. */
export const DEFAULT_PIN: PhaseId[] = ['tests'];

/**
 * `--pin`: phase ids or the line's short names, comma-separated ("tests,build"); "none" pins
 * nothing. Unknown names are skipped, so a typo never breaks the status line.
 */
export function parsePin(value: string | undefined): PhaseId[] {
  if (value === undefined) return DEFAULT_PIN;
  const byName = new Map<string, PhaseId>();
  for (const [id, name] of Object.entries(SHORT_NAME) as Array<[PhaseId, string]>) {
    byName.set(id, id);
    byName.set(name, id);
  }
  const pins = value.split(',').map((name) => byName.get(name.trim()));
  return [...new Set(pins)].filter((p): p is PhaseId => p !== undefined && p !== 'waiting');
}

/** What the line shows, from a session's summary: `pinned` first, then the top phases. */
export function statusParts(summary: Summary, top = 3, pinned = DEFAULT_PIN): StatusParts {
  const working = summary.phases.filter((p) => p.phase !== 'waiting');
  const workingMs = working.reduce((n, p) => n + p.ms, 0);
  const share = (ms: number) => (workingMs > 0 ? ms / workingMs : 0);
  const pins = pinned.map((phase) => {
    const ms = working.find((p) => p.phase === phase)?.ms ?? 0;
    return { phase, ms, share: share(ms), pinned: true };
  });
  const others = working
    .filter((p) => p.ms > 0 && !pinned.includes(p.phase))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, Math.max(0, top - pins.length))
    .map((p) => ({ phase: p.phase, ms: p.ms, share: share(p.ms) }));
  return {
    // Nothing worked yet: no line rather than "tests 0%".
    phases: workingMs > 0 ? [...pins, ...others] : [],
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
  if (share === 0) return '0%';
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

/** Colours text with a #rrggbb colour, in the terminal's colour mode. */
export function paint(text: string, hex: string, mode: ColorMode): string {
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
  pinned?: boolean;
}

/** "tests 36% · explore 29% · scripts 15% · 15 failed · rework 2m", coloured unless mode is none. */
export function renderStatus(parts: StatusParts, mode: ColorMode): string {
  const phases: Item[] = parts.phases.map((p) => ({
    name: SHORT_NAME[p.phase],
    color: COLOR[p.phase],
    value: percent(p.share),
    ...(p.pinned ? { pinned: true } : {}),
  }));
  if (phases.length === 0) return '';
  const tail: Item[] = [];
  if (parts.failed > 0) tail.push({ name: `${parts.failed} failed`, color: FAILED_COLOR });
  if (parts.reworkMs >= 1000 && !parts.phases.some((p) => p.phase === 'rework'))
    tail.push({ name: 'rework', color: COLOR.rework, value: shortDuration(parts.reworkMs) });
  const text = (item: Item) => (item.value ? `${item.name} ${item.value}` : item.name);
  const width = (items: Item[]) => items.map(text).join(' · ').length;
  // Too long: the last top phase goes first; pinned phases stay.
  while (phases.length > 1 && width([...phases, ...tail]) > MAX_WIDTH) {
    const last = phases.map((p) => !p.pinned).lastIndexOf(true);
    if (last < 0) break;
    phases.splice(last, 1);
  }
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
  const files = subagentFiles(transcript);
  return files ? `${files.count}:${files.size}:${files.mtimeMs}` : '-';
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

/** A session's transcript and recorder events, as the line and its cache key are made from them. */
interface LineSource {
  id: string;
  transcript: string;
  transcriptStat: Stats;
  events: string;
  eventsStat: Stats | undefined;
}

function lineSource(env: Ctx['env'], transcript: string, id: string): LineSource | undefined {
  if (!transcript.endsWith('.jsonl')) return undefined;
  const transcriptStat = statSync(transcript, { throwIfNoEntry: false });
  if (!transcriptStat?.isFile()) return undefined;
  const events = path.join(eventsDir(env), `${safeId(id)}.jsonl`);
  const eventsStat = statSync(events, { throwIfNoEntry: false });
  return { id, transcript, transcriptStat, events, eventsStat };
}

function cacheKey(source: LineSource, mode: ColorMode, pin: PhaseId[]): string {
  return [
    FORMAT,
    VERSION,
    mode,
    pin.join(','),
    stamp(source.transcriptStat),
    stamp(source.eventsStat),
    subagentStamp(source.transcript),
  ].join('|');
}

function cachePath(env: Ctx['env'], id: string): string {
  return path.join(cacheDir(env), 'statusline', `${safeId(id)}.json`);
}

/** Reads and classifies the session, with the recorder's events when there are any. */
function sessionSummary(env: Ctx['env'], source: LineSource): Summary {
  const ref = resolveSession(source.transcript, env);
  if (source.eventsStat?.isFile())
    ref.events = {
      id: source.id,
      path: source.events,
      mtimeMs: source.eventsStat.mtimeMs,
      size: source.eventsStat.size,
    };
  return summarize(classifier()(loadSession(ref, { detail: true, env }))).summary;
}

export interface PhaseLineOptions {
  /** Default: tests (DEFAULT_PIN). */
  pin?: PhaseId[];
  /** Default: from the environment, as the status line does. */
  mode?: ColorMode;
  /** Only a cached line: undefined rather than read the session. */
  cachedOnly?: boolean;
}

/**
 * The status line's phase split for a transcript, `id` being its session's ID. Kept in
 * ~/.awf/cache/statusline/ under the same key the status line uses, so either one reads a session
 * only once per change of its transcript, recorder events or subagents' transcripts. '' when the
 * session has no working time yet; undefined when the transcript isn't there. Throws when the
 * session can't be read.
 */
export function phaseLine(
  ctx: Pick<Ctx, 'env' | 'now'>,
  transcript: string,
  id: string,
  options: PhaseLineOptions = {},
): string | undefined {
  const source = lineSource(ctx.env, transcript, id);
  if (!source) return undefined;
  const mode = options.mode ?? colorMode(ctx.env);
  const pin = options.pin ?? DEFAULT_PIN;
  return cachedLine(ctx, source, mode, pin, options.cachedOnly ?? false);
}

function cachedLine(
  ctx: Pick<Ctx, 'env' | 'now'>,
  source: LineSource,
  mode: ColorMode,
  pin: PhaseId[],
  cachedOnly: boolean,
): string | undefined {
  const key = cacheKey(source, mode, pin);
  const file = cachePath(ctx.env, source.id);
  const cached = readCache(file, key);
  if (cached !== undefined || cachedOnly) return cached;
  const line = renderStatus(statusParts(sessionSummary(ctx.env, source), 3, pin), mode);
  writeCache(file, key, line, ctx.now);
  return line;
}

/** The status line for Claude Code's JSON, or '' when there's nothing to show. Throws on bad input. */
function statusLine(ctx: Ctx, input: string, json: boolean, pin: PhaseId[]): string {
  const payload = JSON.parse(input) as Payload | null;
  const transcript = payload?.transcript_path;
  if (typeof transcript !== 'string') return '';
  const id =
    typeof payload?.session_id === 'string' && payload.session_id
      ? payload.session_id
      : path.basename(transcript, '.jsonl');
  const source = lineSource(ctx.env, transcript, id);
  if (!source) return '';
  if (!json) return cachedLine(ctx, source, colorMode(ctx.env), pin, false) ?? '';

  // --json always reads the session.
  const summary = sessionSummary(ctx.env, source);
  const parts = statusParts(summary, 3, pin);
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

export const statuslineCommand: Command = {
  summary: "One short line for Claude Code's status line: the session's phase split so far",
  usage: `Usage: awf statusline [--pin tests] [--json]

For Claude Code's status line. Reads the JSON Claude Code sends on stdin (session_id,
transcript_path), and prints one line: Running tests, always and first, then the phases that
took the most time so far (three phases in all), then failed lint, test and build runs, and
rework time when it isn't one of the phases shown:

  tests 3% · build 32% · scripts 26% · 9 failed · rework 9s

Shares are of the time the agent worked, without Waiting on you, so they hold still while you're
away. Phases are named code, test code, lint, tests, build, rework, explore, scripts, plan and
unclassified. Colours follow the report; NO_COLOR turns them off.

It never breaks the status line: on any error it prints nothing and exits 0 (AWF_DEBUG=1 prints
the error on stderr). The line is kept in ~/.awf/cache/statusline/ until the transcript, the
recorder's events or a subagent's transcript changes.

Set it up in ~/.claude/settings.json:
  "statusLine": { "type": "command", "command": "awf statusline", "padding": 0 }

  --pin <phases>  the phases always shown, first: ids or short names, comma-separated
                  (default tests; "tests,build"; "none" for only the top three)
  --json          print the phases, failures and rework as JSON (not cached)`,
  options: { json: { type: 'boolean' }, pin: { type: 'string' } },
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
      const pin = parsePin(typeof options.pin === 'string' ? options.pin : undefined);
      const line = statusLine(ctx, input, Boolean(options.json), pin);
      if (line) ctx.io.out(line);
    } catch (error) {
      if (ctx.env.AWF_DEBUG)
        ctx.io.err(`awf statusline: ${error instanceof Error ? error.message : String(error)}`);
    }
    return 0;
  },
};
