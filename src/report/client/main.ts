// The report viewer. It draws everything from the JSON embedded in the page. No network, and no
// innerHTML: text from the session reaches the page only through textContent and attributes.
import type { PhaseId } from '../../classify/phases';
import { formatDuration } from '../../model/time';
import { VERSION } from '../../version';
import type { ReportData, ReportStep } from '../data';

const startedAt = performance.now();
const data = JSON.parse(document.getElementById('awf-data')?.textContent ?? 'null') as ReportData;
const steps = data.steps;
const TOTAL = Math.max(1, data.session.totalMs);
const kids: number[][] = steps.map(() => []);
for (const step of steps) if (step.p >= 0) kids[step.p]?.push(step.i);
const phaseName = new Map<PhaseId, string>(data.phases.map((p) => [p.id, p.label]));
const slowRank = new Map(data.slowest.map((i, rank) => [i, rank]));
const leafCount = steps.filter((s) => !s.container).length;

// ---- Helpers ----

type Child = Node | string | null | undefined | false;
type Props = Record<string, string | number | boolean | undefined>;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    if (key === 'class') el.className = String(value);
    else if (key === 'text') el.textContent = String(value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children) if (child) el.append(child);
  return el;
}

const two = (n: number) => String(n).padStart(2, '0');
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();
const clip = (text: string, n: number) => (text.length > n ? text.slice(0, n - 1) + '…' : text);
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
const color = (phase: PhaseId) => `var(--c-${phase})`;
const label = (phase: PhaseId | undefined) => (phase ? (phaseName.get(phase) ?? phase) : '');
const span = (step: ReportStep) => step.e - step.s;

function pct(share: number): string {
  if (share > 0 && share < 0.005) return '<1%';
  return `${Math.round(share * 100)}%`;
}

/** Time since the session started: m:ss, or h:mm:ss for sessions of an hour or more. */
function elapsed(ms: number, seconds = true): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (TOTAL >= 3_600_000) return `${hours}:${two(minutes)}${seconds ? `:${two(total % 60)}` : ''}`;
  return `${Math.floor(total / 60)}:${two(total % 60)}`;
}

function clock(ms: number, withDate = false): string {
  const d = new Date(ms);
  const time = `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
  if (!withDate) return time;
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${time.slice(0, 5)}`;
}

function compact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k`;
  return String(n);
}

function stepText(step: ReportStep): string | undefined {
  if (step.text) return step.text;
  if (step.description) return step.description;
  if (step.kind === 'turn' && step.flags.includes('notification'))
    return 'started by a background task';
  return undefined;
}

// ---- Time scale ----
// Long stretches where only idle time runs (you were away) are squeezed to a sliver, so the work
// keeps its width. Ticks and bars both go through the same mapping.

interface Gap {
  s: number;
  e: number;
  x0: number;
  x1: number;
}

interface Scale {
  x: (t: number) => number;
  gaps: Gap[];
  /** Width per millisecond of live (not squeezed) time, in percent. */
  k: number;
}

const TICK_STEPS = [
  ...[1, 2, 5, 10, 15, 30].map((s) => s * 1000),
  ...[1, 2, 5, 10, 15, 30].map((m) => m * 60_000),
  ...[1, 2, 3, 6, 12, 24].map((hr) => hr * 3_600_000),
];

function idleStretches(): Array<{ s: number; e: number }> {
  const busy = steps
    .filter((s) => s.kind !== 'idle' && s.e > s.s)
    .map((s) => [s.s, s.e] as const)
    .sort((a, b) => a[0] - b[0]);
  const threshold = Math.max(60_000, TOTAL * 0.03);
  const out: Array<{ s: number; e: number }> = [];
  let cursor = 0;
  for (const [a, b] of busy) {
    if (a - cursor >= threshold) out.push({ s: cursor, e: a });
    cursor = Math.max(cursor, b);
  }
  if (TOTAL - cursor >= threshold) out.push({ s: cursor, e: TOTAL });
  return out;
}

const IDLE = idleStretches();

function makeScale(squeeze: boolean): Scale {
  const raw = squeeze ? IDLE : [];
  const gapTime = raw.reduce((n, g) => n + g.e - g.s, 0);
  const live = TOTAL - gapTime;
  const gapWidth = raw.length && live > 0 ? Math.min(1.5, 12 / raw.length) : 0;
  const stretches = gapWidth ? raw : [];
  const liveWidth = 100 - stretches.length * gapWidth;
  const k = liveWidth / (gapWidth ? live : TOTAL);
  const knots: Array<[number, number]> = [[0, 0]];
  const gaps: Gap[] = [];
  let x = 0;
  let t = 0;
  for (const g of stretches) {
    x += (g.s - t) * k;
    knots.push([g.s, x]);
    gaps.push({ s: g.s, e: g.e, x0: x, x1: x + gapWidth });
    x += gapWidth;
    knots.push([g.e, x]);
    t = g.e;
  }
  knots.push([TOTAL, 100]);
  const map = (time: number): number => {
    if (time <= 0) return 0;
    if (time >= TOTAL) return 100;
    let lo = 0;
    let hi = knots.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if ((knots[mid] as [number, number])[0] <= time) lo = mid;
      else hi = mid;
    }
    const [ta, xa] = knots[lo] as [number, number];
    const [tb, xb] = knots[hi] as [number, number];
    return tb === ta ? xa : xa + ((time - ta) / (tb - ta)) * (xb - xa);
  };
  return { x: map, gaps, k };
}

/** "25m", "1h 05m", "40s": short, for the labels of squeezed gaps. */
function brief(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${two(minutes % 60)}m`;
  if (minutes >= 1) return `${minutes}m`;
  return `${Math.round(ms / 1000)}s`;
}

