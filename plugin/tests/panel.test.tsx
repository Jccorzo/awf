// Runs under `claude plugin test plugin`, not Vitest: see CONTRIBUTING.md, "Changing the pane".
import type { On } from 'claude-code';
import { expect, test } from 'claude-code/testing';

const RUN = {
  command: 'awf-panel',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 80 },
} as const;

const PANE = {
  plugin: 'awf',
  component: 'Pane',
  requestId: 'awf',
  props: {
    title: 'awf',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const;

const SUMMARY = {
  totalMs: 125_000,
  toolCalls: 12,
  modelCalls: 1,
  failures: 2,
  tokens: { input: 100, output: 2500, cacheRead: 1_400_000, cacheWrite: 99_900 },
  phases: [
    { phase: 'planning', label: 'Planning and answering', ms: 25_000, share: 0.2 },
    { phase: 'exploring', label: 'Exploring', ms: 100_000, share: 0.8, calls: 9 },
    { phase: 'lint', label: 'Lint and format', ms: 0, share: 0 },
  ],
};

const SHOWN = { id: 'awf', title: 'awf', isShown: true, isFocused: false, isPlaced: true };

const ran = (stdout: string, exitCode = 0, stderr = '') => ({
  value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false },
});

/** Stands for the engine; returns the commands the pane ran and the panes it opened. */
function engine(
  on: On,
  answer: () => unknown = () => ran(JSON.stringify(SUMMARY)),
  panes: () => unknown = () => [SHOWN],
) {
  const runs: Array<readonly string[]> = [];
  const opened: string[] = [];
  on('command.register', () => ({ value: { command: 'awf-panel' } }));
  on('ui.open', (_, e) => {
    opened.push(e.id);
    return { value: { isPlaced: true } };
  });
  on('ui.panes', () => ({ value: panes() as never }));
  on('session.start', (_, e) => ({ cwd: e.cwd }));
  on('session.id', () => ({ value: 'session-id' }));
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 2, 21) }));
  on('process.run', (_, e) => {
    runs.push(e.argv);
    return answer() as never;
  });
  return { runs, opened };
}

test('shows the time per phase, largest first, on every surface', async ($, on) => {
  engine(on);
  await $.command.run(RUN);

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface });

    expect((await ui.find({ type: 'Text', text: /^2m 05s$/ }))?.text).toBe('2m 05s');
    expect((await ui.find({ type: 'Text', text: /Exploring/ }))?.text).toBe('Exploring');
    expect((await ui.find({ type: 'Text', text: /1m 40s/ }))?.text).toBe('1m 40s · 80%');
    expect((await ui.find({ type: 'Text', text: /tool calls/ }))?.text).toBe(
      '12 tool calls · 1 model call · 2 failed checks',
    );
    expect((await ui.find({ type: 'Text', text: /tokens in/ }))?.text).toMatch(
      /^1\.5M tokens in · 3k out · updated \d\d:\d\d$/,
    );
    expect(await ui.find({ type: 'Text', text: /Lint/ })).toBeUndefined();
    await ui.unmount();
  }
});

test('runs the awf next to it, for this session', async ($, on) => {
  const { runs } = engine(on);
  await $.command.run(RUN);

  const [program, script, ...args] = runs[0] ?? [];
  expect(program).toBe('node');
  expect(script?.endsWith('/plugin/scripts/awf.mjs')).toBe(true);
  expect(args).toEqual(['summary', 'session-id', '--json']);
});

test('opens by itself in the desktop app, not in a terminal', async ($, on) => {
  const { opened } = engine(on);

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true });
  expect(opened).toEqual([]);

  await $.session.start({ cwd: '/', surface: null, isInteractive: false });
  expect(opened).toEqual(['awf']);
});

test('runs awf only while a surface shows the pane', async ($, on) => {
  let panes: unknown[] = [];
  const { runs } = engine(on, undefined, () => panes);
  on('turn.complete', () => ({ text: '' }));
  const turn = { answer: 'ok', durationMs: 1, isAborted: false, turnId: 't', reason: 'answer' };

  await $.turn.complete(turn as never);
  expect(runs).toHaveLength(0);

  panes = [SHOWN];
  await $.turn.complete(turn as never);
  expect(runs).toHaveLength(1);
});

test('says why when a read fails with nothing to show', async ($, on) => {
  engine(on, () => ran('', 1, 'awf summary: no session "session-id"\nmore'));
  await $.command.run(RUN);

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' });

  expect((await ui.find({ type: 'Text' }))?.text).toBe('awf summary: no session "session-id"');
  await ui.unmount();
});

test('keeps the last stats when a read fails', async ($, on) => {
  let answer = ran(JSON.stringify(SUMMARY));
  engine(on, () => answer);
  await $.command.run(RUN);

  answer = ran('', 1, 'awf summary: gone');
  await $.command.run(RUN);

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' });

  expect((await ui.find({ type: 'Text', text: /^2m 05s$/ }))?.text).toBe('2m 05s');
  expect((await ui.find({ type: 'Text', text: /gone/ }))?.text).toBe('awf summary: gone');
  await ui.unmount();
});

test('declines a value an earlier version stored', async ($, on) => {
  engine(on);
  on('state.get', () => ({ value: { value: { stats: { totalMs: 1 } }, version: 1 } }));

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' });

  expect((await ui.find({ type: 'Text' }))?.text).toBe('Reading this session…');
  await ui.unmount();
});
