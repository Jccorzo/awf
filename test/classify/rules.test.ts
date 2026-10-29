// One fixture per classifier rule, plus known false positives. The last test fails when a rule in
// default-rules.yaml has no case here: every rule ships with a fixture test (CLAUDE.md).
import { describe, expect, it } from 'vitest';
import type { Session, Step } from '../../src/model/types';
import { Classifier } from '../../src/classify/classify';
import type { PhaseId } from '../../src/classify/phases';
import { memoryFiles } from '../../src/classify/resolve';
import { defaultRules } from '../../src/classify/rules';

const files = memoryFiles({
  '/repo/.git/HEAD': 'ref: refs/heads/main\n',
  '/repo/package.json': JSON.stringify({ scripts: { 'build:test': 'tsc -p tsconfig.test.json' } }),
});
const classifier = new Classifier(defaultRules(), files);
const hit = new Set<string>();

function check(command: string, phase: PhaseId, cwd = '/repo') {
  const info = classifier.command(command, cwd);
  hit.add(info.rule);
  expect(info.phase, `${command} (rule ${info.rule}, tags ${info.tags.join(',')})`).toBe(phase);
  return info;
}

const CASES: Array<[PhaseId, string[]]> = [
  ['exploring', ['node --version', 'pnpm --version', 'eslint --print-config src/a.ts']],
  [
    'lint',
    [
      'eslint src',
      'npx prettier --check .',
      'stylelint "**/*.css"',
      'shellcheck scripts/x.sh',
      'lint-staged',
      'biome check .',
      'ruff check src',
      'ruff format .',
      'black .',
      'python -m mypy src',
      'golangci-lint run ./...',
      'gofmt -l .',
      'go vet ./...',
      'cargo clippy -- -D warnings',
      'cargo fmt --check',
      'cargo check',
      'rustfmt src/main.rs',
      'ktlint --format',
      'swiftlint lint',
      'swift format lint -r Sources',
      'dotnet format --verify-no-changes',
      'bundle exec rubocop',
      'vendor/bin/phpstan analyse',
      'npx tsc --noEmit',
      'vue-tsc --noEmit',
      'svelte-check',
      'buf lint',
      'astro check',
      'terraform fmt -check',
      'deno lint',
      'flutter analyze',
      'mix format --check-formatted',
      'pre-commit run --all-files',
      'xcrun swift-format lint -r .',
    ],
  ],
  ['exploring', ['npx jest --listTests', 'pytest --collect-only -q']],
  ['build', ['go test -c -o x.test ./pkg', 'cargo test --no-run']],
  [
    'tests',
    [
      'npx vitest run src/a.test.ts',
      'jest --watch=false',
      'mocha',
      'npx playwright test e2e/',
      'npx cypress run',
      'node --test test/',
      'bun test',
      'deno test -A',
      'pytest -x',
      'python -m pytest tests/',
      'tox -e py311',
      'python -m unittest discover',
      'go test ./...',
      'gotestsum -- ./...',
      'cargo test',
      'cargo nextest run',
      'dotnet test',
      'xcodebuild -scheme App -destination "platform=iOS Simulator,name=iPhone 17" test',
      'xcodebuild test-without-building -scheme App',
      'swift test',
      'bazel test //...',
      'bundle exec rspec spec/models',
      'ctest --output-on-failure',
      'bin/rails test',
      'bundle exec rake spec',
      'mix test',
      'flutter test',
      'k6 run load.js',
      'gh run watch 123 --exit-status',
      'gh pr checks 42 --watch',
    ],
  ],
  [
    'build',
    [
      'tsc -p tsconfig.build.json',
      'npx esbuild src/a.ts --bundle',
      'npx vite build',
      'next build',
      'vite optimize',
      'go build ./...',
      'cargo build --release',
      'dotnet build',
      'msbuild App.sln',
      'xcodebuild -scheme App -configuration Debug build',
      'swift build',
      'bazel build //app',
      'cmake --build build',
      'ninja -C out',
      'docker build -t app .',
      'docker compose -f compose.yml build api',
      'protoc --go_out=. api.proto',
      'buf generate',
      'npx prisma generate',
      'flutter build apk',
      'mix compile',
      'pod install',
      'tuist generate',
      'deno compile main.ts',
      'bun build ./index.ts --outdir out',
      'npm ci',
      'pnpm add -D vitest',
      'bun install',
      'yarn',
      'yarn add react',
      'pip install -r requirements.txt',
      'uv sync',
      'poetry install',
      'uv pip install -e .',
      'bundle install',
      'go mod tidy',
      'cargo fetch',
      'dotnet restore',
      'brew install jq',
      'npx playwright install chromium',
      'docker pull node:22',
      'rustup target add wasm32-unknown-unknown',
    ],
  ],
  ['exploring', ['xcodebuild -list']],
  [
    'exploring',
    [
      'ls -la',
      'rg TODO src',
      'cat package.json',
      'find . -name "*.ts"',
      'head -50 a.log',
      'command -v node',
      'make -n build',
      "sed -n '1,40p' src/x.ts",
      "awk '{print $1}' a.txt",
      'git status',
      'git log --oneline -10',
      'git diff HEAD~1',
      'git -C sub status',
      'git stash list',
      'git worktree list',
      'git config --get user.name',
      'git config --list',
      'git tag -l "v*"',
      'git branch -a',
      'git remote -v',
      'gh pr view 12 --json title',
      'gh run list',
      'gh api repos/x/y/pulls',
      'pnpm why vite',
      'npm ls react',
      'pip list',
      'uv tree',
      'go env GOPATH',
      'cargo tree',
      'docker ps -a',
      'docker compose logs api',
      'kubectl get pods -n x',
      'xcrun simctl list devices',
      'terraform show',
      'coverage report -m',
      'tar -tzf a.tgz',
      "tr -d '\\r' < a.txt",
      'gcloud logging read "severity>=ERROR" --limit 20',
      'aws s3api list-buckets',
      'gh auth status',
    ],
  ],
  [
    'writing-code',
    [
      "sed -i '' 's/a/b/' src/x.ts",
      "sed -i.bak 's/a/b/' x.conf",
      "perl -pi -e 's/a/b/' src/x.ts",
      'mkdir -p src/lib',
      'rm -rf dist',
      'cp a.ts b.ts',
      'tar -xzf a.tgz',
      'git add -A',
      'git checkout -b feature',
      'git commit -m "x"',
      'echo "export const a = 1" > src/a.ts',
    ],
  ],
  ['writing-tests', ['touch src/a.test.ts', "cat > test/a.test.ts <<'EOF'\nit('x')\nEOF"]],
  ['unclassified', ['echo hi', 'sleep 2', 'cd src', 'echo done > /tmp/x.txt', 'pkill -f vite']],
  // Gradle tasks, Maven goals and other task runners
  ['exploring', ['./gradlew dependencies', 'mvn dependency:tree']],
  ['lint', ['./gradlew ktlintCheck', 'mvn spotless:apply']],
  [
    'build',
    [
      './gradlew assembleDebug',
      './gradlew assembleDebugAndroidTest',
      'mvn clean install',
      './gradlew clean build',
    ],
  ],
  [
    'tests',
    [
      './gradlew test',
      './gradlew clean test',
      'mvn verify',
      './gradlew :app:connectedDebugAndroidTest',
      'sbt test',
      'turbo run test',
    ],
  ],
];