const gapLabel = (gap: Gap) => `${brief(gap.e - gap.s)} idle`;

/** Ticks at round times, far enough apart in pixels that their labels never touch. */
function axisTicks(width: number): { ticks: Array<{ x: number; text: string }>; unit: string } {
  const pick = (sample: string) => {
    const minPct = ((textWidth(sample) + 22) / Math.max(width, 1)) * 100;
    const minStep = minPct / scale.k;
    const step =
      TICK_STEPS.find((s) => s >= minStep) ?? Math.ceil(minStep / 86_400_000) * 86_400_000;
    return { minPct, step };
  };
  let { minPct, step } = pick(TOTAL >= 3_600_000 ? '0:00' : '00:00');
  if (TOTAL >= 3_600_000 && step < 60_000) ({ minPct, step } = pick('0:00:00'));
  const ticks: Array<{ x: number; text: string }> = [];
  let lastX = -Infinity;
  for (let time = 0; time <= TOTAL; time += step) {
    if (scale.gaps.some((g) => time > g.s && time < g.e)) continue;
    const at = scale.x(time);
    if (at - lastX < minPct) continue;
    // Keep clear of each squeezed gap's label.
    const nearGap = scale.gaps.some((g) => {
      const room = ((textWidth(gapLabel(g)) / 2 + 12) / Math.max(width, 1)) * 100;
      return Math.abs(at - (g.x0 + g.x1) / 2) < room + minPct / 2;
    });
    if (time > 0 && nearGap) continue;
    ticks.push({ x: at, text: elapsed(time, step < 60_000) });
    lastX = at;
  }
  const unit = TOTAL >= 3_600_000 ? (step < 60_000 ? 'h:mm:ss' : 'h:mm') : 'm:ss';
  return { ticks, unit };
}

// ---- State ----

const state = {
  /** Containers folded in the full tree, and while filtering. */
  collapsed: new Set<number>(),
  filterCollapsed: new Set<number>(),
  phases: new Set<PhaseId>(),
  failedOnly: false,
  query: '',
  /** The step whose details are open, and the row that holds keyboard focus. */
  open: -1,
  focus: -1,
  squeeze: IDLE.length > 0,
};
for (const step of steps) {
  if (!step.container) continue;
  // Subagents start folded; so do turns when the session is long.
  if (step.kind === 'subagent' || (leafCount > 250 && step.kind === 'turn'))
    state.collapsed.add(step.i);
}
let scale = makeScale(state.squeeze);

const filtering = () => state.phases.size > 0 || state.failedOnly || state.query !== '';

function hit(step: ReportStep): boolean {
  if (state.phases.size > 0 && !(step.phase && state.phases.has(step.phase))) return false;
  if (state.failedOnly && !step.failed) return false;
  if (state.query) {
    const hay = [
      step.label,
      step.text,
      step.tool,
      step.agentType,
      step.description,
      ...step.checks.map((c) => c.key),
    ]
      .filter(Boolean)
      .join('\n')
      .toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

interface View {
  rows: ReportStep[];
  /** Containers with something to unfold in this view. */
  parents: Set<number>;
}

function computeView(): View {
  const filter = filtering();
  let show: Set<number> | undefined;
  const parents = new Set<number>();
  if (filter) {
    show = new Set();
    for (const step of steps) {
      if (!hit(step)) continue;
      show.add(step.i);
      for (let p = step.p; p >= 0 && !parents.has(p); p = steps[p]?.p ?? -1) {
        show.add(p);
        parents.add(p);
      }
    }
  } else {
    for (const step of steps) if (step.container) parents.add(step.i);
  }
  const closed = filter ? state.filterCollapsed : state.collapsed;
  const rows: ReportStep[] = [];
  let skip = Infinity;
  for (const step of steps) {
    if (step.depth > skip) continue;
    skip = Infinity;
    if (show && !show.has(step.i)) continue;
    rows.push(step);
    if (parents.has(step.i) && closed.has(step.i)) skip = step.depth;
  }
  return { rows, parents };
}

let view = computeView();

// ---- Page ----

const app = document.getElementById('app') as HTMLElement;
const wrap = h('div', { class: 'wrap' });
app.append(wrap);

const total = data.session.totalMs;
const active = data.session.activeMs;
const title = data.share
  ? `Shared session ${data.session.id.slice(0, 8)}`
  : (data.session.title ?? `Session ${data.session.id.slice(0, 8)}`);

const themeButton = h('button', { class: 'theme', type: 'button' });
type Theme = 'auto' | 'light' | 'dark';
function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('awf-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  } catch {
    return 'auto';
  }
}
function applyTheme(theme: Theme) {
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  themeButton.textContent = `Theme: ${theme[0]?.toUpperCase()}${theme.slice(1)}`;
  themeButton.setAttribute('aria-label', `Color theme: ${theme}. Change theme`);
}
let theme = readTheme();
applyTheme(theme);
themeButton.addEventListener('click', () => {
  theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto';
  applyTheme(theme);
  try {
    if (theme === 'auto') localStorage.removeItem('awf-theme');
    else localStorage.setItem('awf-theme', theme);
  } catch {
    // Storage can be off (private windows, file pages); the toggle still works for this visit.
  }
});

const AGENTS: Record<string, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex CLI',
  gemini: 'Gemini CLI',
  opencode: 'OpenCode',
};
const agent = AGENTS[data.session.agent] ?? data.session.agent;
const meta = [
  clock(data.session.startMs, true),
  active < total
    ? `${formatDuration(total)} (active ${formatDuration(active)})`
    : formatDuration(total),
  data.session.cwd,
  `${agent}${data.session.agentVersion ? ` ${data.session.agentVersion}` : ''}`,
].filter((part): part is string => !!part);

