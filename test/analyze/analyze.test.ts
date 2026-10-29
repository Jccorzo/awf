import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectRework } from '../../src/analyze/rework';
import { analyze, formatSummaryLines, summarize } from '../../src/analyze/summary';
import { phaseTotals } from '../../src/analyze/timeline';
import type { ClassifiedSession, ClassifiedStep } from '../../src/classify/classify';
import { memoryFiles } from '../../src/classify/resolve';
import { importClaudeCodeTranscript } from '../../src/importers/claude-code/import';

function step(
  partial: Partial<ClassifiedStep> & Pick<ClassifiedStep, 'id' | 'kind' | 'startMs' | 'endMs'>,
): ClassifiedStep {
  return { parentId: null, flags: [], tags: [], checks: [], failed: false, ...partial };
}

function session(
  steps: ClassifiedStep[],
  startMs = 0,
  endMs = Math.max(...steps.map((s) => s.endMs)),
): ClassifiedSession {
  return { id: 's', agent: 'claude-code', sources: ['recorder'], startMs, endMs, steps };
}

const sum = (byPhase: Record<string, number>) => Object.values(byPhase).reduce((a, b) => a + b, 0);

describe('timeline', () => {
  it('gives each instant one phase, so phases add up to the total', () => {
    const totals = phaseTotals(
      session([
        step({ id: 'm', kind: 'model', startMs: 0, endMs: 10, phase: 'exploring' }),
        step({ id: 'r1', kind: 'tool', startMs: 10, endMs: 20, phase: 'exploring' }),
        step({ id: 't', kind: 'tool', startMs: 12, endMs: 40, phase: 'tests' }),
        step({ id: 'l', kind: 'tool', startMs: 15, endMs: 25, phase: 'lint' }),
      ]),
    );
    expect(totals.byPhase).toMatchObject({ exploring: 12, tests: 28, lint: 0 });
    expect(sum(totals.byPhase)).toBe(totals.totalMs);
  });

  it('puts foreground work above background work above idle time', () => {
    const totals = phaseTotals(
      session([
        step({ id: 'idle', kind: 'idle', startMs: 0, endMs: 100, phase: 'waiting' }),
        step({
          id: 'bg',
          kind: 'background',
          startMs: 10,
          endMs: 60,
          phase: 'build',
          flags: ['background'],
        }),
        step({ id: 'fg', kind: 'model', startMs: 20, endMs: 30, phase: 'planning' }),
      ]),
    );
    expect(totals.byPhase).toMatchObject({ waiting: 50, build: 40, planning: 10 });
  });

  it('treats steps inside a background subagent as background', () => {
    const totals = phaseTotals(
      session([
        step({ id: 'agent:x', kind: 'subagent', startMs: 0, endMs: 50, flags: ['background'] }),
        step({
          id: 'g',
          kind: 'tool',
          parentId: 'agent:x',
          startMs: 0,
          endMs: 50,
          phase: 'exploring',
        }),
        step({ id: 'm', kind: 'model', startMs: 10, endMs: 20, phase: 'planning' }),
      ]),
    );
    expect(totals.byPhase).toMatchObject({ exploring: 40, planning: 10 });
  });

  it('splits an approval wait from the run, and counts uncovered time as unclassified', () => {
    const totals = phaseTotals(
      session(
        [
          step({
            id: 't',
            kind: 'tool',
            startMs: 0,
            endMs: 100,
            phase: 'tests',
            waitMs: 70,
            flags: ['approval'],
          }),
        ],
        0,
        120,
      ),
    );
    expect(totals.byPhase).toMatchObject({ waiting: 70, tests: 30, unclassified: 20 });
    expect(totals.uncoveredMs).toBe(20);
  });
});

