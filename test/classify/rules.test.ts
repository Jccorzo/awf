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
  '/repo/pubspec.yaml': 'name: my_cli\n',
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
  [
    'unclassified',
    [
      'bundle exec rake',
      'pushd web',
      'nvm use 20',
      'sdk use java 21.0.2-tem',
      'gh auth switch -u someone',
      'eval "$(fnm env --shell bash)"',
      'print -- done',
    ],
  ],
  // Running scripts: running something that isn't a check, an edit or a read.
  [
    'running',
    [
      'python3 gen.py',
      'python3 -c "print(1)"',
      'python3.12 tools/x.py',
      '.venv/bin/python manage.py runserver',
      'node scripts/size.js',
      'tsx scripts/seed.ts',
      'deno run -A main.ts',
      'ruby script.rb',
      'php artisan serve',
      'java -jar app.jar',
      'swift run',
      'dotnet run --project api',
      'bash scripts/missing.sh',
      'go run ./cmd/server',
      'cargo run --release',
      'mix phx.server',
      'next dev',
      'npx next start -p 3000',
      'vite preview',
      'ng serve',
      'expo start',
      'react-native run-ios',
      'flutter run',
      'npx webpack serve --mode development',
      'npx vite',
      'vite --port 5173',
      'nodemon server.js',
      'uvicorn app:app --reload',
      'python -m http.server 8000',
      'npx wait-on http://localhost:3000',
      'bin/rails server',
      'rails db:migrate',
      'curl -s localhost:3000/health',
      'wget https://example.com/a.tgz',
      'ssh host uptime',
      'dig example.com',
      'whois example.com',
      'openssl rand -hex 16',
      'psql -h localhost -c "select 1"',
      'pg_ctl -D pgdata start',
      'sqlite3 app.db ".tables"',
      'redis-cli ping',
      'alembic upgrade head',
      'npx prisma migrate dev',
      'npx drizzle-kit push',
      'docker run --rm node:22 npm test',
      'docker compose up -d',
      'kubectl apply -f k8s/',
      'terraform apply',
      'helm upgrade --install api ./chart',
      'gcloud run deploy api --source .',
      'aws s3 cp a.txt s3://bucket/a.txt',
      'vercel deploy --prod',
      'fastlane beta',
      'xcrun simctl boot "iPhone 17"',
      'xcrun devicectl device install app --device X App.app',
      'adb install app.apk',
      'npm publish --access public',
      'cargo publish',
      'poetry publish --build',
      'twine upload dist/*',
      'git push origin main',
      'fnm exec --using=22 git push -u origin feature',
      'gh pr create --fill',
      'gh pr merge 12 --squash',
      'gh api -X POST repos/o/r/issues/1/comments -f body=hi',
      'gh api --method=DELETE repos/o/r/git/refs/heads/x',
      'glab mr create --fill',
      'npx playwright screenshot http://localhost:3000 a.png',
      'ffmpeg -i a.mov a.gif',
      './scripts/release.py',
      '$SP/verify.sh wt d2',
      './run.sh',
      'script/test',
      'bin/test',
      '.build/release/app install',
      './gradlew bootRun',
      'mvn spring-boot:run',
      'mkdir -p out && python3 gen.py',
      'cat > probe.py <<EOF\nprint(1)\nEOF\npython3 probe.py',
      'curl -s localhost:3000/api | python3 -m json.tool',
    ],
  ],
  // Reads, edits and checks of the same programs keep their phases.
  [
    'exploring',
    [
      'xcrun devicectl list devices',
      'glab mr list',
      'glab ci trace 123',
      'glab api projects/1/jobs/2/trace',
      'gh auth switch -u someone && gh pr list',
      'git clone https://github.com/o/r.git /tmp/r',
      'cat data.json | python3 -c "import json,sys; print(json.load(sys.stdin))"',
    ],
  ],
  ['writing-code', ['git pull --rebase', 'scp build.tgz host:/srv/']],
  ['tests', ['tsx --test test/a.test.ts']],
];