wrap.append(
  h(
    'header',
    { class: 'top' },
    h(
      'div',
      {},
      h('p', { class: 'brand', text: 'awf · agent waterfall' }),
      h('h1', { text: clip(oneLine(title), 220) }),
      h('p', { class: 'meta', text: meta.join(' · ') }),
    ),
    themeButton,
  ),
);

// ---- Overview: total, stacked phase bar, legend that filters, counts, plain-language notes ----

const shown = data.phases.filter((p) => p.ms > 0);
const card = h('section', { class: 'card', 'aria-label': 'Where the time went' });
card.append(
  h(
    'div',
    { class: 'total' },
    h('span', { class: 'value', text: formatDuration(total) }),
    h('span', {
      class: 'sub',
      text:
        active < total
          ? `total, ${formatDuration(active)} active (the rest is idle time between turns)`
          : 'total',
    }),
  ),
);

const stack = h('div', {
  class: 'stack',
  role: 'img',
  'aria-label': shown.map((p) => `${p.label} ${pct(p.share)}`).join(', '),
});
for (const phase of shown) {
  const piece = h('span', { 'data-phase': phase.id });
  piece.style.background = color(phase.id);
  piece.style.flex = `${phase.ms} 1 0`;
  stack.append(piece);
}
card.append(stack);

const legend = h('ul', {
  class: 'legend',
  'aria-label': 'Phases. Pick one or more to filter steps',
});
const chips = new Map<PhaseId, HTMLButtonElement>();
for (const phase of shown) {
  const chip = h(
    'button',
    {
      class: 'chip',
      type: 'button',
      'aria-pressed': 'false',
      title: phase.detail ? `${phase.label}: ${phase.detail}` : phase.label,
    },
    h('span', { class: 'sw', 'aria-hidden': 'true' }),
    h('span', { class: 'name', text: phase.label }),
    h('span', { class: 'num', text: `${formatDuration(phase.ms)} · ${pct(phase.share)}` }),
  );
  (chip.firstChild as HTMLElement).style.background = color(phase.id);
  chip.addEventListener('click', () => {
    if (state.phases.has(phase.id)) state.phases.delete(phase.id);
    else state.phases.add(phase.id);
    filtersChanged();
  });
  chips.set(phase.id, chip);
  legend.append(h('li', {}, chip));
}
card.append(legend);

const counts = data.counts;
const countParts: Array<[number, string, string?]> = [
  [counts.modelCalls, 'model call'],
  [counts.toolCalls, 'tool call'],
  ...(counts.subagents ? [[counts.subagents, 'subagent'] as [number, string]] : []),
  [counts.failures, 'failed check'],
  [counts.reworkLoops, 'rework loop'],
];
const countsLine = h('p', { class: 'counts' });
for (const [n, one] of countParts) {
  const [num, ...rest] = plural(n, one).split(' ');
  countsLine.append(h('span', {}, h('b', { text: num ?? '' }), ` ${rest.join(' ')}`));
}
if (data.tokens) {
  const input = data.tokens.input + data.tokens.cacheRead + data.tokens.cacheWrite;
  const cached = input > 0 ? data.tokens.cacheRead / input : 0;
  countsLine.append(
    h(
      'span',
      {},
      h('b', { text: compact(input) }),
      ` tokens in (${pct(cached)} from cache), `,
      h('b', { text: compact(data.tokens.output) }),
      ' out',
    ),
  );
}
card.append(countsLine);

