// The dashboard: every session's time by phase, with filters. It draws itself from the JSON in
// #awf-dash, makes no network requests, and keeps only the theme and the filters in localStorage.
import type { PhaseId } from '../../classify/phases';
import type { DashData, DashSession } from '../data';

const data = JSON.parse(document.getElementById('awf-dash')?.textContent ?? 'null') as DashData;
const PHASES = data.phases;
const PHASE_INDEX = new Map(PHASES.map((p, i) => [p.id, i]));
const LABEL = new Map(PHASES.map((p) => [p.id, p.label]));
const ALL: PhaseId[] = PHASES.map((p) => p.id);
const WORKING: PhaseId[] = ALL.filter((id) => id !== 'waiting');
const HOUR = 3_600_000;
const DAY = 86_400_000;

// ---------------------------------------------------------------- helpers

type Attrs = Record<string, string | number | boolean | undefined>;
type Child = Node | string | null | undefined | false;

function n(tag: string, attrs: Attrs = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === 'class') el.className = String(value);
    else if (key === 'text') el.textContent = String(value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children) if (child) el.append(child);
  return el;
}

const pad = (v: number) => String(v).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const shortDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
const longDate = (d: Date) => `${shortDate(d)}, ${d.getFullYear()}`;
const clock = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const int = (v: number) => Math.round(v).toLocaleString('en-US');

/** Hours as people say them: 45m, 2.5h, 37h, 1,204h. */
function hours(ms: number): string {
  const h = ms / HOUR;
  if (!Number.isFinite(h) || h <= 0) return '0h';
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 10) return `${h.toFixed(1)}h`;
  return `${int(h)}h`;
}
function pct(share: number): string {
  if (!Number.isFinite(share) || share <= 0) return '0%';
  if (share < 0.01) return '<1%';
  return `${Math.round(share * 100)}%`;
}
const plural = (count: number, one: string, many = `${one}s`) =>
  `${int(count)} ${count === 1 ? one : many}`;

function swatch(id: PhaseId): HTMLElement {
  const s = n('span', { class: 'sw', 'aria-hidden': 'true' });
  s.style.background = `var(--c-${id})`;
  return s;
}

/** Start of the local day, week (Monday) or month a time falls in. */
function bucketStart(ms: number, bucket: Bucket): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  if (bucket === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (bucket === 'month') d.setDate(1);
  return d.getTime();
}
function nextBucket(ms: number, bucket: Bucket): number {
  const d = new Date(ms);
  if (bucket === 'day') d.setDate(d.getDate() + 1);
  else if (bucket === 'week') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

/** Round tick values from 0 to at least `max`. */
function ticks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = 0; v < max + step * 0.999; v += step) out.push(Number(v.toPrecision(12)));
  return out;
}

// ---------------------------------------------------------------- state

type Bucket = 'day' | 'week' | 'month';
type Range = 'all' | '7' | '14' | '30' | '90';
type SortKey = 'id' | 'start' | 'project' | 'picked' | 'top' | 'turns' | 'tools' | 'failures';
interface State {
  phases: PhaseId[];
  project: number;
  range: Range;
  bucket: Bucket;
  mode: 'hours' | 'share';
  sort: { key: SortKey; dir: 'asc' | 'desc' };
  query: string;
}
const DEFAULTS: State = {
  phases: WORKING,
  project: -1,
  range: 'all',
  bucket: 'week',
  mode: 'hours',
  sort: { key: 'start', dir: 'desc' },
  query: '',
};
const STORE = 'awf-dash';

function loadState(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) ?? 'null') as Partial<State> | null;
    if (!saved) return { ...DEFAULTS };
    return {
      phases: Array.isArray(saved.phases)
        ? saved.phases.filter((id) => PHASE_INDEX.has(id))
        : DEFAULTS.phases,
      project:
        typeof saved.project === 'number' && data.projects[saved.project] ? saved.project : -1,
      range: (['all', '7', '14', '30', '90'] as Range[]).includes(saved.range as Range)
        ? (saved.range as Range)
        : 'all',
      bucket: (['day', 'week', 'month'] as Bucket[]).includes(saved.bucket as Bucket)
        ? (saved.bucket as Bucket)
        : 'week',
      mode: saved.mode === 'share' ? 'share' : 'hours',
      sort: DEFAULTS.sort,
      query: '',
    };
  } catch {
    return { ...DEFAULTS };
  }
}
let state = loadState();
function setState(patch: Partial<State>): void {
  state = { ...state, ...patch };
  try {
    const { phases, project, range, bucket, mode } = state;
    localStorage.setItem(STORE, JSON.stringify({ phases, project, range, bucket, mode }));
  } catch {
    // Storage blocked: the filters still work, they just aren't remembered.
  }
  render();
}

