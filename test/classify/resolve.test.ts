import { describe, expect, it } from 'vitest';
import { Classifier } from '../../src/classify/classify';
import { memoryFiles, parseFastfile, parseMakefile } from '../../src/classify/resolve';
import { defaultRules, loadRules } from '../../src/classify/rules';
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

describe('fastlane lanes', () => {
  // A hand-made Fastfile in the usual layout: lanes inside a platform block, indented.
  const fastfile = [
    'default_platform(:ios)',
    '',
    'platform :ios do',
    '  desc "Unit tests with coverage"',
    '  lane :unit_tests do |options|',
    '    sh("../scripts/generate.sh")',
    '    scan(scheme: "App", code_coverage: true, clean: options.fetch(:clean, false))',
    '  end',
    '',
    '  lane :beta do',
    '    build_app(scheme: "App")',
    '    upload_to_testflight',
    '  end',
    '',
    '  lane :lint do',
    '    swiftlint(strict: true)',
    '  end',
    '',
    '  lane :ci do',
    '    lint',
    '    unit_tests(clean: true)',
    '  end',
    '',
    '  lane :bootstrap do',
    "    sh('../scripts/setup.sh')",
    '  end',
    '',
    '  lane :notes do',
    '    UI.message("scan finished")',
    '  end',
    '',
    '  def helper',
    '    gym',
    '  end',
    'end',
    '',
    'platform :android do',
    '  lane :android_tests do',
    '    gradle(task: "testDebugUnitTest")',
    '  end',
    'end',
  ].join('\n');
  const c = classifier({
    '/app/fastlane/Fastfile': fastfile,
    '/app/scripts/generate.sh': '#!/bin/sh\nxcodegen generate\n',
    '/app/scripts/setup.sh': '#!/bin/sh\npod install\n',
  });

  it('reads the lanes and the bodies of a Fastfile', () => {
    const lanes = parseFastfile(fastfile);
    expect([...lanes.keys()]).toEqual([
      'unit_tests',
      'beta',
      'lint',
      'ci',
      'bootstrap',
      'notes',
      'android_tests',
    ]);
    expect(lanes.get('beta')?.trim().split('\n')).toHaveLength(2);
  });

  it('classifies a lane by its actions, through bundle exec and a platform', () => {
    for (const command of [
      'bundle exec fastlane unit_tests',
      'fastlane ios unit_tests clean:true',
      'cd ios && bundle exec fastlane unit_tests > ../ci.log 2>&1',
    ]) {
      const info = c.command(command, '/app');
      expect(info, command).toMatchObject({ phase: 'tests', decidedBy: 'fastlane scan' });
      // Its `sh` steps don't count next to an action awf knows.
      expect(info.tags).toContain('lane:unit_tests');
      expect(info.tags).not.toContain('build');
    }
    expect(c.command('fastlane beta', '/app')).toMatchObject({
      phase: 'build',
      tags: expect.arrayContaining(['running', 'lane:beta']),
    });
    expect(c.command('fastlane lint', '/app').phase).toBe('lint');
    expect(c.command('fastlane ci', '/app').phase).toBe('tests');
    expect(c.command('fastlane android android_tests', '/app').phase).toBe('tests');
  });

  it("reads a lane's sh steps when it has no action awf knows", () => {
    expect(c.command('fastlane bootstrap', '/app')).toMatchObject({
      phase: 'build',
      tags: expect.arrayContaining(['install', 'lane:bootstrap', 'file:../scripts/setup.sh']),
    });
  });

  it('decides by the lane name when the Fastfile is missing or says nothing', () => {
    const none = classifier({});
    expect(none.command('bundle exec fastlane checkout_tests', '/elsewhere')).toMatchObject({
      phase: 'tests',
      tags: ['by-name', 'lane:checkout_tests'],
    });
    expect(none.command('fastlane build_release', '/elsewhere').phase).toBe('build');
    // A name that says nothing: fastlane's own rules (deploys and uploads are Running scripts).
    expect(none.command('fastlane beta', '/elsewhere').phase).toBe('running');
    expect(c.command('fastlane notes', '/app').phase).toBe('running');
    // fastlane's tools run by name, not lanes.
    expect(none.command('fastlane scan', '/elsewhere').phase).toBe('tests');
    expect(none.command('fastlane gym', '/elsewhere').phase).toBe('build');
  });
});

describe("a repo's own rules", () => {
  const files = {
    '/app/scripts/test.sh':
      '#!/bin/bash\nset -e\nxcodebuild build-for-testing -scheme App\nxcodebuild test-without-building -scheme App\n',
    '/app/scripts/e2e-cli.sh':
      '#!/usr/bin/env bash\nnode dist/cli.js deploy --dry-run\ncurl -sf localhost:8080/health\n',
    '/app/scripts/smoke-full.sh': '#!/bin/sh\n./scripts/e2e-cli.sh\n',
    '/app/scripts/check.sh': '#!/bin/sh\npytest -q\n',
    '/app/package.json': JSON.stringify({ scripts: { e2e: 'node scripts/e2e.mjs' } }),
  };
  const rules = [
    'commands:',
    '  - { phase: tests, program: test.sh }',
    "  - { phase: tests, match: '(^|/)scripts/(e2e-cli|smoke-full)\\.sh(\\s|$)', tool: e2e }",
    '  - { phase: tests, program: pnpm, args: [e2e], tool: e2e }',
  ].join('\n');
  const withRules = memoryFiles({ ...files, '/app/.awf/rules.yaml': rules });
  const own = new Classifier(loadRules('/app', withRules), withRules);
  const plain = classifier(files);

  it('reads a script awf has no repo rule for', () => {
    // Its build comes first in rank, as in any compound command.
    expect(plain.command('./scripts/test.sh', '/app')).toMatchObject({ phase: 'build' });
    expect(plain.command('./scripts/e2e-cli.sh', '/app').phase).toBe('running');
    expect(plain.command('pnpm e2e', '/app').phase).toBe('running');
  });

  it('lets a repo rule name a script by its program name before reading it', () => {
    for (const command of [
      './scripts/test.sh',
      'bash scripts/test.sh -v',
      'cd /app && ./scripts/test.sh 2>&1 | tail -20',
    ]) {
      const info = own.command(command, '/app');
      expect(info, command).toMatchObject({ phase: 'tests', rule: 'rules.yaml:commands[0]' });
      expect(info.checks.map((c) => c.key)).toEqual(['tests:test.sh']);
    }
  });

  it("lets a repo rule's match name a script, and a package script, before reading it", () => {
    expect(own.command('./scripts/e2e-cli.sh --env dev', '/app')).toMatchObject({
      phase: 'tests',
      decidedBy: 'e2e',
    });
    expect(own.command('sh scripts/smoke-full.sh', '/app').phase).toBe('tests');
    expect(own.command('pnpm e2e', '/app').phase).toBe('tests');
  });

  it('still reads scripts no repo rule names', () => {
    expect(own.command('./scripts/check.sh', '/app')).toMatchObject({
      phase: 'tests',
      tags: expect.arrayContaining(['file:./scripts/check.sh']),
    });
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
