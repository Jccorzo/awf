import { describe, expect, it } from 'vitest';
import { Classifier, classifySession } from '../../src/classify/classify';
import { memoryFiles } from '../../src/classify/resolve';
import { compileRules, defaultRules, loadRules } from '../../src/classify/rules';
import type { Session, Step } from '../../src/model/types';

let n = 0;
function step(partial: Partial<Step> & Pick<Step, 'kind'>): Step {
  n++;
  return {
    id: partial.id ?? `s${n}`,
    parentId: null,
    startMs: n * 10,
    endMs: n * 10 + 5,
    flags: [],
    ...partial,
  };
}

function session(steps: Step[], cwd = '/repo'): Session {
  return {
    id: 'x',
    agent: 'claude-code',
    sources: ['transcript'],
    cwd,
    startMs: 0,
    endMs: 10_000,
    steps,
  };
}

const files = memoryFiles({
  '/repo/package.json': JSON.stringify({
    scripts: { test: 'vitest run', check: 'tsc --noEmit && vitest run' },
  }),
});
const classify = (s: Session) => new Classifier(defaultRules(), files).session(s);

describe('failure detection', () => {
  it('fails a check on its exit code', () => {
    const [run] = classify(
      session([step({ kind: 'tool', tool: 'Bash', command: 'pnpm test', ok: false, exitCode: 1 })]),
    ).steps;
    expect(run).toMatchObject({ phase: 'tests', failed: true });
    expect(run?.checks).toEqual([
      { key: 'tests:vitest', phase: 'tests', tool: 'vitest', failed: true },
    ]);
  });

  it('catches a failure a pipe hid, from the output', () => {
    const output =
      ' FAIL  src/a.test.ts > adds\n Test Files  1 failed | 3 passed (4)\n      Tests  1 failed | 20 passed (21)';
    const [run] = classify(
      session([
        step({
          kind: 'tool',
          tool: 'Bash',
          command: 'pnpm test 2>&1 | tail -20',
          ok: true,
          detail: { output },
        }),
      ]),
    ).steps;
    expect(run?.failed).toBe(true);
  });

  it('names the check that failed in a compound command from its own pattern', () => {
    const output = "src/a.ts(3,7): error TS2322: Type 'string' is not assignable to type 'number'.";
    const [run] = classify(
      session([
        step({ kind: 'tool', tool: 'Bash', command: 'pnpm check', ok: false, detail: { output } }),
      ]),
    ).steps;
    expect(run?.checks).toEqual([
      { key: 'lint:tsc --noEmit', phase: 'lint', tool: 'tsc --noEmit', failed: true },
      { key: 'tests:vitest', phase: 'tests', tool: 'vitest', failed: false },
    ]);
  });

  it('marks the highest-ranked check when nothing says which failed', () => {
    const [run] = classify(
      session([step({ kind: 'tool', tool: 'Bash', command: 'pnpm check', ok: false })]),
    ).steps;
    expect(run?.checks.map((c) => c.failed)).toEqual([false, true]);
    expect(run?.tags).toContain('failure-unattributed');
  });

  it("doesn't count an interrupted or denied run as a failure", () => {
    const steps = classify(
      session([
        step({
          kind: 'tool',
          tool: 'Bash',
          command: 'pnpm test',
          ok: false,
          flags: ['interrupted'],
        }),
        step({ kind: 'tool', tool: 'Bash', command: 'pnpm test', ok: false, flags: ['denied'] }),
      ]),
    ).steps;
    expect(steps.map((s) => s.failed)).toEqual([false, false]);
  });

  it('leaves passing runs alone, and ignores failures of steps that are not checks', () => {
    const steps = classify(
      session([
        step({
          kind: 'tool',
          tool: 'Bash',
          command: 'pnpm test',
          ok: true,
          detail: { output: 'Tests  21 passed (21)' },
        }),
        step({ kind: 'tool', tool: 'Bash', command: 'cat missing.txt', ok: false }),
      ]),
    ).steps;
    expect(steps.map((s) => s.failed)).toEqual([false, false]);
  });
});