const why = h('ul', { class: 'why' });
const ranked = [...shown].sort((a, b) => b.ms - a.ms);
const [first, second, third] = ranked;
if (first) {
  why.append(
    h(
      'li',
      {},
      'Most time went to ',
      h('b', { text: first.label }),
      `: ${formatDuration(first.ms)} (${pct(first.share)})${first.detail ? `, ${first.detail}` : ''}.`,
      second
        ? ` Then ${second.label} ${formatDuration(second.ms)} (${pct(second.share)})${
            third ? ` and ${third.label} ${formatDuration(third.ms)} (${pct(third.share)})` : ''
          }.`
        : '',
    ),
  );
}
if (data.slowest.length) {
  const item = h('li', {}, 'Slowest steps: ');
  data.slowest.forEach((i, n) => {
    const step = steps[i];
    if (!step) return;
    const made = step.kind === 'model' ? steps[step.produces?.[0] ?? -1] : undefined;
    const text = made ? stepText(made) : step.kind === 'model' ? undefined : stepText(step);
    const go = h(
      'button',
      { class: 'link', type: 'button', title: 'Show this step' },
      made ? `${step.label} ${formatDuration(span(step))}, writing ${made.label}` : step.label,
      text ? h('code', { text: clip(oneLine(text), 60) }) : null,
      made ? '' : ` ${formatDuration(span(step))}`,
      step.failed ? ' ✕ failed' : '',
    );
    go.addEventListener('click', () => reveal(i));
    item.append(n > 0 ? ', ' : '', go);
  });
  item.append('.');
  why.append(item);
}
if (data.rework.length) {
  const loops = data.rework.filter((w) => w.edits > 0);
  const item = h('li', {}, loops.length ? `Rework: ` : 'Rework: none. ');
  loops.slice(0, 3).forEach((w, n) => {
    item.append(
      n > 0 ? '; ' : '',
      h('code', { text: w.check }),
      ` failed at ${elapsed(w.failedAt)}`,
      w.passedAt !== undefined
        ? ` and passed at ${elapsed(w.passedAt)} after ${plural(w.edits, 'edit')}`
        : ` and hadn't passed by the end (${plural(w.edits, 'edit')})`,
    );
  });
  if (loops.length > 3) item.append(`; ${loops.length - 3} more`);
  if (!loops.length) item.append('checks failed, but no edits followed before they ran again.');
  else item.append('.');
  why.append(item);
} else {
  why.append(h('li', { text: 'No rework: no check failed and then got fixed.' }));
}
const unclassified = data.phases.find((p) => p.id === 'unclassified');
if (unclassified && unclassified.share >= 0.05 && data.unclassified.length) {
  why.append(
    h(
      'li',
      {},
      `Unclassified ${formatDuration(unclassified.ms)} (${pct(unclassified.share)}): `,
      ...data.unclassified
        .slice(0, 3)
        .flatMap((u, n) => [
          n > 0 ? ', ' : '',
          h('code', { text: u.name }),
          ` ${formatDuration(u.ms)}`,
        ]),
      data.unclassifiedModelMs >= 1000
        ? `, and ${formatDuration(data.unclassifiedModelMs)} of model time writing those calls`
        : '',
      '. Rules in ',
      h('code', { text: '.awf/rules.yaml' }),
      ' can sort them.',
    ),
  );
}
card.append(why);

const table = h('table', {}, h('caption', { class: 'sr', text: 'Time by phase' }));
table.append(
  h(
    'thead',
    {},
    h(
      'tr',
      {},
      h('th', { scope: 'col', text: 'Phase' }),
      h('th', { scope: 'col', class: 'n', text: 'Time' }),
      h('th', { scope: 'col', class: 'n', text: 'Share' }),
      h('th', { scope: 'col', text: 'Detail' }),
    ),
  ),
);
const tbody = h('tbody');
for (const phase of data.phases) {
  tbody.append(
    h(
      'tr',
      {},
      h('td', { text: phase.label }),
      h('td', { class: 'n', text: formatDuration(phase.ms) }),
      h('td', { class: 'n', text: pct(phase.share) }),
      h('td', { text: phase.detail }),
    ),
  );
}
tbody.append(
  h(
    'tr',
    { class: 'sum' },
    h('td', { text: 'Total' }),
    h('td', { class: 'n', text: formatDuration(total) }),
    h('td', { class: 'n', text: '100%' }),
    h('td', {}),
  ),
);
table.append(tbody);
card.append(h('details', { class: 'table' }, h('summary', { text: 'Phase table' }), table));
wrap.append(card);

// ---- Filters ----

const failedBox = h('input', { type: 'checkbox' });
const search = h('input', {
  type: 'search',
  placeholder: data.share ? 'Search tools and phases' : 'Search commands, files, tools',
  'aria-label': 'Search steps',
});
const squeezeBox = h('input', { type: 'checkbox' });
squeezeBox.checked = state.squeeze;
const shownCount = h('span', { class: 'count', 'aria-live': 'polite' });
const clearButton = h('button', { class: 'link', type: 'button', text: 'Clear filters' });
const expandButton = h('button', { class: 'link', type: 'button', text: 'Expand all' });
const collapseButton = h('button', { class: 'link', type: 'button', text: 'Collapse all' });
const filters = h(
  'div',
  { class: 'filters' },
  search,
  h('label', {}, failedBox, 'Failed only'),
  IDLE.length
    ? h(
        'label',
        { title: 'Squeeze long idle stretches to a sliver' },
        squeezeBox,
        'Squeeze idle gaps',
      )
    : null,
  expandButton,
  collapseButton,
  clearButton,
  shownCount,
);
wrap.append(filters);

failedBox.addEventListener('change', () => {
  state.failedOnly = failedBox.checked;
  filtersChanged();
});
let searchTimer = 0;
search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    state.query = search.value.trim().toLowerCase();
    filtersChanged();
  }, 120);
});
squeezeBox.addEventListener('change', () => {
  state.squeeze = squeezeBox.checked;
  scale = makeScale(state.squeeze);
  drawAxis();
  render();
});
clearButton.addEventListener('click', () => {
  state.phases.clear();
  state.failedOnly = false;
  state.query = '';
  failedBox.checked = false;
  search.value = '';
  filtersChanged();
});
expandButton.addEventListener('click', () => {
  (filtering() ? state.filterCollapsed : state.collapsed).clear();
  render();
});
collapseButton.addEventListener('click', () => {
  const closed = filtering() ? state.filterCollapsed : state.collapsed;
  for (const i of view.parents) closed.add(i);
  render();
});

function filtersChanged() {
  state.filterCollapsed.clear();
  for (const [id, chip] of chips) {
    chip.setAttribute('aria-pressed', String(state.phases.has(id)));
    chip.classList.toggle('dim', state.phases.size > 0 && !state.phases.has(id));
  }
  for (const piece of stack.children) {
    const id = (piece as HTMLElement).dataset.phase as PhaseId;
    (piece as HTMLElement).style.opacity =
      state.phases.size > 0 && !state.phases.has(id) ? '0.3' : '';
  }
  render();
}