// Gaps found in 30 days of sessions (2026-10-29): coverage reports, fastlane, cargo fuzz, git
// plumbing, Ruby tooling and macOS tools.
const GAP_CASES: Array<[PhaseId, string[]]> = [
  [
    'tests',
    [
      'cargo +nightly fuzz run parse corpus/parse -- -max_total_time=120',
      'cargo-mutants -j 4',
      'caffeinate -i pytest -q',
      'sandbox-exec -f deny-net.sb pytest -q',
    ],
  ],
  [
    'build',
    [
      'cargo fuzz build parse',
      'cargo clean',
      'lipo -create a.a b.a -output c.a',
      'gem build app.gemspec',
      'bundle lock --add-platform arm64-darwin-24',
      'gem install bundler',
      'bundle install',
      'npx create-next-app@latest web --ts',
      'xcode-select --install',
      'npx tsc-alias -p tsconfig.build.json',
    ],
  ],
  [
    'exploring',
    [
      'cargo fuzz list',
      'xcrun llvm-cov report -instr-profile x.profdata App',
      'llvm-cov export -format=lcov -instr-profile x.profdata App',
      'xcrun xccov view --report --json r.xcresult',
      'xccov view --report r.xcresult',
      'llvm-profdata merge -o x.profdata a.profraw',
      'swift-demangle < symbols.txt',
      'pdfinfo a.pdf',
      'pbpaste',
      'pmset -g batt',
      'lipo -info App',
      'xcode-select -p',
      'bundle check',
      'gem contents fastlane',
      'git merge-tree --write-tree --name-only main topic',
      'git -C repo symbolic-ref --short HEAD',
      'git cherry -v origin/main origin/develop',
      'git archive HEAD',
    ],
  ],
  [
    'writing-code',
    [
      'cargo fuzz init',
      'git write-tree',
      'git commit-tree abc123 -p def456 -m x',
      'git update-ref -d refs/remotes/origin/pr-1',
      'git read-tree -u --reset origin/main',
      'git update-index --cacheinfo 100644,abc,src/a.rs',
      'git symbolic-ref HEAD refs/heads/x',
    ],
  ],
  [
    'running',
    [
      'gh run watch 123 --exit-status',
      'gh pr checks 42 --watch',
      'cloud-sql-proxy proj:region:db --port 5432',
      'mkcert localhost',
      'claude -p "summarise the log"',
      'pdftoppm -png a.pdf page',
      'pmset sleepnow',
    ],
  ],
  [
    'unclassified',
    ['mktemp -d', 'pbcopy < a.txt', 'xcode-select -s /Applications/Xcode.app', 'caffeinate -d'],
  ],
];

// Dart and Flutter: the SDKs' own commands, fvm, melos, build_runner, patrol, very_good and dcm.
const DART_CASES: Array<[PhaseId, string[]]> = [
  [
    'lint',
    [
      'dart analyze --fatal-infos',
      'dart format --output=none --set-exit-if-changed .',
      'dart fix --apply',
      'fvm flutter analyze --no-fatal-infos',
      'dart run custom_lint',
      'flutter pub run custom_lint',
      'dcm analyze lib',
      'dcm check-unused-code lib',
      'melos analyze',
      'melos format --set-exit-if-changed',
      'melos --sdk-path /opt/flutter analyze',
      'melos exec --fail-fast -- flutter analyze',
    ],
  ],
  [
    'tests',
    [
      'fvm flutter test',
      'fvm spawn 3.24.0 test',
      'flutter -d macos test integration_test',
      'flutter test --coverage test/widget_test.dart',
      'flutter drive --driver=test_driver/integration_test.dart --target=integration_test/app_test.dart',
      'dart test -p chrome',
      'dart run test',
      'flutter pub run test',
      'dart run build_runner test',
      'dart test/widget_test.dart',
      'dart run test/widget_test.dart',
      'dart run coverage:test_with_coverage',
      'dart pub global run melos run test',
      'patrol test -t patrol_test/app_test.dart',
      'very_good test --coverage',
      'xvfb-run flutter test',
      'melos exec -c 2 -- "flutter test --coverage"',
    ],
  ],
  [
    'build',
    [
      'dart run build_runner build --delete-conflicting-outputs',
      'dart run build_runner clean',
      'flutter build --flavor prod appbundle',
      'flutter build ipa --export-options-plist=ios/ExportOptions.plist',
      'flutter clean',
      'flutter gen-l10n',
      'dart compile exe bin/main.dart -o build/app',
      'dart compile js web/main.dart',
      'dart doc',
      'patrol build android',
      'melos clean',
      'flutter pub run flutter_launcher_icons',
      'dart run flutter_native_splash:create',
      'dart run pigeon --input pigeons/api.dart',
      'flutter packages pub run build_runner build',
      'flutter pub get',
      'flutter packages get',
      'dart run melos bootstrap',
      'fvm dart pub get',
      'dart pub add --dev build_runner',
      'flutter pub upgrade --major-versions',
      'dart pub global activate melos',
      'dart pub cache repair',
      'flutter create my_app',
      'dart create -t console cli',
      'flutter upgrade',
      'flutter precache --ios',
      'flutter channel stable',
      'melos bootstrap',
      'melos bs',
      'fvm exec melos bootstrap',
      'very_good create flutter_app my_app',
      'very_good packages get --recursive',
      'fvm install 3.24.0',
      'fvm use 3.24.0',
    ],
  ],
  [
    'exploring',
    [
      'flutter pub outdated',
      'dart pub deps --style=compact',
      'dart pub workspace list',
      'dart pub cache list',
      'dart pub global list',
      'dart pub token list',
      'flutter channel',
      'fvm list',
      'fvm releases',
      'flutter doctor -v',
      'flutter devices',
      'dart info',
      'flutter config',
      'flutter config --list',
      'flutter emulators',
      'melos list --long',
      'genhtml coverage/lcov.info -o coverage/html',
      'lcov --summary coverage/lcov.info',
      'flutter pub global run coverage:format_coverage --lcov -i coverage -o coverage/lcov.info',
      'flutter --version',
    ],
  ],
  [
    'running',
    [
      'melos version',
      'melos version --yes',
      'melos publish --no-dry-run',
      'flutter pub run build_runner watch',
      'dart run build_runner serve web:8080',
      'flutter pub publish --dry-run',
      'dart pub publish',
      'flutter run -d chrome',
      'flutter -d emulator-5554 run',
      'flutter attach',
      'flutter emulators --launch Pixel_8',
      'flutter install',
      'flutter logs',
      'dart run bin/server.dart',
      'dart bin/server.dart',
      // The package's own executable, by its name in pubspec.yaml.
      'dart run my_cli serve',
      'dartaotruntime build/app.aot',
      './tool/generate.dart',
      'flutterfire configure',
      'shorebird release android',
    ],
  ],
  [
    'unclassified',
    [
      'flutter config --enable-web',
      'fvm global 3.24.0',
      'dart pub token add https://pub.example',
      // A dependency's executable awf has no rule for, as with npx.
      'dart run frobnicate --all',
    ],
  ],
];