describe('model time and other steps', () => {
  it('gives model time the phase of the call it produced, the top one for a batch', () => {
    const edit = step({ id: 'e', kind: 'tool', tool: 'Edit', files: ['/repo/src/a.ts'] });
    const read = step({ id: 'r', kind: 'tool', tool: 'Read', files: ['/repo/src/b.ts'] });
    const test = step({ id: 't', kind: 'tool', tool: 'Bash', command: 'pnpm test' });
    const ask = step({ id: 'q', kind: 'tool', tool: 'AskUserQuestion' });
    const agent = step({ id: 'a', kind: 'tool', tool: 'Agent' });
    const steps = classify(
      session([
        step({ id: 'm1', kind: 'model', produces: ['r', 'e'] }),
        read,
        edit,
        step({ id: 'm2', kind: 'model', produces: ['t'] }),
        test,
        step({ id: 'm3', kind: 'model', produces: ['q'] }),
        ask,
        step({ id: 'm4', kind: 'model', produces: ['a'] }),
        agent,
        step({ id: 'm5', kind: 'model', flags: ['answer'] }),
      ]),
    ).steps;
    const phase = (id: string) => steps.find((s) => s.id === id)?.phase;
    expect(['m1', 'm2', 'm3', 'm4', 'm5'].map(phase)).toEqual([
      'writing-code',
      'tests',
      'planning',
      'planning',
      'planning',
    ]);
    expect(phase('q')).toBe('waiting');
  });

  it('treats an Agent call with a subagent as a container, and one without as unclassified', () => {
    const steps = classify(
      session([
        step({ id: 'a1', kind: 'tool', tool: 'Agent' }),
        step({ id: 'agent:x', kind: 'subagent', parentId: 'a1', agentId: 'x' }),
        step({ id: 'a2', kind: 'tool', tool: 'Agent' }),
      ]),
    ).steps;
    expect(steps.map((s) => s.phase)).toEqual([undefined, undefined, 'unclassified']);
  });

  it('classifies idle time, compactions and background shells', () => {
    const steps = classify(
      session([
        step({ kind: 'idle' }),
        step({ kind: 'compact' }),
        step({
          id: 'b',
          kind: 'tool',
          tool: 'Bash',
          command: 'go build ./...',
          flags: ['background'],
          backgroundId: 'bg1',
        }),
        step({
          kind: 'background',
          parentId: 'b',
          command: 'go build ./...',
          backgroundId: 'bg1',
          ok: false,
        }),
        step({ kind: 'tool', tool: 'TaskOutput', backgroundId: 'bg1' }),
      ]),
    ).steps;
    expect(steps.map((s) => s.phase)).toEqual([
      'waiting',
      'unclassified',
      'build',
      'build',
      'build',
    ]);
    expect(steps[1]?.tags).toEqual(['compaction']);
    expect(steps[3]?.failed).toBe(true);
  });

  it('keeps cd between shell calls, until it leaves the project', () => {
    const c = new Classifier(
      defaultRules(),
      memoryFiles({
        '/repo/package.json': JSON.stringify({ scripts: { test: 'vitest' } }),
        '/repo/web/package.json': JSON.stringify({ scripts: { test: 'jest' } }),
      }),
    );
    const steps = c.session(
      session([
        step({ kind: 'tool', tool: 'Bash', command: 'cd web' }),
        step({ kind: 'tool', tool: 'Bash', command: 'pnpm test' }),
        step({ kind: 'tool', tool: 'Bash', command: 'cd /tmp' }),
        step({ kind: 'tool', tool: 'Bash', command: 'pnpm test' }),
      ]),
    ).steps;
    expect(steps[1]?.checks[0]?.tool).toBe('jest');
    expect(steps[3]?.checks[0]?.tool).toBe('vitest');
  });
});

describe('rules files', () => {
  it("extends the defaults with a repo's .awf/rules.yaml, which wins", () => {
    const repo = memoryFiles({
      '/w/.awf/rules.yaml': [
        'commands:',
        '  - { phase: tests, program: ./run-e2e }',
        '  - { phase: build, match: "^bazel run //tools:gen" }',
        '  - { phase: lint, program: eslint, with: [--fix] }',
        'testFiles: ["**/qa/**"]',
      ].join('\n'),
    });
    const rules = loadRules('/w/src', repo);
    expect(rules.sources[0]).toBe('/w/.awf/rules.yaml');
    const result = classifySession(
      session(
        [
          step({ kind: 'tool', tool: 'Bash', command: 'bazel run //tools:gen -- all' }),
          step({ kind: 'tool', tool: 'Edit', files: ['/w/qa/flows.ts'] }),
        ],
        '/w',
      ),
      { files: repo, rules },
    );
    expect(result.steps.map((s) => s.phase)).toEqual(['build', 'writing-tests']);
  });

  it('reports a bad rule with its location', () => {
    expect(() =>
      compileRules([{ text: 'commands:\n  - { phase: testing, program: x }', source: 'my.yaml' }]),
    ).toThrow(/my\.yaml commands\[0\]: unknown phase "testing"/);
    expect(() =>
      compileRules([{ text: 'commands:\n  - { phase: lint, match: "(" }', source: 'my.yaml' }]),
    ).toThrow(/bad regex/);
  });
});