// ---- Waterfall ----

const fall = h('section', { class: 'fall', 'aria-label': 'Waterfall of every step' });
const axis = h('div', { class: 'axis', 'aria-hidden': 'true' });
const strip = h('div', { class: 'strip', role: 'img' });
const unitLabel = h('div', { class: 'hl' });
fall.append(
  h(
    'div',
    { class: 'head' },
    unitLabel,
    axis,
    h('div', { class: 'hl sub', text: 'Phase at each moment' }),
    strip,
  ),
);
const lines = h('div', { class: 'lines', 'aria-hidden': 'true' });
const list = h('div', { class: 'rows', role: 'list', 'aria-label': 'Steps' });
fall.append(h('div', { class: 'body' }, lines, list));
wrap.append(fall);

function place(el: HTMLElement, s: number, e: number) {
  const a = scale.x(s);
  el.style.left = `${a}%`;
  el.style.width = `${Math.max(0, scale.x(e) - a)}%`;
}

let axisWidth = 0;
let padPx = 64;

const measureContext = document.createElement('canvas').getContext('2d');
const widths = new Map<string, number>();
/** Rough pixel width of a duration label, to place it where it fits. */
function textWidth(text: string): number {
  let width = widths.get(text);
  if (width === undefined) {
    if (measureContext) {
      measureContext.font = `11.5px ${getComputedStyle(document.body).fontFamily}`;
      width = measureContext.measureText(text).width;
    } else {
      width = text.length * 7;
    }
    widths.set(text, width);
  }
  return width;
}

function drawTicks() {
  axisWidth = axis.clientWidth;
  padPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 64;
  const { ticks, unit } = axisTicks(axisWidth || 800);
  unitLabel.textContent = `Step · elapsed ${unit}`;
  axis.replaceChildren();
  lines.replaceChildren();
  for (const tick of ticks) {
    const el = h('span', {
      class: `tick${tick.x === 0 ? ' start' : tick.x > 94 ? ' end' : ''}`,
      text: tick.text,
    });
    el.style.left = `${tick.x}%`;
    axis.append(el);
    const line = h('i');
    line.style.left = `${tick.x}%`;
    lines.append(line);
  }
  for (const gap of scale.gaps) {
    const mark = h('span', {
      class: 'brk',
      title: `${formatDuration(gap.e - gap.s)} idle, squeezed`,
    });
    mark.style.left = `${gap.x0}%`;
    mark.style.width = `${gap.x1 - gap.x0}%`;
    const text = h('span', { class: 'gapl', text: gapLabel(gap) });
    text.style.left = `${(gap.x0 + gap.x1) / 2}%`;
    axis.append(mark, text);
    const band = h('i', { class: 'gap' });
    band.style.left = `${gap.x0}%`;
    band.style.width = `${gap.x1 - gap.x0}%`;
    lines.append(band);
  }
}

function drawAxis() {
  drawTicks();
  strip.replaceChildren();
  data.timeline.forEach(([s, e, phase], n) => {
    if (scale.x(e) - scale.x(s) < 0.02) return;
    const piece = h('span', { 'data-seg': n });
    piece.style.background = color(phase);
    place(piece, s, e);
    strip.append(piece);
  });
  strip.setAttribute(
    'aria-label',
    `Phase over time, from 0 to ${formatDuration(total)}. The phase table lists the totals.`,
  );
}

/** What ran inside a container, by phase: a turn's share of the timeline, or its children. */
function inside(step: ReportStep): Array<[number, number, PhaseId]> {
  const pieces: Array<[number, number, PhaseId]> = [];
  if (step.kind === 'turn') {
    for (const [s, e, phase] of data.timeline)
      if (e > step.s && s < step.e) pieces.push([Math.max(s, step.s), Math.min(e, step.e), phase]);
  } else {
    const walk = (i: number) => {
      for (const k of kids[i] ?? []) {
        const kid = steps[k];
        if (!kid) continue;
        if (kid.container) walk(k);
        else if (kid.phase && kid.e > kid.s) pieces.push([kid.s, kid.e, kid.phase]);
      }
    };
    walk(step.i);
  }
  return pieces;
}

function phaseSplit(step: ReportStep): Array<[PhaseId, number]> {
  const totals = new Map<PhaseId, number>();
  for (const [a, b, phase] of inside(step)) totals.set(phase, (totals.get(phase) ?? 0) + b - a);
  return [...totals].sort((x, y) => y[1] - x[1]);
}

const splitText = (step: ReportStep, n = 3) =>
  phaseSplit(step)
    .slice(0, n)
    .map(([phase, ms]) => `${label(phase)} ${formatDuration(ms)}`)
    .join(' · ');

/** A folded container's track shows what ran inside it, by phase. */
function mixBar(step: ReportStep): HTMLElement {
  const bar = h('span', { class: 'mix' });
  place(bar, step.s, step.e);
  const width = scale.x(step.e) - scale.x(step.s);
  if (width <= 0) return bar;
  const pieces = inside(step);
  const base = scale.x(step.s);
  for (const [s, e, phase] of pieces) {
    const a = ((scale.x(s) - base) / width) * 100;
    const b = ((scale.x(e) - base) / width) * 100;
    if (b - a < 0.05) continue;
    const piece = h('span');
    piece.style.left = `${a}%`;
    piece.style.width = `${b - a}%`;
    piece.style.background = color(phase);
    bar.append(piece);
  }
  return bar;
}

