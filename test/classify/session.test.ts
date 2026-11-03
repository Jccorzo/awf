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

describe('failure detection: whose exit code is it', () => {
  const bash = (command: string, ok: boolean | undefined, output?: string) =>
    step({
      kind: 'tool',
      tool: 'Bash',
      command,
      ...(ok !== undefined ? { ok } : {}),
      ...(output ? { detail: { output } } : {}),
    });

  it("reads the exit code as the checks' own only when nothing after them can change it", () => {
    const c = new Classifier(defaultRules(), files);
    expect(c.command('pnpm test', '/repo').exit).toBe('full');
    expect(c.command('cd web && pnpm test', '/repo').exit).toBe('full');
    expect(c.command('pnpm lint && pnpm test', '/repo').exit).toBe('full');
    expect(c.command('pnpm test && git add -A && git commit -m x', '/repo').exit).toBe('pass');
    expect(c.command('pnpm test 2>&1 | tail -20', '/repo').exit).toBe('none');
    expect(c.command('pnpm test || true', '/repo').exit).toBe('none');
    expect(c.command('pnpm test; echo done', '/repo').exit).toBe('none');
    expect(c.command('pnpm test &', '/repo').exit).toBe('none');
    expect(c.command('(cd web && pnpm test) && git status', '/repo').exit).toBe('pass');
    expect(c.command('bash -c "pytest | tail -5"', '/repo').exit).toBe('none');
    expect(c.command('OUT=$(pnpm test 2>&1); echo "$OUT" | tail', '/repo').exit).toBe('none');
    expect(c.command('ls src', '/repo').exit).toBeUndefined();
  });

  it("doesn't let a pattern in passing output override exit 0", () => {
    const steps = classify(
      session([
        bash('npx eslint src', true, '✖ 1 problem (0 errors, 1 warning)'),
        bash(
          'pnpm test',
          true,
          ' ✓ marks job as FAILED when retries run out\n Tests  3 passed (3)',
        ),
      ]),
    ).steps;
    expect(steps.map((s) => s.failed)).toEqual([false, false]);
  });

  it('clears a check when a command after it failed and its output shows no failure', () => {
    const output =
      ' Test Files  4 passed (4)\n      Tests  21 passed (21)\nnothing to commit, working tree clean';
    const [withOutput, without] = classify(
      session([
        bash('pnpm test && git add -A && git commit -m x', false, output),
        bash('pnpm test && git add -A && git commit -m x', false),
      ]),
    ).steps;
    expect(withOutput?.failed).toBe(false);
    // Without output it may have been the tests: blamed, and marked unsure.
    expect(without?.failed).toBe(true);
    expect(without?.tags).toContain('failure-unattributed');
  });

  it('uses failure patterns that only match real failures', () => {
    const steps = classify(
      session([
        bash('ruff check --fix . | tail -3', true, 'Found 3 errors (3 fixed, 0 remaining).'),
        bash(
          'npx playwright test | tail',
          true,
          '  2 passed (3.1s)\n  1 failed\n    [chromium] › a.spec.ts:3:1 › x',
        ),
        bash(
          'cargo build 2>&1 | tail',
          true,
          'warning: unused\n3 |     let error: Option<String> = None;\n',
        ),
        bash('make test | tail', true, 'make: *** [Makefile:4: test] Error 1'),
      ]),
    ).steps;
    expect(steps.map((s) => s.failed)).toEqual([false, true, false, true]);
  });

  it('reads Dart and Flutter failures a pipe hid, and only real ones', () => {
    const cases: Array<[string, string, boolean]> = [
      ['flutter test 2>&1 | tail -5', '00:04 +12 -1: Some tests failed.', true],
      ['flutter test | tail', '00:04 +13: All tests passed!', false],
      // A passing test whose name says so: no -N failure count before it.
      [
        'dart test | tail',
        '00:01 +1: prints Some tests failed. when one fails\n00:01 +2: All tests passed!',
        false,
      ],
      [
        'flutter analyze | tail',
        "  error • Undefined name 'x' • lib/main.dart:3:5 • undefined_identifier\n\n1 issue found. (ran in 1.9s)",
        true,
      ],
      [
        'dart analyze | tail',
        '  info - lib/a.dart:1:7 - Use const. - prefer_const_constructors\n\n1 issue found.',
        false,
      ],
      [
        'dart analyze lib | tail',
        "  warning - lib/a.dart:2:3 - Unused import: 'x'. - unused_import\n\n1 issue found.",
        true,
      ],
      [
        'flutter build apk 2>&1 | tail',
        "lib/main.dart:7:3: Error: Undefined name 'foo'.\nGradle task assembleRelease failed with exit code 1",
        true,
      ],
      [
        'flutter build ios --no-codesign | tail',
        "Warning (Xcode): Run script build phase 'x' will be run during every build\n✓ Built build/ios/iphoneos/Runner.app (21.4MB)",
        false,
      ],
      [
        'dart run build_runner build 2>&1 | tail',
        '[SEVERE] mockito:mockBuilder on test/a_test.dart:\nInvalid @GenerateMocks annotation',
        true,
      ],
      ['very_good test | tail', '00:09 +12 -1: Some tests failed.', true],
      ['patrol test | tail', '📝 Total: 3\n✅ Successful: 2\n❌ Failed: 1', true],
      ['patrol test | tail', '📝 Total: 3\n✅ Successful: 3\n❌ Failed: 0', false],
      [
        'flutter drive --target=integration_test/app_test.dart | tail',
        'Failure Details:\n...',
        true,
      ],
      // melos exec puts the package before each line; the bullet depends on the terminal.
      [
        'melos exec -- dart analyze . | tail',
        "[app]:   error • Undefined name 'x' • lib/main.dart:3:5 • undefined_identifier",
        true,
      ],
      [
        'dart compile js web/main.dart | tail',
        "web/main.dart:3:3:\nError: Method not found: 'foo'.\nError: Compilation failed.",
        true,
      ],
      [
        'dart compile exe bin/main.dart | tail',
        "bin/main.dart:3:3: Error: Method not found: 'run'.\nError: AOT compilation failed",
        true,
      ],
    ];
    const steps = classify(
      session(cases.map(([command, output]) => bash(command, true, output))),
    ).steps;
    expect(steps.map((s) => s.failed)).toEqual(cases.map(([, , failed]) => failed));
  });

  it('reads a failure that `|| true` hid from the output', () => {
    const [run] = classify(
      session([bash('pnpm test || true', true, ' Tests  1 failed | 20 passed (21)')]),
    ).steps;
    expect(run?.failed).toBe(true);
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

  it("classifies a Monitor's task by its command, and a read of its output takes that phase", () => {
    const command = 'until gh run view 42 --json status | grep -q completed; do sleep 30; done';
    const steps = classify(
      session([
        step({ id: 'mon', kind: 'tool', tool: 'Monitor', command, backgroundId: 'b1' }),
        step({ kind: 'background', tool: 'Monitor', parentId: 'mon', command, backgroundId: 'b1' }),
        step({ kind: 'tool', tool: 'TaskOutput', backgroundId: 'b1' }),
        step({
          id: 'tail',
          kind: 'tool',
          tool: 'Monitor',
          command: 'tail -F a.log',
          backgroundId: 'b2',
        }),
        step({
          kind: 'background',
          tool: 'Monitor',
          parentId: 'tail',
          command: 'tail -F a.log',
          backgroundId: 'b2',
        }),
        step({ kind: 'tool', tool: 'TaskStop', backgroundId: 'b2' }),
      ]),
    ).steps;
    expect(steps.map((s) => [s.phase, s.tags.includes('polling')])).toEqual([
      ['running', false],
      ['running', true],
      ['running', false],
      ['running', false],
      ['exploring', false],
      ['exploring', false],
    ]);
  });

  it("counts a compaction while you're away as waiting on you", () => {
    const steps = classify(session([step({ kind: 'compact', flags: ['background'] })])).steps;
    expect(steps[0]).toMatchObject({ phase: 'waiting', tags: ['compaction'] });
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

  it('classifies a command by the rules of the repo it runs in, not only the session’s', () => {
    // A session started in one folder runs another repo's script (subagents in worktrees do).
    const repos = memoryFiles({
      '/ios/scripts/test.sh':
        '#!/bin/bash\nxcodebuild build-for-testing -scheme App\nxcodebuild test-without-building -scheme App\n',
      '/ios/.awf/rules.yaml': [
        'commands:',
        '  - { phase: build, program: test.sh, with: [--build] }',
        '  - { phase: tests, program: test.sh }',
        'failurePatterns:',
        "  - { tool: test.sh, pattern: '(?m)^test\\.sh: .* FAILED in ' }",
      ].join('\n'),
      '/viz/.awf/rules.yaml': 'commands:\n  - { phase: tests, program: check.sh }',
      '/viz/check.sh': '#!/bin/sh\nnode build.mjs\n',
    });
    const piped = 'cd /ios/.claude/worktrees/wt && ./scripts/test.sh --only A | tail -3';
    const result = classifySession(
      session(
        [
          step({ kind: 'tool', tool: 'Bash', command: 'cd /ios && ./scripts/test.sh --only A' }),
          step({ kind: 'tool', tool: 'Bash', command: 'cd /ios && scripts/test.sh --build' }),
          step({
            kind: 'tool',
            tool: 'Bash',
            command: piped,
            ok: true,
            detail: { output: 'test.sh: --only A FAILED in 12s (coverage gate: not run)' },
          }),
          // Back in the session's repo, its own rules apply.
          step({ kind: 'tool', tool: 'Bash', command: 'cd /viz && ./check.sh' }),
        ],
        '/viz',
      ),
      { files: repos },
    );
    const bash = result.steps.map((s) => [s.phase, s.rule, s.failed]);
    expect(bash).toEqual([
      ['tests', 'rules.yaml:commands[1]', false],
      ['build', 'rules.yaml:commands[0]', false],
      ['tests', 'rules.yaml:commands[1]', true],
      ['tests', 'rules.yaml:commands[0]', false],
    ]);
    // Rules given by the caller apply everywhere: the script is read, and its build wins.
    const fixed = classifySession(
      session(
        [step({ kind: 'tool', tool: 'Bash', command: 'cd /ios && ./scripts/test.sh' })],
        '/viz',
      ),
      {
        files: repos,
        rules: defaultRules(),
      },
    );
    expect(fixed.steps[0]?.phase).toBe('build');
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