// ---------------------------------------------------------------- the view

interface Row {
  s: DashSession;
  /** Picked phases' time. */
  picked: number;
  total: number;
  top?: PhaseId;
}
interface View {
  inRange: Row[];
  rows: Row[];
  picked: PhaseId[];
  totals: Map<PhaseId, number>;
  pickedTotal: number;
  grand: number;
  from: number;
  to: number;
}

const lastStart = data.sessions.reduce((m, s) => Math.max(m, s.startMs), 0);
const firstStart = data.sessions.reduce((m, s) => Math.min(m, s.startMs), Infinity);

function view(): View {
  const picked = PHASES.map((p) => p.id).filter((id) => state.phases.includes(id));
  const cutoff =
    state.range === 'all'
      ? -Infinity
      : bucketStart(lastStart, 'day') - (Number(state.range) - 1) * DAY;
  const inRange: Row[] = [];
  for (const s of data.sessions) {
    if (s.startMs < cutoff) continue;
    let top: PhaseId | undefined;
    let pickedMs = 0;
    for (const id of picked) {
      const ms = s.ms[PHASE_INDEX.get(id) ?? 0] ?? 0;
      pickedMs += ms;
      if (ms > 0 && (!top || ms > (s.ms[PHASE_INDEX.get(top) ?? 0] ?? 0))) top = id;
    }
    inRange.push({
      s,
      picked: pickedMs,
      total: s.ms.reduce((a, b) => a + b, 0),
      ...(top ? { top } : {}),
    });
  }
  const rows = state.project < 0 ? inRange : inRange.filter((r) => r.s.project === state.project);
  const totals = new Map<PhaseId, number>();
  for (const id of ALL) {
    const i = PHASE_INDEX.get(id) ?? 0;
    totals.set(
      id,
      rows.reduce((sum, r) => sum + (r.s.ms[i] ?? 0), 0),
    );
  }
  const pickedTotal = picked.reduce((sum, id) => sum + (totals.get(id) ?? 0), 0);
  const grand = ALL.reduce((sum, id) => sum + (totals.get(id) ?? 0), 0);
  const from = rows.reduce((m, r) => Math.min(m, r.s.startMs), Infinity);
  const to = rows.reduce((m, r) => Math.max(m, r.s.startMs), -Infinity);
  return { inRange, rows, picked, totals, pickedTotal, grand, from, to };
}

// ---------------------------------------------------------------- tooltip

const tip = n('div', { class: 'tip', role: 'tooltip', hidden: true });
document.body.append(tip);
const canHover = window.matchMedia('(hover: hover)').matches;
function showTip(event: PointerEvent, ...lines: Node[]): void {
  if (!canHover) return;
  tip.replaceChildren(...lines);
  tip.hidden = false;
  const w = tip.offsetWidth;
  const h = tip.offsetHeight;
  const x = Math.min(event.clientX + 14, window.innerWidth - w - 8);
  const y =
    event.clientY + 18 + h > window.innerHeight ? event.clientY - h - 12 : event.clientY + 18;
  tip.style.left = `${Math.max(8, x)}px`;
  tip.style.top = `${Math.max(8, y)}px`;
}
const hideTip = () => {
  tip.hidden = true;
};
const tipHead = (text: string) => n('div', { class: 'tip-h', text });
function tipLine(id: PhaseId | null, label: string, value: string, total = false): HTMLElement {
  return n(
    'div',
    { class: `tip-r${total ? ' total' : ''}` },
    id ? swatch(id) : n('span'),
    n('span', { text: label }),
    n('b', { text: value }),
  );
}

// ---------------------------------------------------------------- page skeleton

const app = document.getElementById('app') as HTMLElement;
const wrap = n('div', { class: 'wrap' });
app.append(wrap);