describe('rules', () => {
  for (const [phase, commands] of [...CASES, ...REVIEW_CASES, ...GAP_CASES, ...DART_CASES]) {
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
    expect(byName('pnpm dev')).toMatchObject({
      phase: 'running',
      tags: expect.arrayContaining(['by-name']),
    });
    expect(byName('make deploy-staging')).toMatchObject({ phase: 'running' });
    expect(byName('just dev')).toMatchObject({ phase: 'running' });
    expect(byName('make frobnicate')).toMatchObject({ phase: 'unclassified' });
    expect(byName('just analyze')).toMatchObject({
      phase: 'lint',
      tags: ['by-name', 'task:analyze'],
    });
    expect(byName('make gen')).toMatchObject({ phase: 'build' });
  });

  it('reads a build script that rewrites path aliases after tsc as one build', () => {
    const app = new Classifier(
      defaultRules(),
      memoryFiles({
        '/app/.git/HEAD': 'ref: refs/heads/main\n',
        '/app/package.json': JSON.stringify({
          scripts: { build: 'tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json' },
        }),
      }),
    );
    const info = app.command('pnpm build', '/app');
    expect(info.phase).toBe('build');
    expect(info.tags.filter((t) => t.startsWith('unmatched:'))).toEqual([]);
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
    ['docker run --rm node:22 npm test', 'running'],
    ['open coverage/index.html', 'unclassified'],
    ['tsc', 'build'],
    ['git push origin main', 'running'],
    // A CLI's own `test` subcommand isn't package:test, and watching isn't building.
    ['dart run bin/cli.dart test', 'running'],
    ['dart run my_cli test', 'running'],
    ['dart run build_runner watch', 'running'],
    ['melos version', 'running'],
    ['flutter emulators --create', 'running'],
  ] as Array<[string, PhaseId]>)('%s is %s', (command, phase) => {
    check(command, phase);
  });

  it('counts adding build_runner as an install, not a build_runner run', () => {
    const info = check('dart pub add --dev build_runner', 'build');
    expect(info.tags).toContain('install');
    expect(info.checks.map((c) => c.key)).toEqual(['build:install']);
  });

  it('gives each Dart and Flutter check its own key, so rework waits for the same one', () => {
    const key = (command: string) => classifier.command(command, '/repo').checks[0]?.key;
    expect(key('flutter analyze')).toBe('lint:flutter analyze');
    expect(key('dart analyze')).toBe('lint:dart analyze');
    expect(key('dart format .')).toBe('lint:dart format');
    expect(key('flutter test')).toBe('tests:flutter test');
    expect(key('dart run test')).toBe('tests:dart test');
    expect(key('flutter build apk')).toBe('build:flutter build');
    expect(key('dart run build_runner build')).toBe('build:build_runner');
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
    check("python3 - <<'PY'\nimport subprocess\nsubprocess.run(['pytest'])\nPY", 'running');
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
      tool('x', 'ExitPlanMode'),
      tool('en', 'EnterPlanMode'),
      tool('d', 'mcp__ide__getDiagnostics'),
      tool('u', 'mcp__browser__click'),
      tool('m', 'Monitor'),
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
      phase('x'),
      phase('en'),
      phase('d'),
      phase('u'),
      phase('m'),
    ]).toEqual([
      'exploring',
      'writing-code',
      'writing-tests',
      'planning',
      'planning',
      'waiting',
      'waiting',
      'planning',
      'lint',
      'unclassified',
      'running',
    ]);
  });
});

