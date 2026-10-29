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

// Cases from the rules review (2026-10-29): each new rule, and the misreadings it fixed.
const REVIEW_CASES: Array<[PhaseId, string[]]> = [
  // -v and -V mean verbose for these, not --version.
  ['tests', ['pytest -v', 'python -m pytest -v', 'uv run pytest -v', 'ctest -V', 'tox -v']],
  ['lint', ['mypy -v src', 'flake8 -v', 'black -v .']],
  [
    'lint',
    [
      'swift-format lint -r Sources',
      'go fmt ./...',
      'cross clippy',
      'cargo machete',
      'cargo hack check --each-feature',
      'ty check',
      'pyrefly check',
      'next lint',
      'ng lint',
      'vue-cli-service lint',
      'nuxi typecheck',
      'xcodebuild -scheme App analyze',
      'python manage.py check',
      'tox -e lint',
      'nox -s typecheck',
      'npx -y prettier@3.3.3 --check .',
      'npx eslint@9 .',
      'npx -y @biomejs/biome@latest check .',
      'pnpm dlx prettier@3 --check .',
      'uvx ruff@0.6.9 check .',
      'uvx black==24.8.0 --check .',
      'uv tool run ruff check .',
      'pipx run ruff check .',
      'go tool golangci-lint run',
      'go tool staticcheck ./...',
      'go run github.com/golangci/golangci-lint/cmd/golangci-lint@v1.61.0 run',
      'find . -name "*.py" -exec black {} +',
      'fd -e ts -x prettier --check',
      'function lint { npx eslint .; }; lint',
    ],
  ],
  [
    'exploring',
    [
      'pytest --co -q',
      'go test -list . ./...',
      'cargo nextest list',
      'cargo test -- --list',
      'swift test --list-tests',
      'dotnet test --list-tests',
      'xcodebuild -project App.xcodeproj -scheme App -showdestinations',
      'xcodebuild -showTestPlans -scheme App',
      'go mod why golang.org/x/net',
      'go mod graph',
      'rustup show',
      'rustup toolchain list',
      'rustup target list --installed',
      'nvm ls',
      'git config user.email',
      'git config --global user.email',
      'git config --get-regexp alias',
      'git config -l',
      'git remote get-url origin',
      'git remote show origin',
      'git branch --list "feat*"',
      'git branch --contains abc123',
      'git tag --sort=-v:refname',
      'uv pip list',
      'swift package describe',
      'docker-compose ps',
      'docker-compose logs -f api',
      'xcrun xcresulttool get --path x.xcresult',
      'xcrun --show-sdk-path',
      'kubectl -n prod get pods',
      'kubectl --context staging get pods',
      'gh -R owner/repo pr view 12',
      'make --version',
      'diff <(git show HEAD:src/a.ts) src/a.ts',
      "sed 's/ -i / /' a.txt",
      "perl -MList::Util=sum -le 'print sum(1,2)'",
      './gradlew :app:dependencies --configuration releaseRuntimeClasspath',
      './gradlew help --task testDebugUnitTest',
    ],
  ],
  [
    'tests',
    [
      'python manage.py test',
      './manage.py test',
      'ruby -Itest test/models/user_test.rb',
      'bundle exec ruby -Itest test/a_test.rb',
      'php artisan test',
      'php vendor/bin/phpunit',
      'ng test --watch=false',
      'react-scripts test --watchAll=false',
      'craco test',
      'vue-cli-service test:unit',
      'ng e2e',
      'hatch test',
      'rye test',
      'tuist test',
      'fastlane scan',
      'cargo llvm-cov',
      'cargo tarpaulin',
      'cargo insta test',
      'cross test',
      'cargo xtask test',
      'cargo make test',
      'dotnet watch test',
      'bin/rails test:system',
      'meson test -C build',
      'ninja -C build test',
      'cmake --build build --target test',
      'coverage run -m pytest',
      'coverage run --branch -m pytest',
      'coverage run -m pytest && coverage report',
      'python -m coverage run -m pytest',
      'coverage run -m unittest discover',
      'python -u -m pytest',
      'python -W error -m pytest',
      'python3 -I -m pytest',
      'npx vitest@2 run',
      'bunx --bun vitest@latest run',
      'npx @playwright/test test',
      'npx @angular/cli test',
      'xcrun xcodebuild test -scheme App',
      'xcrun swift test',
      'bun --cwd web test',
      'bun run --cwd web test',
      'cargo --color always test',
      'nvm use 20 && npm test',
      'fnm use 20 && pnpm test',
      'bash -o pipefail -c "pytest | tail"',
      'bash -euo pipefail -c "pytest"',
      'OUT=$(pnpm test 2>&1); echo "$OUT" | tail -40',
      'result=$(pytest -q | tail -1)',
      'echo $(pnpm test)',
      'read -r a b <<< "$x"\npnpm test',
      'node -e "console.log(1 << n)"\npnpm test',
      './gradlew iosSimulatorArm64Test',
      './gradlew verifyPaparazziDebug',
      './gradlew recordRoborazziDebug',
      'mvn -e test',
      'pnpm -r test-unit',
      'pnpm -r check',
      'make -C nowhere test-unit',
      'lerna run test --stream',
      'just test',
      'mise run test',
      'poe test',
      'poetry run task test',
      'devbox run test',
      'composer test',
      'composer run test',
      'rake spec',
      'run-s lint test',
      'npm-run-all -p lint test',
      'concurrently "npm:lint" "npm:test"',
      'concurrently "pnpm lint" "vitest run"',
      'start-server-and-test dev http://localhost:3000 cy:run',
    ],
  ],
  [
    'build',
    [
      'electron-builder --mac',
      'storybook build',
      'craco build',
      'remix vite:build',
      'expo export',
      'expo prebuild',
      'gcc -o a a.c',
      'clang++ main.cpp',
      'rustc main.rs',
      'javac A.java',
      'python -m build',
      'uv build',
      'poetry build',
      'maturin develop',
      'MSBuild.exe App.sln',
      'xcodebuild -resolvePackageDependencies',
      'docker-compose build',
      'docker compose up --build -d',
      'docker --context remote build .',
      'docker compose -p proj -f a.yml -f b.yml build',
      'dart run build_runner build',
      'flutter pub run build_runner build',
      'dart pub get',
      'xcodegen',
      'fastlane gym',
      'yarn --frozen-lockfile',
      'yarn --immutable',
      'uv tool install ruff',
      'conda env create -f environment.yml',
      'bundle',
      'bundle --jobs 4',
      'swift package resolve',
      'go mod download',
      'go get golang.org/x/net',
      'docker compose pull',
      'docker-compose pull',
      'x=$(go build ./... 2>&1); echo "$x"',
      './gradlew testClasses',
      'mvn verify -DskipTests',
      'pnpm --filter web build:test',
      'turbo run build:prod',
      'lerna run build',
      'task build',
      'rake build',
    ],
  ],
  [
    'lint',
    [
      'turbo run format:check',
      'turbo run lint:fix',
      'nx run-many -t lint:check',
      'pnpm -r lint-fix',
      'make -C nowhere fmt-check',
      'just lint',
      'rake rubocop',
    ],
  ],
  [
    'writing-code',
    [
      'go mod edit -replace a=b',
      'dotnet add reference ../lib/lib.csproj',
      "sed -Ei 's/a/b/' a.txt",
      "sed -ri 's/a/b/' a.txt",
      "yq -i '.a = 1' x.yml",
      "gawk -i inplace '{print}' f.txt",
      'sort -o f.txt f.txt',
      'find . -name "*.orig" -delete',
      'git config user.email me@example.com',
    ],
  ],
  // A script called by path isn't the shell's builtin; one awf can't read stays unclassified.
  [
    'unclassified',
    [
      'script/test',
      'bin/test',
      'bundle exec rake',
      'pushd web',
      'nvm use 20',
      'sdk use java 21.0.2-tem',
    ],
  ],
];

describe('rules', () => {
  for (const [phase, commands] of [...CASES, ...REVIEW_CASES]) {
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
    // The substitution runs grep, wc and tr: they count.
    check('echo "$(grep -o \'"id"\' a.json | wc -l | tr -d \' \')" files', 'exploring');
  });
});