const themeButton = n('button', { class: 'btn theme', type: 'button' });
type Theme = 'auto' | 'light' | 'dark';
function savedTheme(): Theme {
  try {
    const t = localStorage.getItem('awf-theme');
    return t === 'light' || t === 'dark' ? t : 'auto';
  } catch {
    return 'auto';
  }
}
let theme = savedTheme();
function applyTheme(t: Theme): void {
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  themeButton.textContent = `Theme: ${t[0]?.toUpperCase()}${t.slice(1)}`;
  themeButton.setAttribute('aria-label', `Color theme: ${t}. Change theme`);
}
applyTheme(theme);
themeButton.addEventListener('click', () => {
  theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto';
  applyTheme(theme);
  try {
    if (theme === 'auto') localStorage.removeItem('awf-theme');
    else localStorage.setItem('awf-theme', theme);
  } catch {
    // Not remembered.
  }
});

const made = new Date(data.generatedAt);
wrap.append(
  n(
    'header',
    { class: 'top', id: 'summary' },
    n(
      'div',
      {},
      n('p', { class: 'brand', text: 'awf · agent waterfall' }),
      n('h1', { text: 'Agent time by phase' }),
      n('p', {
        class: 'meta',
        text: data.sessions.length
          ? `${plural(data.sessions.length, 'session')} · ${longDate(new Date(firstStart))} – ${longDate(new Date(lastStart))} · made ${longDate(made)}, ${clock(made)}`
          : `No sessions yet · made ${longDate(made)}, ${clock(made)}`,
      }),
    ),
    themeButton,
  ),
);
const take = n('p', { class: 'take', 'aria-live': 'polite' });
wrap.append(take);

// Filters
const select = (
  id: string,
  label: string,
  options: Array<[string, string]>,
  onChange: (v: string) => void,
) => {
  const s = n('select', { id, class: 'select', 'aria-label': label }) as HTMLSelectElement;
  for (const [value, text] of options) s.append(new Option(text, value));
  s.addEventListener('change', () => onChange(s.value));
  return { field: n('label', { class: 'field', for: id }, n('span', { text: label }), s), el: s };
};
const range = select(
  'f-range',
  'Period',
  [
    ['all', 'All time'],
    ['7', 'Last 7 days'],
    ['14', 'Last 14 days'],
    ['30', 'Last 30 days'],
    ['90', 'Last 90 days'],
  ],
  (v) => setState({ range: v as Range }),
);
const projectNames = data.projects
  .map((p, i) => ({ i, name: p.name }))
  .sort((a, b) => a.name.localeCompare(b.name));
const project = select(
  'f-project',
  'Project',
  [['-1', 'All projects'], ...projectNames.map((p): [string, string] => [String(p.i), p.name])],
  (v) => setState({ project: Number(v) }),
);
const bucket = select(
  'f-bucket',
  'Chart by',
  [
    ['week', 'Week'],
    ['day', 'Day'],
    ['month', 'Month'],
  ],
  (v) => setState({ bucket: v as Bucket }),
);
const modeButtons = (['hours', 'share'] as const).map((m) => {
  const b = n('button', { class: 'btn', type: 'button', text: m === 'hours' ? 'Hours' : 'Share' });
  b.addEventListener('click', () => setState({ mode: m }));
  return { m, b };
});
const reset = n('button', { class: 'btn', type: 'button', text: 'Reset filters' });
reset.addEventListener('click', () =>
  setState({ ...DEFAULTS, sort: state.sort, query: state.query }),
);
const periodNote = n('span', { class: 'period' });

const PRESETS: Array<[string, PhaseId[]]> = [
  ['All', ALL],
  ['Working time (no waiting)', WORKING],
  ['Only waiting on you', ['waiting']],
  ['None', []],
];
const presetButtons = PRESETS.map(([label, list]) => {
  const b = n('button', { class: 'btn', type: 'button', text: label });
  b.addEventListener('click', () => setState({ phases: list }));
  return { list, b };
});
const chips = PHASES.map((p) => {
  const num = n('span', { class: 'num' });
  const b = n(
    'button',
    { class: 'chip', type: 'button' },
    swatch(p.id),
    n('span', { text: p.label }),
    num,
  );
  b.addEventListener('click', () => {
    const on = state.phases.includes(p.id);
    setState({ phases: ALL.filter((id) => (id === p.id ? !on : state.phases.includes(id))) });
  });
  return { id: p.id, b, num };
});