const BADGES: Partial<Record<string, string>> = {
  approval: 'approval',
  denied: 'denied',
  interrupted: 'interrupted',
  background: 'background',
  'api-error': 'API error',
  unfinished: 'no end seen',
};

function rowLabel(step: ReportStep): string {
  const text = stepText(step);
  return [
    step.label,
    text ? clip(oneLine(text), 120) : '',
    label(step.phase),
    formatDuration(span(step)),
    step.failed ? 'failed' : '',
  ]
    .filter(Boolean)
    .join(', ');
}

function row(step: ReportStep): HTMLElement {
  const filter = filtering();
  const unfoldable = view.parents.has(step.i);
  const closed = (filter ? state.filterCollapsed : state.collapsed).has(step.i);
  const el = h('div', {
    class: `row${step.container ? ' group' : ''}${step.kind === 'idle' ? ' idle' : ''}${state.open === step.i ? ' sel' : ''}`,
    role: 'listitem',
    'data-i': step.i,
  });
  const name = h('div', { class: 'name' });
  name.style.paddingLeft = `calc(6px + ${step.depth} * var(--indent))`;
  if (unfoldable) {
    const count = kids[step.i]?.length ?? 0;
    name.append(
      h('button', {
        class: 'tw',
        type: 'button',
        tabindex: -1,
        'aria-expanded': String(!closed),
        'aria-label': `${closed ? 'Show' : 'Hide'} ${plural(count, 'step')} inside ${step.label}`,
        text: closed ? '▸' : '▾',
      }),
    );
  } else {
    name.append(h('span', { class: 'tw', 'aria-hidden': 'true' }));
  }
  const open = h('button', {
    class: 'pick',
    type: 'button',
    tabindex: state.focus === step.i ? 0 : -1,
    'aria-expanded': String(state.open === step.i),
    'aria-label': rowLabel(step),
  });
  if (step.phase && !step.container) {
    const dot = h('span', { class: 'dot', 'aria-hidden': 'true' });
    dot.style.background = color(step.phase);
    open.append(dot);
  }
  open.append(h('span', { class: 'kind', text: step.label }));
  const text = stepText(step);
  if (text) open.append(h('span', { class: 'text', text: clip(oneLine(text), 300) }));
  if (step.failed)
    open.append(h('span', { class: 'fail' }, '✕', h('span', { class: 'w', text: ' failed' })));
  const rank = slowRank.get(step.i);
  if (rank !== undefined)
    open.append(
      h('span', { class: 'badge', text: rank === 0 ? 'slowest' : `#${rank + 1} slowest` }),
    );
  for (const flag of step.flags) {
    const badge = BADGES[flag];
    if (badge && !(flag === 'background' && step.kind === 'background'))
      open.append(h('span', { class: 'badge soft', text: badge }));
  }
  name.append(open);
  el.append(name);

  const track = h('div', { class: 'track', 'aria-hidden': 'true' });
  if (step.container && closed) {
    track.append(mixBar(step));
  } else {
    const bar = h('span', { class: `bar${step.failed ? ' failed' : ''}` });
    if (step.failed) bar.style.background = 'var(--critical)';
    else if (!step.container && step.phase) bar.style.background = color(step.phase);
    place(bar, step.s, step.e);
    track.append(bar);
  }
  const dur = h(
    'span',
    { class: 'dur' },
    step.failed ? h('span', { class: 'x', text: '✕ ' }) : null,
    formatDuration(span(step)),
  );
  // Right of the bar if it fits before the edge, else left of it, else inside its end.
  const start = scale.x(step.s);
  const end = scale.x(step.e);
  const width = textWidth(dur.textContent ?? '') + 6;
  if (((100 - end) / 100) * axisWidth + padPx >= width + 4) {
    dur.style.left = `calc(${end}% + 6px)`;
  } else if ((start / 100) * axisWidth >= width + 4) {
    dur.style.right = `calc(${100 - start}% + 6px)`;
  } else {
    dur.classList.add('in');
    dur.style.right = `calc(${100 - end}% + 4px)`;
  }
  track.append(dur);
  el.append(track);
  if (state.open === step.i) el.append(details(step));
  return el;
}

/** The classifier's notes, in words. */
function describeTag(tag: string): string {
  const colon = tag.indexOf(':');
  const kind = colon > 0 ? tag.slice(0, colon) : tag;
  const value = colon > 0 ? tag.slice(colon + 1) : '';
  switch (kind) {
    case 'script':
      return `runs the package script "${value}"`;
    case 'make':
      return `runs the make target "${value}"`;
    case 'task':
      return `runs the task "${value}"`;
    case 'hook':
      return `runs the git hook ${value}`;
    case 'file':
      return `runs the script ${value}`;
    case 'via':
      return `through ${value}`;
    case 'unmatched':
      return `no rule for "${value}"`;
    case 'was':
      return `was ${label(value as PhaseId) || value} before a check failed`;
  }
  const words: Record<string, string> = {
    'by-name': 'phase guessed from a script or task name',
    install: 'installs dependencies',
    polling: 'waits in a loop',
    neutral: 'only commands that say nothing about the phase',
    'failure-unattributed': 'the failure could not be pinned on one check',
    'background-task': 'waits on a background task',
    compaction: 'context compaction',
    subagent: 'ran a subagent',
    'no-command': 'no command recorded',
  };
  if (words[tag]) return words[tag];
  if (phaseName.has(tag as PhaseId)) return `also ${label(tag as PhaseId)}`;
  return tag;
}

