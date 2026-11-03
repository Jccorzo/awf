// The pane beside the chat: the session's phase split, from `awf summary`. This runs inside Claude
// Code, with no Node: `$` reaches everything outside it. See CONTRIBUTING.md, "Changing the pane".
import { atom, read, update } from 'claude-code';
import type { EngineInterface, Register, Timer } from 'claude-code';

import type { PanelView, PhaseRow, Stats } from '../types';

const PANE = 'awf';
const COMMAND = 'awf-panel';
/** How often the pane catches up during a turn. */
const EVERY_MS = 10_000;

// Change the tag when the view's fields change: it declines what an earlier version stored, which
// outlives a reload.
const view = atom({ plugin: 'awf', key: 'view' } as const, {}, { shape: 'view-1' });

/** The report's phase colors (src/report/client/styles.css), at values that read in both themes. */
const COLORS: Record<string, string> = {
  'writing-code': '#3987e5',
  'writing-tests': '#e5622e',
  lint: '#199e70',
  tests: '#d99200',
  build: '#e0668f',
  rework: '#7a6ae0',
  exploring: '#008300',
  running: '#2f9fb8',
  planning: '#8a93a3',
  waiting: '#a9a8a0',
  unclassified: '#8a8982',
};

const pad = (n: number) => String(n).padStart(2, '0');

/** As `formatDuration` in src/model/time.ts: 933 ms, 2.7s, 1m 35s, 1h 24m 23s. */
function duration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)}s`;
  const total = Math.round(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

function amount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function clock(ms: number): string {
  const at = new Date(ms);
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

type Summary = {
  totalMs: number;
  toolCalls: number;
  modelCalls: number;
  failures: number;
  tokens?: { input: number; output: number; cacheRead: number; cacheWrite: number };
  phases: PhaseRow[];
};

function toStats(summary: Summary, atMs: number): Stats {
  const { input = 0, output = 0, cacheRead = 0, cacheWrite = 0 } = summary.tokens ?? {};
  return {
    totalMs: summary.totalMs,
    toolCalls: summary.toolCalls,
    modelCalls: summary.modelCalls,
    failures: summary.failures,
    tokensIn: input + cacheRead + cacheWrite,
    tokensOut: output,
    phases: summary.phases.map(({ phase, label, ms, share }) => ({ phase, label, ms, share })),
    atMs,
  };
}

async function readStats($: EngineInterface): Promise<PanelView> {
  try {
    const script = `${$.plugin.root}/scripts/awf.mjs`;
    const id = await $.session.id();
    const { exitCode, stdout, stderr } = await $.process.run([
      'node',
      script,
      'summary',
      id,
      '--json',
    ]);
    if (exitCode !== 0) return { error: stderr.split('\n')[0] || `awf exited ${exitCode}` };
    return { stats: toStats(JSON.parse(stdout) as Summary, await $.clock.now()) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/** A failed read keeps the last stats on screen, and says so. A lost write waits for the next. */
async function refresh($: EngineInterface): Promise<void> {
  const latest = await readStats($);
  await update($, view, (old) => (latest.stats ? latest : { ...old, ...latest })).catch(
    () => undefined,
  );
}

/** Runs awf only for a pane on screen: not for `claude -p`, or a terminal that didn't ask for it. */
async function catchUp($: EngineInterface): Promise<void> {
  const panes = await $.ui.panes();
  if (panes.some((pane) => pane.id === PANE && pane.isPlaced)) await refresh($);
}

export const register: Register = (on) => {
  let ticking: Timer | undefined;

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: "Show where this session's time went in a pane",
    });
    // A terminal has the status line and asks with the command. The desktop app attaches after this
    // hook, so there `e.surface` can still be null, and the pane waits for it.
    if (e.surface !== 'terminal') void $.ui.open({ id: PANE, title: 'awf' });

    return next(e);
  });

  on('command.run', { command: COMMAND }, async ($) => {
    const opened = await $.ui.open({ id: PANE, title: 'awf' });
    await refresh($);

    return {
      text: opened.isPlaced ? 'awf pane opened.' : `awf pane not shown: ${opened.reason}`,
    };
  });

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      ticking?.cancel();
      ticking = $.clock.every(EVERY_MS, () => void catchUp($));
    }

    return next(e);
  });

  on('turn.complete', async ($, e, next) => {
    const done = await next(e);
    if (e.agentId === undefined) {
      ticking?.cancel();
      ticking = undefined;
      await catchUp($);
    }

    return done;
  });

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e);
    const { stats, error } = await read($, view);
    if (!stats) {
      if (!error) void refresh($);
      return <Text dimColor>{error ?? 'Reading this session…'}</Text>;
    }
    const shown = stats.phases.filter((phase) => phase.ms > 0).sort((a, b) => b.ms - a.ms);
    const checks = stats.failures > 0 ? ` · ${plural(stats.failures, 'failed check')}` : '';

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text size="title" weight="semibold" tabular>
            {duration(stats.totalMs)}
          </Text>
          <Text size="footnote" dimColor>
            {plural(stats.toolCalls, 'tool call')} · {plural(stats.modelCalls, 'model call')}
            {checks}
          </Text>
        </Box>
        <Box flexDirection="row" height={1} width="100%">
          {shown.map((phase) => (
            <Box
              key={phase.phase}
              flexGrow={Math.max(1, Math.round(phase.share * 1000))}
              backgroundColor={COLORS[phase.phase]}
            />
          ))}
        </Box>
        <Box flexDirection="column">
          {shown.map((phase) => (
            <Box key={phase.phase} flexDirection="row" justifyContent="space-between">
              <Box flexDirection="row" gap={1}>
                <Text color={COLORS[phase.phase]}>■</Text>
                <Text>{phase.label}</Text>
              </Box>
              <Text dimColor tabular>
                {duration(phase.ms)} · {Math.round(phase.share * 100)}%
              </Text>
            </Box>
          ))}
        </Box>
        <Text size="caption" dimColor>
          {amount(stats.tokensIn)} tokens in · {amount(stats.tokensOut)} out · updated{' '}
          {clock(stats.atMs)}
        </Text>
        {error && (
          <Text size="caption" color="error">
            {error}
          </Text>
        )}
      </Box>
    );
  });
};