wrap.append(
  n(
    'section',
    { class: 'card filters', id: 'filters', 'aria-label': 'Filters' },
    n(
      'div',
      { class: 'row' },
      range.field,
      project.field,
      bucket.field,
      n(
        'div',
        { class: 'field' },
        n('span', { text: 'Show as' }),
        n(
          'div',
          { class: 'seg', role: 'group', 'aria-label': 'Show as' },
          ...modeButtons.map((m) => m.b),
        ),
      ),
      reset,
      periodNote,
    ),
    n(
      'div',
      { class: 'phases', role: 'group', 'aria-label': 'Phases' },
      n(
        'div',
        { class: 'presets' },
        n('span', { class: 'label', text: 'Phases' }),
        ...presetButtons.map((p) => p.b),
      ),
      n('ul', { class: 'chips' }, ...chips.map((c) => n('li', {}, c.b))),
    ),
  ),
);

const card = (
  id: string,
  title: string,
  note: string,
  body: HTMLElement,
  ...extra: HTMLElement[]
) =>
  n(
    'section',
    { class: 'card', id, 'aria-labelledby': `${id}-h` },
    n(
      'div',
      { class: 'card-h' },
      n('h2', { id: `${id}-h`, text: title }),
      n('p', { class: 'note', text: note }),
    ),
    ...extra,
    body,
  );
const noneNote = () => n('p', { class: 'note empty', text: 'Pick at least one phase above.' });

const phaseBars = n('div', { class: 'bars' });
const projectBars = n('div', { class: 'bars' });
const clearProject = n('button', { class: 'link', type: 'button', text: 'Show every project' });
clearProject.addEventListener('click', () => setState({ project: -1 }));
/** Projects listed before "Show all": the rest are usually minutes each. */
const PROJECT_LIMIT = 10;
let allProjects = false;
const moreProjects = n('button', { class: 'link', type: 'button' });
moreProjects.addEventListener('click', () => {
  allProjects = !allProjects;
  renderProjectBars(view());
});
const timeChart = n('div', { class: 'tchart' });
wrap.append(
  n(
    'div',
    { class: 'grid2' },
    card(
      'phases',
      'Where the time went',
      'Time in each phase you picked, and its share of them.',
      phaseBars,
      noneNote(),
    ),
    card(
      'projects',
      'By project',
      'Picked phases in each repository. Click one to filter the page to it.',
      n('div', { class: 'stackv' }, projectBars, moreProjects),
      noneNote(),
      clearProject,
    ),
  ),
  card(
    'over-time',
    'Over time',
    'Picked phases, counted on the day each session started. Hover a bar for its split.',
    timeChart,
    noneNote(),
  ),
);

// Sessions table
const search = n('input', {
  type: 'search',
  class: 'search',
  id: 't-search',
  placeholder: 'Search sessions',
  'aria-label': 'Search sessions by ID, project, folder or version',
}) as HTMLInputElement;
search.addEventListener('input', () => {
  state = { ...state, query: search.value };
  renderTable(view());
});
const shownCount = n('span', { class: 'note' });
const COLUMNS: Array<{ key: SortKey; label: string; num?: boolean; wide?: boolean }> = [
  { key: 'id', label: 'Session' },
  { key: 'start', label: 'Started' },
  { key: 'project', label: 'Project' },
  { key: 'picked', label: 'Picked phases', num: true },
  { key: 'top', label: 'Biggest picked phase' },
  { key: 'turns', label: 'In turns', num: true, wide: true },
  { key: 'tools', label: 'Tool calls', num: true, wide: true },
  { key: 'failures', label: 'Failed checks', num: true, wide: true },
];
const heads = COLUMNS.map((c) => {
  const b = n('button', { class: 'sort', type: 'button', text: c.label });
  b.addEventListener('click', () => {
    const asc = c.key === 'id' || c.key === 'project' || c.key === 'top';
    state = {
      ...state,
      sort:
        state.sort.key === c.key
          ? { key: c.key, dir: state.sort.dir === 'asc' ? 'desc' : 'asc' }
          : { key: c.key, dir: asc ? 'asc' : 'desc' },
    };
    renderTable(view());
  });
  return {
    c,
    th: n(
      'th',
      { scope: 'col', class: [c.num ? 'n' : '', c.wide ? 'wide' : ''].filter(Boolean).join(' ') },
      b,
    ),
  };
});
const tbody = n('tbody');
wrap.append(
  card(
    'sessions',
    'Sessions',
    'Every session in this view. Sort by any column. Copy a session’s ID to open its waterfall with awf report.',
    n(
      'div',
      { class: 'tablebox' },
      n(
        'table',
        {},
        n('caption', { class: 'sr', text: 'Sessions' }),
        n('thead', {}, n('tr', {}, ...heads.map((h) => h.th))),
        tbody,
      ),
    ),
    n('div', { class: 'tools' }, search, shownCount),
  ),
);