describe('rules', () => {
  for (const [phase, commands] of CASES) {
    it.each(commands)(`%s is ${phase}`, (command) => {
      check(command, phase);
    });
  }

  it('decides by name when the file that defines a script is missing', () => {
    const noFiles = new Classifier(defaultRules(), memoryFiles({}));
    const byName = (command: string) => {
      const info = noFiles.command(command, '/elsewhere');
      hit.add(info.rule);
      return info;
    };
    expect(byName('pnpm lint')).toMatchObject({
      phase: 'lint',
      tags: expect.arrayContaining(['by-name']),
    });
    expect(byName('npm test')).toMatchObject({ phase: 'tests' });
    expect(byName('make test')).toMatchObject({
      phase: 'tests',
      tags: expect.arrayContaining(['by-name']),
    });
    expect(byName('yarn build')).toMatchObject({ phase: 'build' });
    expect(byName('make')).toMatchObject({ phase: 'build', tags: ['by-default'] });
    expect(byName('pnpm dev')).toMatchObject({ phase: 'unclassified' });
  });
});

describe('known false positives', () => {
  it.each([
    ['cat test/a.test.ts', 'exploring'],
    ['grep -r "pnpm test" docs', 'exploring'],
    ['echo "npm run build"', 'unclassified'],
    ['git log --grep=test', 'exploring'],
    ['npm run build:test', 'build'],
    ['ls test/', 'exploring'],
    ['jest --version', 'exploring'],
    ['pnpm vitest --version', 'exploring'],
    ['docker run --rm node:22 npm test', 'unclassified'],
    ['open coverage/index.html', 'unclassified'],
    ['tsc', 'build'],
    ['git push origin main', 'unclassified'],
  ] as Array<[string, PhaseId]>)('%s is %s', (command, phase) => {
    check(command, phase);
  });
});

