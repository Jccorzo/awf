import { describe, expect, it } from 'vitest';
import { Classifier } from '../../src/classify/classify';
import { memoryFiles, parseMakefile } from '../../src/classify/resolve';
import { defaultRules } from '../../src/classify/rules';

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

  it('leaves a dev server unclassified', () => {
    expect(c.command('pnpm dev', '/repo').phase).toBe('unclassified');
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

  it('leaves an unknown target unclassified when its name says nothing', () => {
    expect(c.command('make dev', '/m').phase).toBe('unclassified');
    expect(c.command('make deploy-staging', '/m').phase).toBe('unclassified');
  });
});

describe('git commit hooks', () => {
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
});

describe('script files', () => {
  it('classifies a shell script by its contents', () => {
    const c = classifier({
      '/s/scripts/test.sh': '#!/bin/sh\nset -e\ncd "$(dirname "$0")/.."\npytest -q\n',
    });
    expect(c.command('./scripts/test.sh', '/s')).toMatchObject({
      phase: 'tests',
      tags: ['file:./scripts/test.sh'],
    });
    expect(c.command('bash scripts/test.sh', '/s').phase).toBe('tests');
    expect(c.command('./scripts/missing.sh', '/s').phase).toBe('unclassified');
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