describe('rework', () => {
  const check = (key: string, failed: boolean) => ({
    key,
    phase: 'tests' as const,
    tool: key.split(':')[1] ?? '',
    failed,
  });

  it('counts edits between a failed check and the same check passing', () => {
    const { session: s, windows } = detectRework(
      session([
        step({
          id: 't1',
          kind: 'tool',
          startMs: 0,
          endMs: 10,
          phase: 'tests',
          checks: [check('tests:vitest', true)],
          failed: true,
        }),
        step({
          id: 'm1',
          kind: 'model',
          startMs: 10,
          endMs: 20,
          phase: 'writing-code',
          produces: ['e1'],
        }),
        step({ id: 'e1', kind: 'tool', startMs: 20, endMs: 21, phase: 'writing-code' }),
        step({ id: 'e2', kind: 'tool', startMs: 22, endMs: 23, phase: 'writing-tests' }),
        step({
          id: 't2',
          kind: 'tool',
          startMs: 30,
          endMs: 40,
          phase: 'tests',
          checks: [check('tests:vitest', false)],
        }),
        step({ id: 'e3', kind: 'tool', startMs: 50, endMs: 51, phase: 'writing-code' }),
      ]),
    );
    const phase = (id: string) => s.steps.find((x) => x.id === id)?.phase;
    expect(['m1', 'e1', 'e2', 'e3'].map(phase)).toEqual([
      'rework',
      'rework',
      'rework',
      'writing-code',
    ]);
    expect(s.steps.find((x) => x.id === 'e1')).toMatchObject({
      reworkFor: 'tests:vitest',
      tags: ['was:writing-code'],
    });
    expect(windows).toEqual([
      { check: 'tests:vitest', failedStepId: 't1', failedAtMs: 10, passedAtMs: 40, edits: 2 },
    ]);
  });

  it('keeps the window open while the check keeps failing, and until the session ends', () => {
    const { windows } = detectRework(
      session([
        step({
          id: 't1',
          kind: 'tool',
          startMs: 0,
          endMs: 10,
          phase: 'lint',
          checks: [{ ...check('lint:eslint', true), phase: 'lint' }],
        }),
        step({ id: 'e1', kind: 'tool', startMs: 11, endMs: 12, phase: 'writing-code' }),
        step({
          id: 't2',
          kind: 'tool',
          startMs: 13,
          endMs: 20,
          phase: 'lint',
          checks: [{ ...check('lint:eslint', true), phase: 'lint' }],
        }),
        step({ id: 'e2', kind: 'tool', startMs: 21, endMs: 22, phase: 'writing-code' }),
        step({
          id: 'other',
          kind: 'tool',
          startMs: 23,
          endMs: 30,
          phase: 'tests',
          checks: [check('tests:jest', false)],
        }),
        step({ id: 'e3', kind: 'tool', startMs: 31, endMs: 32, phase: 'writing-code' }),
      ]),
    );
    expect(windows).toEqual([
      { check: 'lint:eslint', failedStepId: 't1', failedAtMs: 10, edits: 3 },
    ]);
  });

  it("doesn't let an interrupted run close the window", () => {
    const { windows } = detectRework(
      session([
        step({
          id: 't1',
          kind: 'tool',
          startMs: 0,
          endMs: 10,
          phase: 'tests',
          checks: [check('tests:vitest', true)],
        }),
        step({
          id: 't2',
          kind: 'tool',
          startMs: 11,
          endMs: 12,
          phase: 'tests',
          checks: [check('tests:vitest', false)],
          flags: ['interrupted'],
        }),
        step({ id: 'e1', kind: 'tool', startMs: 13, endMs: 14, phase: 'writing-code' }),
      ]),
    );
    expect(windows[0]).toMatchObject({ edits: 1 });
    expect(windows[0]?.passedAtMs).toBeUndefined();
  });
});

describe('summary', () => {
  it('formats one line per phase like the plan: "Build 6m 10s · 28% · 3 runs, 2 failed"', () => {
    const steps: ClassifiedStep[] = [];
    let t = 0;
    for (const [phase, ms, failed] of [
      ['build', 120_000, true],
      ['build', 125_000, true],
      ['build', 125_000, false],
    ] as const) {
      steps.push(
        step({
          id: `b${t}`,
          kind: 'tool',
          startMs: t,
          endMs: t + ms,
          phase,
          checks: [{ key: 'build:gradle', phase, tool: 'gradle', failed }],
        }),
      );
      t += ms;
    }
    steps.push(step({ id: 'm', kind: 'model', startMs: t, endMs: t + 950_000, phase: 'planning' }));
    const { summary } = summarize(session(steps));
    const lines = formatSummaryLines(summary);
    expect(lines).toContain('Build                    6m 10s ·  28% · 3 runs, 2 failed');
    expect(lines.some((l) => l.startsWith('Rework'))).toBe(true);
    expect(lines.some((l) => l.startsWith('Waiting on you'))).toBe(true);
    expect(lines.at(-1)).toMatch(
      /^Total\s+22m 00s · 100% · 1 model call, 3 tool calls, 2 failures$/,
    );
  });

  it('adds up to the total on every fixture', () => {
    const root = path.resolve(__dirname, '../../fixtures/claude-code');
    for (const name of readdirSync(root)) {
      const main = readdirSync(path.join(root, name)).find((f) => f.endsWith('.jsonl')) as string;
      const { summary } = analyze(importClaudeCodeTranscript(path.join(root, name, main)), {
        files: memoryFiles({}),
      });
      expect(
        summary.phases.reduce((n, p) => n + p.ms, 0),
        name,
      ).toBe(summary.totalMs);
      expect(summary.totalMs).toBe(summary.endMs - summary.startMs);
    }
  });

  it('finds the rework in the recorded test-fix session', () => {
    const file = path.resolve(
      __dirname,
      '../../fixtures/claude-code/cc-2.1.312-test-fix/4045beec-4abe-4901-822b-0e34d3c9fa14.jsonl',
    );
    const { summary } = analyze(importClaudeCodeTranscript(file), { files: memoryFiles({}) });
    const line = (phase: string) => summary.phases.find((p) => p.phase === phase);
    expect(line('tests')).toMatchObject({ runs: 2, failed: 1 });
    expect(line('rework')).toMatchObject({ edits: 1, failures: 1 });
    expect(summary.rework[0]).toMatchObject({ check: 'tests:npm test', edits: 1 });
    expect(summary.rework[0]?.passedAtMs).toBeDefined();
  });
});