describe('browser and computer-use calls', () => {
  const call = (id: string, name: string, actions?: string[]): Step => ({
    id,
    parentId: null,
    kind: 'tool',
    tool: name,
    startMs: 0,
    endMs: 1,
    flags: [],
    ...(actions ? { actions } : {}),
  });
  const classified = classifier.session({
    id: 's',
    agent: 'claude-code',
    sources: ['transcript'],
    startMs: 0,
    endMs: 1,
    steps: [
      call('navigate', 'mcp__claude-in-chrome__navigate'),
      call('text', 'mcp__remote-devices__Claude_Browser__get_page_text'),
      call('screenshot', 'mcp__Claude_Browser__computer', ['computer:screenshot']),
      call('click', 'mcp__Claude_Browser__computer', ['computer:left_click']),
      call('wait', 'mcp__Claude_Browser__computer', ['computer:wait']),
      call('js', 'mcp__claude-in-chrome__javascript_tool', ['javascript_tool:javascript_exec']),
      call('server', 'mcp__Claude_Browser__preview_start'),
      call('look', 'mcp__claude-in-chrome__browser_batch', [
        'navigate',
        'computer:wait',
        'computer:screenshot',
      ]),
      call('act', 'mcp__claude-in-chrome__browser_batch', [
        'find',
        'computer:left_click',
        'computer:wait',
        'computer:screenshot',
      ]),
      call('waits', 'mcp__Claude_Browser__browser_batch', ['computer:wait', 'computer:wait']),
      call('unknown-batch', 'mcp__Claude_Browser__browser_batch'),
      call('access', 'mcp__computer-use__request_access'),
      call('cu-screenshot', 'mcp__computer-use__screenshot'),
      call('cu-wait', 'mcp__computer-use__wait'),
      call('cu-click', 'mcp__computer-use__left_click'),
      call('cu-act', 'mcp__computer-use__computer_batch', ['zoom', 'wait', 'type']),
      call('cu-look', 'mcp__computer-use__computer_batch', ['screenshot', 'wait', 'zoom']),
      call('other', 'mcp__Claude_Code_iOS_Simulator__control', ['control:tap']),
    ],
  });
  const step = (id: string) => classified.steps.find((s) => s.id === id);

  it('counts looking at a page as Exploring and acting on it as Running scripts', () => {
    for (const s of classified.steps) if (s.rule) hit.add(s.rule);
    expect(Object.fromEntries(classified.steps.map((s) => [s.id, s.phase]))).toEqual({
      navigate: 'exploring',
      text: 'exploring',
      screenshot: 'exploring',
      click: 'running',
      wait: 'running',
      js: 'running',
      server: 'running',
      look: 'exploring',
      act: 'running',
      waits: 'running',
      'unknown-batch': 'running',
      access: 'waiting',
      'cu-screenshot': 'exploring',
      'cu-wait': 'running',
      'cu-click': 'running',
      'cu-act': 'running',
      'cu-look': 'exploring',
      other: 'unclassified',
    });
  });

  it('gives a batch its highest-ranked call, keeping the others as tags', () => {
    expect(step('act')?.tags).toEqual(['exploring']);
    expect(step('cu-act')?.tags).toEqual(['exploring']);
    expect(step('look')?.tags).toEqual([]);
  });

  it('counts a call that only waits for the page as polling', () => {
    for (const id of ['wait', 'waits', 'cu-wait']) expect(step(id)?.tags).toEqual(['polling']);
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

describe('watching CI', () => {
  it('is polling, like a loop that waits for CI, not a test run', () => {
    for (const command of [
      'gh run watch 123 --exit-status',
      'until gh run view 123 --json status | grep -q completed; do sleep 30; done',
    ]) {
      const info = check(command, 'running');
      expect(info.tags).toContain('polling');
      expect(info.checks).toEqual([]);
    }
  });
});

describe('shell syntax from real sessions', () => {
  it("runs a variable's command when the variable was set earlier in the same command", () => {
    check('R=./.build/release/app; $R tree booted | tail -8', 'running');
    check('G="git -C /repo"; $G status; $G log -1', 'exploring');
    check('P="psql -h localhost -d app -At"; $P -c "select 1"', 'running');
    check('S=/tmp/s; T=$S/test.sh\n$T --all', 'running');
    expect(
      check(
        'CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; "$CH" --headless',
        'running',
      ).tags,
    ).not.toContain('unmatched:$CH');
    // Set from a command's output, or only for one command: not known.
    check('T=$(cat tool.txt); $T run', 'unclassified');
    check('X=pytest true; $X', 'unclassified');
  });

  it('keeps ${...} in one word', () => {
    const info = check(
      'for p in "a 1" "b 2"; do r=${p%% *}; gh run view ${p##* } -R o/$r; done',
      'exploring',
    );
    expect(info.tags.filter((t) => t.startsWith('unmatched:'))).toEqual([]);
  });

  it('skips calls of a function defined in the same command, in a substitution or inside an if', () => {
    check('st() { gh run view "$1" --json status; }; S=$(st 123); echo $S', 'exploring');
    check(
      'if command -v gtimeout >/dev/null; then\n  run() { pytest -q; }\nelse\n  run() { pytest; }\nfi\nrun',
      'tests',
    );
  });

  it("reads an array's values as values, not as a subshell", () => {
    check(
      'ARGS=(-instr-profile "$P" -object "$B"); OBJECTS+=("$x"); llvm-cov report "${ARGS[@]}"',
      'exploring',
    );
    check('A=(x $(pytest -q) y)', 'tests');
  });

  it('finds a heredoc after a comment with an apostrophe in it, as scripts have', () => {
    check(
      "# the role's password, set from Python\ncat > \"$F\" <<'PY'\nimport os\nENVS = ['prod', 'test']\nPY\npython3 -I \"$F\"",
      'running',
    );
  });

  it('ignores what masking left behind: a masked value, a heredoc placeholder', () => {
    check('VITE_TOKEN= ‹masked› DEV=1 ./scripts/start.sh web', 'running');
    check('IFS="|" read A B <<< "$pair"\n‹19 lines›', 'unclassified');
  });
});

describe('unknown parts, polling and tricky syntax', () => {
  it('lets a script or an unknown part outrank the near-instant phases, but not a check', () => {
    check('ls dist && node scripts/size.js', 'running');
    check('python3 report.py | grep total', 'running');
    check('python3 gen.py && pnpm exec vitest run', 'tests');
    check('cat data.json | python3 -m json.tool', 'exploring');
    check('mkdir -p out && frobnicate --all', 'unclassified');
    check('frobnicate --all | grep total', 'unclassified');
    // A program awf can't name could have been the slow part: it stays unclassified.
    check('python3 gen.py && frobnicate --all', 'unclassified');
  });

  it('treats waiting loops and long sleeps as polling, Running scripts, unless a check runs', () => {
    const polling = (command: string) => {
      const info = check(command, 'running');
      expect(info.tags).toContain('polling');
      expect(info.rule).toBe('polling');
    };
    polling('until curl -sf localhost:3000; do sleep 2; done');
    polling('while ! grep -q ready app.log; do sleep 1; done');
    polling('sleep 30 && gh run view 123');
    polling('until frobnicate --ready; do sleep 5; done');
    check('sleep 1 && ls', 'exploring');
    check('for i in 1 2 3; do sleep 5; pnpm exec vitest run; done', 'tests');
  });

  it('skips case patterns and calls of functions defined in the same line', () => {
    check('case "$s" in done|ok) echo yes;; *) ls -la;; esac', 'exploring');
    check('q() { psql -h db -c "$1"; }; q "select 1"', 'running');
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
