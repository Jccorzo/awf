// Layout of `awf live`: one row per session, fitted to the terminal's width.
import path from 'node:path';
import type { StateKind } from '../live/state';
import { type ColorMode, FAILED_COLOR, paint } from './commands/statusline';

/** Folders under your home that only hold projects; a project's name leaves them out. */
const CONTAINERS = new Set([
  'Documents',
  'Developer',
  'Projects',
  'projects',
  'Code',
  'code',
  'src',
  'dev',
  'Dev',
  'repos',
  'Repos',
  'git',
  'GitHub',
  'github',
  'workspace',
  'Workspace',
  'work',
  'Work',
]);
const GAP = '   ';
const MAX_PROJECT = 24;
const MAX_TITLE = 26;
const MIN_TITLE = 12;
const MIN_LINE = 20;

/**
 * A session's folder, short: relative to your home, without a leading folder that only holds
 * projects (~/Documents/acme-billing/web is "acme-billing/web"). Outside your home, the path as is.
 */
export function projectName(cwd: string, home: string): string {
  const resolved = path.resolve(cwd);
  if (!home || (resolved !== home && !resolved.startsWith(home + path.sep))) return resolved;
  const parts = path.relative(home, resolved).split(path.sep).filter(Boolean);
  if (parts.length === 0) return '~';
  if (parts.length > 1 && CONTAINERS.has(parts[0] as string)) parts.shift();
  return parts.join('/');
}

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;
const WIDE =
  /[\u1100-\u115f\u2e80-\u303e\u3041-\u33ff\u3400-\u4dbf\u4e00-\u9fff\ua000-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6\u{1f300}-\u{1f64f}\u{1f900}-\u{1f9ff}\u{20000}-\u{3fffd}]/u;
/** Combining marks, variation selectors and zero-width characters. */
const ZERO = /[\p{Mn}\p{Me}\p{Cf}]/u;

function charWidth(char: string): number {
  if (ZERO.test(char)) return 0;
  return WIDE.test(char) ? 2 : 1;
}

/** Columns the text takes in a terminal, colour codes left out. */
export function textWidth(text: string): number {
  let width = 0;
  for (const char of text.replace(ANSI, '')) width += charWidth(char);
  return width;
}

/** Cuts text to `width` columns, ending in "…" when cut. Keeps colour codes and resets them. */
export function truncate(text: string, width: number): string {
  if (textWidth(text) <= width) return text;
  if (width <= 0) return '';
  let out = '';
  let used = 0;
  let styled = false;
  // eslint-disable-next-line no-control-regex
  for (const token of text.split(/(\x1b\[[0-9;?]*[A-Za-z])/)) {
    if (token.startsWith('\x1b[')) {
      out += token;
      styled = true;
      continue;
    }
    for (const char of token) {
      const w = charWidth(char);
      if (used + w > width - 1) return out.trimEnd() + '…' + (styled ? '\x1b[0m' : '');
      out += char;
      used += w;
    }
  }
  return out;
}

/** Pads text with spaces to `width` columns. */
function pad(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - textWidth(text)));
}