wrap.append(
  n(
    'details',
    { class: 'card method', id: 'method' },
    n('summary', { text: 'How these numbers are counted' }),
    n(
      'dl',
      {},
      n('dt', { text: 'Sessions' }),
      n('dd', {
        text: 'Every session awf has: recorded by its hooks, or read from the agents’ logs by awf import. Each one counts on the day it started, even when it ran for several days.',
      }),
      n('dt', { text: 'Phases' }),
      n('dd', {
        text: 'The same phases as awf summary, defined in docs/phases.md. Shares are of the phases you picked, so leaving out Waiting on you shows how the working time splits.',
      }),
      n('dt', { text: 'Projects' }),
      n('dd', {
        text: 'The repository a session ran in: the nearest folder above it with a .git. Outside a repository it’s the session’s own folder, and every temporary folder counts as one project.',
      }),
      n('dt', { text: 'What’s left out' }),
      n('dd', {
        text: 'Sessions on other machines and in the cloud, and logs the agents deleted before awf imported them. Run awf import now and then to keep your history.',
      }),
    ),
  ),
  n('footer', {
    class: 'foot',
    text: `Made by awf ${data.version}. This file holds session IDs, folder names and timings; no prompts, commands or output.`,
  }),
);

// ---------------------------------------------------------------- drawing

function renderHeader(v: View): void {
  if (!v.picked.length) {
    take.replaceChildren('Pick at least one phase to see where the time went.');
    return;
  }
  if (!v.rows.length) {
    take.replaceChildren('No sessions in this view. Widen the period or pick another project.');
    return;
  }
  const top = v.picked.slice().sort((a, b) => (v.totals.get(b) ?? 0) - (v.totals.get(a) ?? 0))[0];
  const b = (text: string) => n('b', { text });
  take.replaceChildren(
    'The phases you picked add up to ',
    b(hours(v.pickedTotal)),
    ' over ',
    b(plural(v.rows.length, 'session')),
    ', ',
    b(pct(v.grand ? v.pickedTotal / v.grand : 0)),
    ' of all the time in this view.',
    ...(top && v.pickedTotal > 0
      ? [
          ' ',
          b(LABEL.get(top) ?? top),
          ' takes the most, with ',
          b(pct((v.totals.get(top) ?? 0) / v.pickedTotal)),
          ' of it.',
        ]
      : []),
  );
}

function renderFilters(v: View): void {
  range.el.value = state.range;
  project.el.value = String(state.project);
  bucket.el.value = state.bucket;
  for (const { m, b } of modeButtons) b.setAttribute('aria-pressed', String(state.mode === m));
  for (const { list, b } of presetButtons) {
    const same =
      list.length === state.phases.length && list.every((id) => state.phases.includes(id));
    b.setAttribute('aria-pressed', String(same));
  }
  for (const c of chips) {
    const on = state.phases.includes(c.id);
    c.b.setAttribute('aria-pressed', String(on));
    c.b.classList.toggle('off', !on);
    c.num.textContent = hours(v.totals.get(c.id) ?? 0);
  }
  periodNote.textContent = v.rows.length
    ? `${longDate(new Date(v.from))} – ${longDate(new Date(v.to))} · ${plural(v.rows.length, 'session')}`
    : 'No sessions';
  clearProject.hidden = state.project < 0;
  for (const e of wrap.querySelectorAll<HTMLElement>('.empty')) e.hidden = v.picked.length > 0;
}