describe('compound commands', () => {
  it('takes the highest-ranked phase and keeps the others as tags', () => {
    const info = check(
      'npm run lint:fix 2>/dev/null; pnpm exec eslint . && pnpm exec vitest run',
      'tests',
    );
    expect(info.tags).toContain('lint');
    expect(info.checks.map((c) => c.key)).toEqual([
      'lint:npm lint:fix',
      'lint:eslint',
      'tests:vitest',
    ]);
  });

  it('lets a pipe filter decide only when it is a check or a write', () => {
    check('pnpm exec vitest run 2>&1 | tail -30', 'tests');
    check('some-cli --all | tail -5', 'unclassified');
    check('find . -name "*.orig" | xargs rm', 'writing-code');
    check('git diff --name-only | xargs npx eslint', 'lint');
  });

  it('reads sh -c strings, loops and conditionals', () => {
    check('sh -c "cd pkg && go test ./..."', 'tests');
    check('for f in src/*.ts; do npx eslint $f; done', 'lint');
    check('if [ -f go.mod ]; then go build ./...; fi', 'build');
  });

  it('ignores heredoc bodies', () => {
    check("python3 - <<'PY'\nimport subprocess\nsubprocess.run(['pytest'])\nPY", 'unclassified');
  });
});

describe('tool calls', () => {
  const tool = (id: string, name: string, files?: string[]): Step => ({
    id,
    parentId: null,
    kind: 'tool',
    tool: name,
    startMs: 0,
    endMs: 1,
    flags: [],
    ...(files ? { files } : {}),
  });
  const session: Session = {
    id: 's',
    agent: 'claude-code',
    sources: ['recorder'],
    startMs: 0,
    endMs: 1,
    steps: [
      tool('r', 'Read', ['/repo/a.ts']),
      tool('e', 'Edit', ['/repo/src/a.ts']),
      tool('et', 'Write', ['/repo/src/a.test.ts']),
      tool('t', 'TodoWrite'),
      tool('p', 'mcp__ccd_turn__update_plan'),
      tool('q', 'AskUserQuestion'),
      tool('d', 'mcp__ide__getDiagnostics'),
      tool('u', 'mcp__browser__click'),
    ],
  };
  const classified = classifier.session(session);
  const phase = (id: string) => classified.steps.find((s) => s.id === id)?.phase;

  it('classifies tools by name, and edits by file', () => {
    for (const step of classified.steps) if (step.rule) hit.add(step.rule);
    expect([
      phase('r'),
      phase('e'),
      phase('et'),
      phase('t'),
      phase('p'),
      phase('q'),
      phase('d'),
      phase('u'),
    ]).toEqual([
      'exploring',
      'writing-code',
      'writing-tests',
      'planning',
      'planning',
      'waiting',
      'lint',
      'unclassified',
    ]);
  });
});

describe('coverage', () => {
  it('has a fixture for every rule in default-rules.yaml', () => {
    const rules = defaultRules();
    const all = [...rules.commands, ...rules.tasks, ...rules.scripts, ...rules.tools].map(
      (r) => r.id,
    );
    const missing = all.filter((id) => !hit.has(id));
    expect(missing, `rules without a fixture: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('unknown parts, polling and tricky syntax', () => {
  it('lets an unknown part outrank the near-instant phases, but not a check', () => {
    check('mkdir -p out && python3 gen.py', 'unclassified');
    check('ls dist && node scripts/size.js', 'unclassified');
    check('python3 gen.py && pnpm exec vitest run', 'tests');
    check('python3 report.py | grep total', 'unclassified');
    check('cat data.json | python3 -m json.tool', 'exploring');
  });

  it('treats waiting loops and long sleeps as polling, unless a check runs', () => {
    expect(check('until curl -sf localhost:3000; do sleep 2; done', 'unclassified').tags).toContain(
      'polling',
    );
    expect(check('while ! grep -q ready app.log; do sleep 1; done', 'unclassified').tags).toContain(
      'polling',
    );
    expect(check('sleep 30 && gh run view 123', 'unclassified').tags).toContain('polling');
    check('sleep 1 && ls', 'exploring');
    check('for i in 1 2 3; do sleep 5; pnpm exec vitest run; done', 'tests');
  });

  it('skips case patterns and calls of functions defined in the same line', () => {
    check('case "$s" in done|ok) echo yes;; *) ls -la;; esac', 'exploring');
    check('q() { psql -h db -c "$1"; }; q "select 1"', 'unclassified');
    check('f() { npx eslint "$@"; }; f src && f test', 'lint');
  });

  it('keeps $(...) with its own quotes inside a double-quoted string in one word', () => {
    check(
      'echo "run: $(gh api x --jq \'"\\(.name) \\(.status // "")"\')" && git status',
      'exploring',
    );
    check('echo "$(grep -o \'"id"\' a.json | wc -l | tr -d \' \')" files', 'unclassified');
  });
});
