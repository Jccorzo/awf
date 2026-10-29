import { describe, expect, it } from 'vitest';
import { Classifier } from '../../src/classify/classify';
import { memoryFiles, parseMakefile } from '../../src/classify/resolve';
import { defaultRules } from '../../src/classify/rules';
import type { Session } from '../../src/model/types';

function classifier(entries: Record<string, string>) {
  return new Classifier(defaultRules(), memoryFiles(entries));
}

const pkg = (scripts: Record<string, string>) => JSON.stringify({ name: 'x', scripts });

describe('npm-style scripts', () => {
  const c = classifier({
    '/repo/package.json': pkg({
      test: 'vitest run',
      pretest: 'tsc -p .',
      posttest: 'echo done',
      lint: 'eslint . && prettier --check .',
      dev: 'vite',
      ci: 'npm run lint && npm test',
    }),
    '/repo/packages/web/package.json': pkg({ test: 'jest' }),
  });

  it('runs pre and post scripts with npm, not with pnpm', () => {
    expect(c.command('npm test', '/repo')).toMatchObject({ phase: 'build' });
    expect(c.command('npm test', '/repo').tags).toContain('tests');
    expect(c.command('pnpm test', '/repo')).toMatchObject({ phase: 'tests' });
  });

  it('resolves nested scripts', () => {
    const info = c.command('npm run ci', '/repo');
    expect(info.phase).toBe('build');
    expect(info.checks.map((x) => x.key).sort()).toEqual([
      'build:tsc',
      'lint:eslint',
      'lint:prettier',
      'tests:vitest',
    ]);
  });

  it('reads the nearest package.json, and -C / --prefix', () => {
    expect(c.command('pnpm test', '/repo/packages/web/src').checks[0]?.tool).toBe('jest');
    expect(c.command('pnpm -C packages/web test', '/repo').checks[0]?.tool).toBe('jest');
    expect(c.command('npm --prefix packages/web test', '/repo').checks[0]?.tool).toBe('jest');
    expect(c.command('cd packages/web && pnpm test', '/repo').checks[0]?.tool).toBe('jest');
  });

  it('runs a binary when no script has the name', () => {
    expect(c.command('pnpm tsc --noEmit', '/repo')).toMatchObject({ phase: 'lint' });
    expect(c.command('yarn eslint .', '/repo')).toMatchObject({ phase: 'lint' });
  });

  it('counts a dev server as Running scripts', () => {
    expect(c.command('pnpm dev', '/repo').phase).toBe('running');
  });

  it('decides workspace scripts by name', () => {
    expect(c.command('pnpm -r test', '/repo')).toMatchObject({ phase: 'tests' });
    expect(c.command('pnpm --filter web lint', '/repo').tags).toContain('by-name');
    expect(c.command('yarn workspace web test', '/repo')).toMatchObject({ phase: 'tests' });
  });

  it('reads deno tasks', () => {
    const d = classifier({
      '/d/deno.json': JSON.stringify({ tasks: { check: 'deno lint && deno test' } }),
    });
    expect(d.command('deno task check', '/d')).toMatchObject({ phase: 'tests' });
  });
});

describe('make', () => {
  const makefile = [
    'GO ?= go',
    'PKGS := ./...',
    '.PHONY: all test lint ci',
    'all: build test',
    'build:',
    '\t$(GO) build $(PKGS)',
    'test: build',
    '\t@$(GO) test -race $(PKGS)',
    'lint:',
    '\t-golangci-lint run',
    'ci:',
    '\t$(MAKE) lint test',
    'dev: ; air -c .air.toml',
  ].join('\n');
  const c = classifier({ '/m/Makefile': makefile, '/m/sub/Makefile': 'test:\n\tpytest -q\n' });

  it('parses targets, prerequisites, recipes and variables', () => {
    const parsed = parseMakefile(makefile);
    expect(parsed.first).toBe('all');
    expect(parsed.rules.get('test')).toEqual({ deps: ['build'], recipe: ['go test -race ./...'] });
    expect(parsed.rules.get('ci')?.recipe).toEqual(['make lint test']);
    expect(parsed.rules.get('dev')?.recipe).toEqual(['air -c .air.toml']);
  });

  it('classifies a target by its own recipe', () => {
    expect(c.command('make test', '/m')).toMatchObject({ phase: 'tests', tags: ['make:test'] });
    expect(c.command('make lint', '/m').phase).toBe('lint');
  });

  it('runs the prerequisites of an empty target, and the first target by default', () => {
    expect(c.command('make all', '/m').checks.map((x) => x.key)).toEqual([
      'build:go build',
      'tests:go test',
    ]);
    expect(c.command('make', '/m').phase).toBe('build');
  });

  it('follows $(MAKE) and -C', () => {
    expect(c.command('make ci', '/m')).toMatchObject({ phase: 'tests' });
    expect(c.command('make -C sub test', '/m').checks[0]?.tool).toBe('pytest');
  });

  it('decides an unknown target by its name, and leaves it unclassified when it says nothing', () => {
    expect(c.command('make dev', '/m').phase).toBe('running');
    expect(c.command('make deploy-staging', '/m').phase).toBe('running');
    expect(c.command('make frobnicate', '/m').phase).toBe('unclassified');
  });
});