// eslint-disable-next-line no-control-regex
const SEPARATOR = / \x1b\[2m·\x1b\[22m | · /;

/** A phase line fitted to `width`: items dropped from the end, cut only when one doesn't fit. */
export function fitLine(line: string, width: number): string {
  if (textWidth(line) <= width) return line;
  const items = line.split(SEPARATOR);
  const separators = line.match(new RegExp(SEPARATOR.source, 'g')) ?? [];
  while (items.length > 1) {
    items.pop();
    const joined = items.map((item, i) => (i === 0 ? item : separators[i - 1] + item)).join('');
    if (textWidth(joined) <= width) return joined;
  }
  return truncate(items[0] ?? '', width);
}

/** A project name fitted to `width`: its last folders after "…/", or cut. */
function fitProject(name: string, width: number): string {
  if (textWidth(name) <= width) return name;
  const parts = name.split('/');
  for (let i = 1; i < parts.length; i++) {
    const tail = '…/' + parts.slice(i).join('/');
    if (textWidth(tail) <= width) return tail;
  }
  return truncate(parts.at(-1) ?? name, width);
}

function style(text: string, code: 'bold' | 'dim', mode: ColorMode): string {
  if (mode === 'none') return text;
  return code === 'bold' ? `\x1b[1m${text}\x1b[22m` : `\x1b[2m${text}\x1b[22m`;
}

/** The state's label, coloured: your turn bold, approval? red, idle dimmed. */
export function paintState(label: string, kind: StateKind, mode: ColorMode): string {
  switch (kind) {
    case 'approval':
      return style(paint(label, FAILED_COLOR, mode), 'bold', mode);
    case 'your-turn':
      return style(label, 'bold', mode);
    case 'idle':
      return style(label, 'dim', mode);
    default:
      return label;
  }
}

export interface BoardRow {
  project: string;
  title?: string;
  label: string;
  state: StateKind;
  /** The status line's phase split; empty or undefined when there's none. */
  line?: string;
}

export interface BoardLayout {
  mode: ColorMode;
  /** The terminal's width; undefined for no limit. */
  columns?: number;
  /** The terminal's height; rows that don't fit are counted on a last line. */
  height?: number;
}

/**
 * Column widths. The project and the state always show. The phase line comes next, keeping room
 * for a short task; the task takes what the fitted lines leave, and goes when there's no room for it.
 */
function widths(rows: BoardRow[], columns: number | undefined) {
  const most = (values: Array<string | undefined>) =>
    Math.max(0, ...values.map((v) => textWidth(v ?? '')));
  let project = Math.min(MAX_PROJECT, most(rows.map((r) => r.project)));
  const state = most(rows.map((r) => r.label));
  const fullTitle = Math.min(MAX_TITLE, most(rows.map((r) => r.title)));
  const fullLine = most(rows.map((r) => r.line));
  if (columns === undefined) return { project, title: fullTitle, state, line: fullLine };
  const gap = GAP.length;
  let room = columns - project - gap - state;
  if (room < 0) {
    project = Math.max(1, project + room);
    room = columns - project - gap - state;
  }
  const shortTitle = Math.min(MIN_TITLE, fullTitle);
  const withTitle = shortTitle > 0 && room >= gap + shortTitle + gap + Math.min(MIN_LINE, fullLine);
  let line = Math.min(fullLine, Math.max(0, room - gap - (withTitle ? gap + shortTitle : 0)));
  if (line < Math.min(MIN_LINE, fullLine)) line = 0;
  const used = line > 0 ? most(rows.map((r) => (r.line ? fitLine(r.line, line) : ''))) : 0;
  const title = withTitle ? Math.min(fullTitle, room - gap - (used > 0 ? used + gap : 0)) : 0;
  return { project, title, state, line };
}

/** The board's lines: the header, then one row per session. */
export function renderBoard(header: string, rows: BoardRow[], layout: BoardLayout): string[] {
  const { mode, columns, height } = layout;
  const w = widths(rows, columns);
  let shown = rows;
  let more = 0;
  if (height !== undefined && rows.length + 1 > height) {
    shown = rows.slice(0, Math.max(0, height - 2));
    more = rows.length - shown.length;
  }
  const lines = shown.map((row) => {
    const cells = [pad(fitProject(row.project, w.project), w.project)];
    if (w.title > 0) cells.push(pad(truncate(row.title ?? '', w.title), w.title));
    cells.push(pad(paintState(row.label, row.state, mode), w.state));
    if (w.line > 0 && row.line) cells.push(fitLine(row.line, w.line));
    return cells.join(GAP).trimEnd();
  });
  if (more > 0) lines.push(style(`… ${more} more`, 'dim', mode));
  const top = style(columns === undefined ? header : truncate(header, columns), 'dim', mode);
  // A last guard: a line wider than the terminal would wrap and break the redraw.
  return [top, ...lines].map((l) => (columns === undefined ? l : truncate(l, columns)));
}