function details(step: ReportStep): HTMLElement {
  const box = h('div', { class: 'more', role: 'region', 'aria-label': `Details: ${step.label}` });
  const dl = h('dl');
  const add = (term: string, ...value: Child[]) =>
    dl.append(h('dt', { text: term }), h('dd', {}, ...value));
  if (step.phase) {
    const swatch = h('span', { class: 'sw', 'aria-hidden': 'true' });
    swatch.style.background = color(step.phase);
    add(
      'Phase',
      swatch,
      label(step.phase),
      step.reworkFor ? ` (after ${step.reworkFor} failed)` : '',
    );
  }
  add(
    'When',
    `${elapsed(step.s)} → ${elapsed(step.e)} · ${formatDuration(span(step))} · ${clock(data.session.startMs + step.s)}`,
  );
  if (step.waitMs) add('Waited for you', formatDuration(step.waitMs));
  if (step.runMs !== undefined && step.waitMs) add('Ran', formatDuration(step.runMs));
  if (step.kind === 'tool' || step.kind === 'background') {
    const status = step.failed
      ? h('span', { class: 'status-failed', text: '✕ Failed' })
      : step.ok === true
        ? 'OK'
        : step.ok === false
          ? 'Error'
          : 'Unknown';
    add('Result', status, step.exitCode !== undefined ? ` · exit code ${step.exitCode}` : '');
  }
  if (step.tool) add('Tool', step.tool);
  if (step.agentType) add('Agent type', step.agentType);
  if (step.model) add('Model', step.model);
  if (step.tokens) {
    const t = step.tokens;
    const seconds = span(step) / 1000;
    add(
      'Tokens',
      `${compact(t.input + t.cacheRead + t.cacheWrite)} in (${compact(t.cacheRead)} cached) · ${compact(t.output)} out`,
      step.kind === 'model' && seconds >= 1 && t.output > 0
        ? ` · ${Math.round(t.output / seconds)} tokens/s out`
        : '',
    );
  }
  if (step.checks.length)
    add('Checks', step.checks.map((c) => `${c.key} ${c.failed ? 'failed' : 'passed'}`).join(', '));
  if (step.flags.length) add('Flags', step.flags.map((f) => BADGES[f] ?? f).join(', '));
  const notes = step.tags.map(describeTag).filter(Boolean);
  if (notes.length) add('Notes', notes.join('; '));
  if (step.container) {
    add('Inside', plural(kids[step.i]?.length ?? 0, 'step'));
    const split = splitText(step, 5);
    if (split) add('By phase', split);
  }
  if (step.kind === 'tool' && !data.session.sources.includes('recorder') && !step.waitMs)
    add(
      'Note',
      'May include waiting for your approval: only the recorder (the plugin) sees approvals.',
    );
  box.append(dl);
  const block = (heading: string, text: string) =>
    box.append(h('h3', { text: heading }), h('pre', { text }));
  if (step.kind === 'model' && step.produces?.length) {
    box.append(h('h3', { text: 'Wrote these calls' }));
    const made = h('ul', { class: 'made' });
    for (const i of step.produces) {
      const call = steps[i];
      if (!call) continue;
      const text = stepText(call);
      const go = h(
        'button',
        { class: 'link', type: 'button' },
        call.label,
        text ? h('code', { text: clip(oneLine(text), 100) }) : null,
        ` ${formatDuration(span(call))}`,
      );
      go.addEventListener('click', (event) => {
        event.stopPropagation();
        reveal(i);
      });
      made.append(h('li', {}, go));
    }
    box.append(made);
  } else if (step.text && step.tool === 'Bash') block('Command', step.text);
  if (step.files?.length) block(step.files.length === 1 ? 'File' : 'Files', step.files.join('\n'));
  if (step.description && step.description !== step.text) block('Description', step.description);
  if (step.output)
    block(
      `Output (secrets masked${step.output.length >= 4000 ? ', first 4,000 characters' : ''})`,
      step.output,
    );
  if (data.share)
    box.append(
      h('p', { class: 'note', text: 'Shared report: commands, files and output are left out.' }),
    );
  return box;
}

function render() {
  const hadFocus = list.contains(document.activeElement);
  view = computeView();
  if (!view.rows.some((r) => r.i === state.focus)) state.focus = view.rows[0]?.i ?? -1;
  const fragment = document.createDocumentFragment();
  for (const step of view.rows) fragment.append(row(step));
  if (!view.rows.length)
    fragment.append(
      h('p', {
        class: 'empty',
        text: steps.length ? 'No steps match these filters.' : 'This session has no steps.',
      }),
    );
  list.replaceChildren(fragment);
  const leaves = view.rows.filter((r) => !r.container).length;
  shownCount.textContent = filtering()
    ? `${plural(leaves, 'step')} match, of ${leafCount.toLocaleString('en-US')}`
    : plural(leafCount, 'step');
  clearButton.hidden = !filtering();
  if (hadFocus) focusRow(state.focus);
}

function focusRow(i: number) {
  state.focus = i;
  for (const button of list.querySelectorAll<HTMLButtonElement>('.pick')) button.tabIndex = -1;
  const button = list.querySelector<HTMLButtonElement>(`.row[data-i="${i}"] .pick`);
  if (button) {
    button.tabIndex = 0;
    button.focus({ preventScroll: false });
  }
}

function toggleKids(i: number) {
  const closed = filtering() ? state.filterCollapsed : state.collapsed;
  if (closed.has(i)) closed.delete(i);
  else closed.add(i);
  state.focus = i;
  render();
  focusRow(i);
}