describe('git hooks', () => {
  it('classifies git commit by its pre-commit hook', () => {
    const husky = classifier({ '/g/.git/HEAD': 'x', '/g/.husky/pre-commit': 'npx lint-staged\n' });
    expect(husky.command('git commit -m "x"', '/g/src')).toMatchObject({ phase: 'lint' });
    expect(husky.command('git commit --no-verify -m "x"', '/g').phase).toBe('writing-code');
    const lefthook = classifier({
      '/l/.git/HEAD': 'x',
      '/l/lefthook.yml': 'pre-commit:\n  commands:\n    test:\n      run: go test ./...\n',
    });
    expect(lefthook.command('git commit -am x', '/l').phase).toBe('tests');
    const precommit = classifier({
      '/p/.git/HEAD': 'x',
      '/p/.pre-commit-config.yaml': 'repos: []',
    });
    expect(precommit.command('git commit -m x', '/p').phase).toBe('lint');
    const none = classifier({ '/n/.git/HEAD': 'x' });
    expect(none.command('git commit -m x', '/n').phase).toBe('writing-code');
  });

  it('classifies git push by its pre-push hook, and the push itself as Running scripts', () => {
    const husky = classifier({ '/g/.git/HEAD': 'x', '/g/.husky/pre-push': 'pnpm test\n' });
    expect(husky.command('git push -u origin feature', '/g/src')).toMatchObject({
      phase: 'tests',
      tags: expect.arrayContaining(['hook:.husky/pre-push', 'running']),
    });
    expect(husky.command('git -c core.hooksPath=.husky push', '/g').phase).toBe('tests');
    // -n is --dry-run for push, which still runs the hook.
    expect(husky.command('git push -n', '/g').phase).toBe('tests');
    expect(husky.command('git push --no-verify', '/g').phase).toBe('running');
    // The pre-commit hook isn't the pre-push one.
    expect(husky.command('git commit -m x', '/g').phase).toBe('writing-code');
    const lefthook = classifier({
      '/l/.git/HEAD': 'x',
      '/l/lefthook.yml': 'pre-push:\n  commands:\n    lint:\n      run: npx eslint .\n',
    });
    expect(lefthook.command('git push', '/l').phase).toBe('lint');
    const plain = classifier({
      '/p/.git/HEAD': 'x',
      '/p/.git/hooks/pre-push': '#!/bin/sh\ngit diff --stat\n',
    });
    expect(plain.command('git push', '/p')).toMatchObject({
      phase: 'running',
      tags: expect.arrayContaining(['hook:.git/hooks/pre-push', 'exploring']),
    });
    const none = classifier({ '/n/.git/HEAD': 'x' });
    expect(none.command('git push', '/n').phase).toBe('running');
  });
});

describe('script files', () => {
  it('classifies a shell script by its contents', () => {
    const c = classifier({
      '/s/scripts/test.sh': '#!/bin/sh\nset -e\ncd "$(dirname "$0")/.."\npytest -q\n',
    });
    expect(c.command('./scripts/test.sh', '/s')).toMatchObject({
      phase: 'tests',
      tags: expect.arrayContaining(['file:./scripts/test.sh']),
    });
    expect(c.command('bash scripts/test.sh', '/s').phase).toBe('tests');
    // One awf can't read runs something it can't see: Running scripts.
    expect(c.command('./scripts/missing.sh', '/s').phase).toBe('running');
  });
});