function barRow(
  label: Child[],
  segments: Array<{ id: PhaseId; ms: number }>,
  width: number,
  value: Child[],
): HTMLElement[] {
  const total = segments.reduce((sum, s) => sum + s.ms, 0);
  const track = n('span', { class: 'track' });
  const fill = n('span', { class: 'fill' });
  fill.style.width = `${Math.max(0, Math.min(100, width))}%`;
  for (const s of segments) {
    if (s.ms <= 0) continue;
    const seg = n('span', { 'data-phase': s.id });
    seg.style.flexGrow = String(s.ms / (total || 1));
    seg.style.background = `var(--c-${s.id})`;
    fill.append(seg);
  }
  track.append(fill);
  return [n('span', { class: 'name' }, ...label), track, n('span', { class: 'val' }, ...value)];
}

function renderPhaseBars(v: View): void {
  phaseBars.replaceChildren();
  if (!v.picked.length) return;
  const items = v.picked
    .map((id) => ({ id, ms: v.totals.get(id) ?? 0 }))
    .sort((a, b) => b.ms - a.ms);
  const max = Math.max(1, ...items.map((i) => i.ms));
  for (const it of items) {
    const row = n('div', { class: 'brow' });
    row.append(
      ...barRow(
        [swatch(it.id), n('span', { class: 'label', text: LABEL.get(it.id) ?? it.id })],
        [{ id: it.id, ms: it.ms }],
        (it.ms / max) * 100,
        [
          n('b', { text: hours(it.ms) }),
          ' ',
          n('span', { class: 'muted', text: pct(v.pickedTotal ? it.ms / v.pickedTotal : 0) }),
        ],
      ),
    );
    phaseBars.append(row);
  }
}

function renderProjectBars(v: View): void {
  projectBars.replaceChildren();
  moreProjects.hidden = true;
  if (!v.picked.length) return;
  const groups = new Map<number, { ms: number[]; n: number }>();
  for (const r of v.inRange) {
    const g = groups.get(r.s.project) ?? { ms: PHASES.map(() => 0), n: 0 };
    r.s.ms.forEach((ms, i) => (g.ms[i] = (g.ms[i] ?? 0) + ms));
    g.n += 1;
    groups.set(r.s.project, g);
  }
  const list = [...groups]
    .map(([index, g]) => {
      const segments = v.picked.map((id) => ({ id, ms: g.ms[PHASE_INDEX.get(id) ?? 0] ?? 0 }));
      return { index, segments, n: g.n, total: segments.reduce((sum, s) => sum + s.ms, 0) };
    })
    .filter((g) => g.total > 0)
    .sort((a, b) => b.total - a.total);
  if (!list.length) {
    projectBars.append(n('p', { class: 'note', text: 'No time in these phases in this period.' }));
    return;
  }
  const max = Math.max(1, ...list.map((g) => g.total));
  projectBars.classList.toggle('picking', state.project >= 0);
  const shown = allProjects
    ? list
    : list.filter((g, i) => i < PROJECT_LIMIT || g.index === state.project);
  if (list.length > PROJECT_LIMIT) {
    moreProjects.hidden = false;
    moreProjects.textContent = allProjects ? 'Show the top 10' : `Show all ${list.length} projects`;
  }
  for (const g of shown) {
    const p = data.projects[g.index];
    const name = p?.name ?? 'unknown folder';
    const row = n('button', {
      class: 'brow prow',
      type: 'button',
      'aria-pressed': String(state.project === g.index),
      title: p?.path || undefined,
    });
    row.append(
      ...barRow(
        [n('span', { class: 'label', text: name })],
        g.segments,
        state.mode === 'share' ? 100 : (g.total / max) * 100,
        [
          n('b', { text: hours(g.total) }),
          ' ',
          n('span', { class: 'muted', text: plural(g.n, 'session') }),
        ],
      ),
    );
    row.addEventListener('click', () =>
      setState({ project: state.project === g.index ? -1 : g.index }),
    );
    row.addEventListener('pointermove', (event) => {
      const seg = (event.target as Element).closest<HTMLElement>('[data-phase]');
      const lines: Node[] = [tipHead(p?.path || name)];
      const list = seg
        ? g.segments.filter((s) => s.id === seg.dataset.phase)
        : g.segments.filter((s) => s.ms > 0);
      for (const s of list)
        lines.push(
          tipLine(s.id, LABEL.get(s.id) ?? s.id, `${hours(s.ms)} · ${pct(s.ms / g.total)}`),
        );
      lines.push(tipLine(null, plural(g.n, 'session'), hours(g.total), true));
      showTip(event, ...lines);
    });
    row.addEventListener('pointerleave', hideTip);
    projectBars.append(row);
  }
}