function toggleOpen(i: number) {
  state.open = state.open === i ? -1 : i;
  state.focus = i;
  render();
  focusRow(i);
}

/** Shows one step: clears filters that hide it, unfolds its parents, opens its details. */
function reveal(i: number) {
  const step = steps[i];
  if (!step) return;
  if (filtering() && !hit(step)) clearButton.click();
  for (let p = step.p; p >= 0; p = steps[p]?.p ?? -1) {
    state.collapsed.delete(p);
    state.filterCollapsed.delete(p);
  }
  state.open = i;
  state.focus = i;
  render();
  focusRow(i);
  list.querySelector(`.row[data-i="${i}"]`)?.scrollIntoView({ block: 'center' });
}

list.addEventListener('click', (event) => {
  const target = event.target as Element;
  if (target.closest('.more')) return;
  const rowEl = target.closest('.row');
  if (!rowEl) return;
  const i = Number(rowEl.getAttribute('data-i'));
  if (target.closest('.tw')) toggleKids(i);
  else toggleOpen(i);
});

list.addEventListener('keydown', (event) => {
  const rowEl = (event.target as Element).closest('.row');
  if (!rowEl || !(event.target as Element).closest('.pick')) return;
  const i = Number(rowEl.getAttribute('data-i'));
  const index = view.rows.findIndex((r) => r.i === i);
  const step = steps[i];
  if (!step) return;
  const closed = (filtering() ? state.filterCollapsed : state.collapsed).has(i);
  const move = (to: number) => {
    const target = view.rows[Math.max(0, Math.min(view.rows.length - 1, to))];
    if (target) focusRow(target.i);
  };
  switch (event.key) {
    case 'ArrowDown':
      move(index + 1);
      break;
    case 'ArrowUp':
      move(index - 1);
      break;
    case 'Home':
      move(0);
      break;
    case 'End':
      move(view.rows.length - 1);
      break;
    case 'ArrowRight':
      if (view.parents.has(i) && closed) toggleKids(i);
      else if (view.parents.has(i)) move(index + 1);
      break;
    case 'ArrowLeft':
      if (view.parents.has(i) && !closed) toggleKids(i);
      else if (step.p >= 0) focusRow(step.p);
      break;
    case 'Escape':
      if (state.open >= 0) toggleOpen(state.open);
      break;
    default:
      return;
  }
  event.preventDefault();
});

// ---- Tooltip: hover a bar, a phase or a stretch of the strip ----

const tip = h('div', { class: 'tip', role: 'tooltip', hidden: true });
document.body.append(tip);
const canHover = window.matchMedia('(hover: hover)').matches;

function tipFor(target: Element): Child[] | undefined {
  const phaseEl = target.closest<HTMLElement>('[data-phase]');
  if (phaseEl) {
    const phase = data.phases.find((p) => p.id === phaseEl.dataset.phase);
    if (phase)
      return [
        h('b', { text: phase.label }),
        h('span', {
          text: `${formatDuration(phase.ms)} · ${pct(phase.share)}${phase.detail ? ` · ${phase.detail}` : ''}`,
        }),
      ];
  }
  const segEl = target.closest<HTMLElement>('[data-seg]');
  if (segEl) {
    const seg = data.timeline[Number(segEl.dataset.seg)];
    if (seg)
      return [
        h('b', { text: label(seg[2]) }),
        h('span', {
          text: `${elapsed(seg[0])} → ${elapsed(seg[1])} · ${formatDuration(seg[1] - seg[0])}`,
        }),
      ];
  }
  const trackEl = target.closest('.track');
  const rowEl = trackEl?.closest('.row');
  if (rowEl) {
    const step = steps[Number(rowEl.getAttribute('data-i'))];
    if (!step) return undefined;
    const text = stepText(step);
    return [
      h('b', { text: step.label }),
      text ? h('code', { text: clip(oneLine(text), 160) }) : null,
      h('span', {
        text: [
          label(step.phase),
          formatDuration(span(step)),
          `${elapsed(step.s)} → ${elapsed(step.e)}`,
          step.failed ? '✕ failed' : '',
        ]
          .filter(Boolean)
          .join(' · '),
      }),
      step.container ? h('span', { text: splitText(step) }) : null,
    ];
  }
  return undefined;
}

if (canHover) {
  document.addEventListener('mousemove', (event) => {
    const content = event.target instanceof Element ? tipFor(event.target) : undefined;
    if (!content) {
      tip.hidden = true;
      return;
    }
    tip.replaceChildren(...content.filter((c): c is Node | string => !!c));
    tip.hidden = false;
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const left = Math.min(event.clientX + 14, window.innerWidth - width - 8);
    const top =
      event.clientY + 18 + height > window.innerHeight
        ? event.clientY - height - 12
        : event.clientY + 18;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;
  });
  document.addEventListener('mouseleave', () => (tip.hidden = true));
}

// ---- Footer ----

wrap.append(
  h(
    'footer',
    { class: 'foot' },
    `Made by awf ${VERSION} on ${clock(data.generatedAt, true)}. `,
    data.share
      ? 'Shared report: phases, durations and tool names only.'
      : 'This file holds commands, file paths and tool output from the session, with secrets masked. Make a version without them with --share.',
  ),
);

drawAxis();
render();
let resizeFrame = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (axis.clientWidth === axisWidth) return;
    drawTicks();
    render();
  });
});
document.body.dataset.ready = '1';
document.body.dataset.renderMs = String(Math.round(performance.now() - startedAt));