describe('task runners', () => {
  const c = classifier({});
  it('reads Gradle tasks and Maven goals, skipping option values and clean', () => {
    expect(
      c.command('./gradlew -p app --console=plain testDebugUnitTest -x lint', '/r'),
    ).toMatchObject({ phase: 'tests' });
    expect(c.command('./gradlew clean', '/r').phase).toBe('build');
    expect(c.command('mvn -pl core -am test', '/r').phase).toBe('tests');
    expect(c.command('mvn -DskipTests package', '/r').phase).toBe('build');
  });
  it('reads turbo and nx targets', () => {
    expect(c.command('turbo run build test --filter=web', '/r').phase).toBe('build');
    expect(c.command('nx affected -t lint test', '/r').phase).toBe('tests');
    expect(c.command('nx run web:build', '/r').phase).toBe('build');
    expect(c.command('nx test web', '/r').phase).toBe('tests');
  });
});

describe('review fixes', () => {
  const c = classifier({
    '/repo/package.json': JSON.stringify({ scripts: { test: 'vitest run' } }),
    '/repo/web/package.json': JSON.stringify({ scripts: { test: 'jest', build: 'next build' } }),
    '/repo/script/test': '#!/usr/bin/env bash\nset -e\npytest -q\n',
    '/repo/scripts/release.py': '#!/usr/bin/env python3\n"""\nmake build\n"""\nimport os\n',
  });

  it("keeps a subshell's cd inside it", () => {
    const info = c.command('(cd web && pnpm build) && pnpm test', '/repo');
    expect(info.checks.map((k) => k.key)).toEqual(['build:next', 'tests:vitest']);
    expect(c.command('pushd web && pnpm test', '/repo').checks[0]?.key).toBe('tests:jest');
  });

  it("doesn't carry a subshell's cd to the next call", () => {
    const session: Session = {
      id: 's',
      agent: 'claude-code',
      sources: ['transcript'],
      cwd: '/repo',
      startMs: 0,
      endMs: 100,
      steps: [
        {
          id: 'a',
          parentId: null,
          kind: 'tool',
          tool: 'Bash',
          command: '(cd web && pnpm build)',
          startMs: 0,
          endMs: 10,
          flags: [],
        },
        {
          id: 'b',
          parentId: null,
          kind: 'tool',
          tool: 'Bash',
          command: 'pnpm test',
          startMs: 20,
          endMs: 30,
          flags: [],
        },
      ],
    };
    expect(c.session(session).steps[1]?.checks[0]?.key).toBe('tests:vitest');
  });

  it('gives each cargo and go subcommand its own check, so rework waits for the same one', () => {
    expect(c.command('cargo fmt --check', '/repo').checks[0]?.key).toBe('lint:cargo fmt');
    expect(c.command('cargo clippy -- -D warnings', '/repo').checks[0]?.key).toBe(
      'lint:cargo clippy',
    );
    expect(c.command('cargo check', '/repo').checks[0]?.key).toBe('lint:cargo check');
    expect(c.command('cargo doc', '/repo').checks[0]?.key).toBe('build:cargo doc');
    expect(c.command('go generate ./...', '/repo').checks[0]?.key).toBe('build:go generate');
  });

  it('reads scripts called by path when they are shell scripts, and only then', () => {
    expect(c.command('script/test', '/repo')).toMatchObject({ phase: 'tests' });
    expect(c.command('./scripts/release.py', '/repo').phase).toBe('running');
  });

  it('counts the right files as test files', () => {
    for (const file of [
      '/r/app/tests.py',
      '/r/pkg/x/testdata/golden.json',
      '/r/src/Button.cy.tsx',
      '/r/src/__snapshots__/a.test.ts.snap',
      '/r/spec/models/user_spec.rb',
    ])
      expect(c.isTestFile(file), file).toBe(true);
    for (const file of ['/r/spec/openapi.yaml', '/r/docs/spec/api.json'])
      expect(c.isTestFile(file), file).toBe(false);
  });
});