function renderTimeChart(v: View): void {
  timeChart.replaceChildren();
  if (!v.picked.length || !v.rows.length) return;
  const b = state.bucket;
  const cutoff =
    state.range === 'all'
      ? v.from
      : bucketStart(lastStart, 'day') - (Number(state.range) - 1) * DAY;
  const starts: number[] = [];
  for (let t = bucketStart(cutoff, b); t <= lastStart; t = nextBucket(t, b)) starts.push(t);
  const index = new Map(starts.map((t, i) => [t, i]));
  const sums = starts.map(() => ({ ms: v.picked.map(() => 0), n: 0 }));
  for (const r of v.rows) {
    const cell = sums[index.get(bucketStart(r.s.startMs, b)) ?? -1];
    if (!cell) continue;
    v.picked.forEach(
      (id, i) => (cell.ms[i] = (cell.ms[i] ?? 0) + (r.s.ms[PHASE_INDEX.get(id) ?? 0] ?? 0)),
    );
    cell.n += 1;
  }
  const totals = sums.map((c) => c.ms.reduce((a, x) => a + x, 0));
  const share = state.mode === 'share';
  const yTicks = share ? [0, 0.25, 0.5, 0.75, 1] : ticks(Math.max(...totals) / HOUR);
  const top = yTicks[yTicks.length - 1] ?? 1;
  const yLabel = (t: number) => (share ? pct(t) || '0%' : hours(t * HOUR));

  const yaxis = n('div', { class: 'yaxis', 'aria-hidden': 'true' });
  const plot = n('div', { class: 'plot' });
  for (const t of yTicks) {
    const at = `${(t / top) * 100}%`;
    const label = n('span', { text: t === 0 ? (share ? '0%' : '0') : yLabel(t) });
    label.style.bottom = at;
    yaxis.append(label);
    const line = n('i', { class: t === 0 ? 'base' : '' });
    line.style.bottom = at;
    plot.append(line);
  }
  const cols = n('div', { class: 'cols' });
  const xaxis = n('div', { class: 'xaxis', 'aria-hidden': 'true' });
  const fmt = (t: number) =>
    b === 'month' ? (MONTHS[new Date(t).getMonth()] ?? '') : shortDate(new Date(t));
  starts.forEach((t, i) => {
    const total = totals[i] ?? 0;
    const col = n('div', { class: 'col' });
    const bar = n('div', { class: 'bar' });
    bar.style.height = `${share ? (total > 0 ? 100 : 0) : (total / HOUR / top) * 100}%`;
    v.picked.forEach((id, k) => {
      const ms = sums[i]?.ms[k] ?? 0;
      if (ms <= 0) return;
      const seg = n('span');
      seg.style.flexGrow = String(ms / (total || 1));
      seg.style.background = `var(--c-${id})`;
      bar.append(seg);
    });
    col.append(bar);
    col.addEventListener('pointermove', (event) => {
      cols.classList.add('hovering');
      for (const c of cols.children) c.classList.toggle('on', c === col);
      const d = new Date(t);
      const head =
        b === 'day'
          ? `${DAYS[d.getDay()]} ${longDate(d)}`
          : b === 'week'
            ? `Week of ${longDate(d)}`
            : `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
      const lines: Node[] = [tipHead(head)];
      v.picked
        .map((id, k) => ({ id, ms: sums[i]?.ms[k] ?? 0 }))
        .filter((x) => x.ms > 0)
        .reverse()
        .forEach((x) =>
          lines.push(
            tipLine(x.id, LABEL.get(x.id) ?? x.id, share ? pct(x.ms / (total || 1)) : hours(x.ms)),
          ),
        );
      lines.push(tipLine(null, plural(sums[i]?.n ?? 0, 'session'), hours(total), true));
      showTip(event, ...lines);
    });
    col.addEventListener('pointerleave', () => {
      cols.classList.remove('hovering');
      for (const c of cols.children) c.classList.remove('on');
      hideTip();
    });
    cols.append(col);
    xaxis.append(n('span', { text: fmt(t) }));
  });
  plot.append(cols);
  timeChart.append(yaxis, plot, n('span'), xaxis);
  timeChart.setAttribute('role', 'img');
  timeChart.setAttribute(
    'aria-label',
    `Picked phases by ${b}, ${fmt(starts[0] ?? 0)} to ${fmt(starts[starts.length - 1] ?? 0)}. The table below lists every session.`,
  );
  // Label as many buckets as fit, evenly.
  const width = cols.clientWidth || 600;
  const every = Math.max(1, Math.ceil((starts.length * 52) / width));
  [...xaxis.children].forEach((el, i) => el.classList.toggle('hide', i % every !== 0));
}

function sortValue(r: Row, key: SortKey): number | string {
  switch (key) {
    case 'id':
      return r.s.id;
    case 'start':
      return r.s.startMs;
    case 'project':
      return data.projects[r.s.project]?.name ?? '';
    case 'picked':
      return r.picked;
    case 'top':
      return r.top ? (LABEL.get(r.top) ?? '') : '';
    case 'turns':
      return r.s.turnsMs;
    case 'tools':
      return r.s.toolCalls;
    case 'failures':
      return r.s.failures;
  }
}

function renderTable(v: View): void {
  const q = state.query.trim().toLowerCase();
  const rows = v.rows.filter(
    (r) =>
      !q ||
      [r.s.id, data.projects[r.s.project]?.name, r.s.folder, r.s.agentVersion]
        .join(' ')
        .toLowerCase()
        .includes(q),
  );
  const { key, dir } = state.sort;
  rows.sort((a, b) => {
    const x = sortValue(a, key);
    const y = sortValue(b, key);
    const c =
      typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
    return dir === 'asc' ? c : -c;
  });
  for (const h of heads) {
    h.th.setAttribute(
      'aria-sort',
      h.c.key === key ? (dir === 'asc' ? 'ascending' : 'descending') : 'none',
    );
  }
  const max = Math.max(1, ...rows.map((r) => r.picked));
  const frag = document.createDocumentFragment();
  for (const r of rows) {
    const d = new Date(r.s.startMs);
    const bar = n('span', { class: 'cellbar' });
    const fill = n('span');
    fill.style.width = `${(r.picked / max) * 100}%`;
    if (r.top) fill.style.background = `var(--c-${r.top})`;
    bar.append(fill);
    const copy = n('button', {
      class: 'id',
      type: 'button',
      title: `Copy ${r.s.id}`,
      text: r.s.id.slice(0, 8),
    });
    copy.addEventListener('click', () => {
      const done = () => {
        copy.textContent = 'Copied';
        window.setTimeout(() => (copy.textContent = r.s.id.slice(0, 8)), 1200);
      };
      navigator.clipboard
        ?.writeText(r.s.id)
        .then(done, () => window.getSelection()?.selectAllChildren(copy));
    });
    const p = data.projects[r.s.project];
    frag.append(
      n(
        'tr',
        {},
        n('td', {}, copy),
        n('td', { text: `${shortDate(d)}, ${clock(d)}`, title: longDate(d) }),
        n('td', { text: p?.name ?? '', title: r.s.folder || undefined }),
        n(
          'td',
          { class: 'n' },
          n('span', { class: 'cell' }, bar, n('span', { text: hours(r.picked) })),
        ),
        n(
          'td',
          {},
          r.top
            ? n(
                'span',
                { class: 'pill' },
                swatch(r.top),
                `${LABEL.get(r.top) ?? r.top} ${pct(r.picked ? (r.s.ms[PHASE_INDEX.get(r.top) ?? 0] ?? 0) / r.picked : 0)}`,
              )
            : '',
        ),
        n('td', { class: 'n wide', text: hours(r.s.turnsMs) }),
        n('td', { class: 'n wide', text: int(r.s.toolCalls) }),
        n('td', { class: 'n wide', text: int(r.s.failures) }),
      ),
    );
  }
  tbody.replaceChildren(frag);
  if (!rows.length)
    tbody.append(
      n(
        'tr',
        {},
        n('td', {
          colspan: COLUMNS.length,
          class: 'none',
          text: v.rows.length ? 'No session matches the search.' : 'No sessions in this view.',
        }),
      ),
    );
  shownCount.textContent = `${plural(rows.length, 'session')} shown`;
}

function render(): void {
  const v = view();
  renderHeader(v);
  renderFilters(v);
  renderPhaseBars(v);
  renderProjectBars(v);
  renderTimeChart(v);
  renderTable(v);
}

render();
let frame = 0;
let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => renderTimeChart(view()));
});
document.body.dataset.ready = '1';
