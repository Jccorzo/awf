# Contributing to awf

The most useful contribution is a classifier rule for a tool awf gets wrong. See [Add a classifier rule](#add-a-classifier-rule). If you work with a coding agent, [AGENTS.md](AGENTS.md) gives it the rules below.

## Setup

You need Node 22, and pnpm through corepack. Corepack uses the pnpm version in `package.json`'s `packageManager` field.

```bash
corepack enable
pnpm install --frozen-lockfile
```

`.node-version` holds 22, the version this repo is developed on. Version managers such as fnm pick it up in this folder. It doesn't limit users: awf runs on Node 20 or later (`engines` in `package.json`), and CI builds it on both 20 and 22, on Linux and macOS. CI runs the tests once, on macOS with Node 22, so a pass on a Mac can stand in for them (see [hushrun.yaml](hushrun.yaml)). Vitest no longer supports Node 20, though the suite passes on 20.19 and later today.

## Commands

| Command                                 | What it does                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                             | Unit, fixture and browser tests, with the network blocked                                                            |
| `pnpm test test/classify/rules.test.ts` | One test file                                                                                                        |
| `pnpm test:watch`                       | Tests in watch mode                                                                                                  |
| `pnpm lint`                             | ESLint (with the no-network rule), Prettier, tsc                                                                     |
| `pnpm format`                           | Prettier, writing its fixes                                                                                          |
| `pnpm build`                            | `dist/awf.mjs` and the plugin's scripts                                                                              |
| `pnpm awf <command>`                    | Builds the CLI and runs it: `pnpm awf report <session> --out /tmp/report.html`                                       |
| `pnpm scrub`                            | Scrubbed copies of `fixtures/raw/`, see [Real session fixtures](#real-session-fixtures)                              |
| `pnpm report:sample`                    | Rewrites `docs/sample-report.html` and its screenshots from a made-up session; run it when the report's look changes |
| `pnpm report:screenshots`               | Every fixture's report, light and dark, laptop and phone                                                             |

## Repo rules

- **No network in `src/`.** awf sends nothing anywhere. An ESLint rule forbids network code in `src/`, and the tests run with the network blocked.
- **Real sessions are never committed.** They stay in `fixtures/raw/`, which git ignores. Commit only scrubbed copies.
- **Every classifier rule has a fixture test.** A test fails when a rule has no case.
- **The report is one self-contained file.** Styles and scripts are inline, and the page loads nothing.
- **Phases need discussion first.** They're defined in [docs/phases.md](docs/phases.md). Open an issue before adding one.

## Add a classifier rule

If you use Claude Code, `/add-rule <tool>` runs these steps. Otherwise:

1. Read [docs/phases.md](docs/phases.md) and [src/classify/default-rules.yaml](src/classify/default-rules.yaml). Pick the existing phase the tool belongs to. If none fits, stop and open an issue.
2. List the tool's real command shapes:
   - the plain command
   - wrappers: `npx`, `pnpm exec`, `uv run`, wrapper scripts like `./gradlew`
   - subcommands that belong to a different phase
   - flags that change the phase: `tsc --noEmit` is lint, `tsc` is build
3. Add the rules to `src/classify/default-rules.yaml`, next to tools of the same phase. Within a section the first match wins, so specific rules go first. The comment at the top of the file explains each field, and [docs/rules.md](docs/rules.md) has more.
4. Add cases to `test/classify/rules.test.ts`:
   - one per command shape, in the `CASES` table under the phase
   - at least one known false positive that must not match, in `known false positives`
5. If the tool reports failures in its output, add a pattern under `failurePatterns` in the rules file, and a test in `test/classify/session.test.ts`.
6. Add the tool to its phase's list in `docs/phases.md`.
7. Check it and commit, with the rebuilt bundle:

   ```bash
   pnpm test
   pnpm lint
   pnpm build
   git add plugin/scripts
   ```

The `coverage` test in `test/classify/rules.test.ts` fails with `rules without a fixture` if a rule has no case.

To see a rule work on a session, run `pnpm awf classify <session>`. It prints each step's phase.

`default-rules.yaml` is for tools other people use too. A script only your project has goes in that project's `.awf/rules.yaml`. See [docs/rules.md](docs/rules.md).

## Real session fixtures

`fixtures/claude-code/<name>/` holds scrubbed real sessions. The importer tests pick up every folder there. Name a fixture `cc-<Claude Code version>-<what happens>`, like `cc-2.1.312-test-fix`.

To add one:

1. Pick a short session with nothing private in it, and copy it to `fixtures/raw/<name>/`, which git ignores:

   ```text
   fixtures/raw/<name>/<session-id>.jsonl
   fixtures/raw/<name>/<session-id>/subagents/agent-<id>.jsonl
   fixtures/raw/<name>/events/<session-id>.jsonl
   ```

   The transcript and any subagents come from `~/.claude/projects/<project>/`. The plugin's events, if there are any, come from `~/.awf/events/`.

2. Run `pnpm scrub`. It scrubs every folder in `fixtures/raw/` into `fixtures/claude-code/`, with the same layout, and replaces earlier output.
3. Review the result, as below.
4. Run `pnpm test`, and commit the fixture and the snapshot it adds to `test/importers/__snapshots__/`. CI doesn't write snapshots, so a missing one fails there.

Run `pnpm scrub` as yourself: it takes your home folder from the OS to replace it in paths.

### What scrubbing does

| Kept                                                                | Replaced                                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Structure, timestamps, IDs, tool names, models, agent versions      | Prompts, assistant text and file contents: `‹text›`                                        |
| Commands, with heredoc bodies dropped and secrets as `‹masked›`     | Thinking: `‹thinking›`                                                                     |
| File paths and working folders, with your home as `/Users/user`     | Tool output: `‹output›`, keeping only a first line with an exit code or background task ID |
| Your user name as `user`, wherever it's a whole word in what's kept | Any string in a field not on the keep list, so a new field is dropped by default           |
| Browser action names                                                | Git branches: `main`                                                                       |

Files under `events/` get their paths replaced and their commands masked again, on top of the masking the recorder did when it wrote them.

### Review before you commit

Scrubbing keeps commands and paths, so project names, customer names and internal hosts survive it. List everything that's left, and edit by hand what shouldn't be public:

```bash
grep -rhoE '"(command|cmd)":"[^"]*"' fixtures/claude-code/<name>
grep -rhoE '"(cwd|tp|files|file_path|filePath|path|notebook_path)":[^,}]*' fixtures/claude-code/<name> | sort -u
```

Running `pnpm scrub` again overwrites hand edits, so clear a session's folder from `fixtures/raw/` once its fixture is done.

### When the tests fail on a fixture

- `unknownEntries` isn't empty: the session has an entry type the importer doesn't know. See [When a transcript format changes](#when-a-transcript-format-changes).
- `recorder and importer agree` fails: a fixture with `events/` must match its transcript, with total time within 5% and the same tool calls. Include both whole, or leave `events/` out.

### Trying it without a real session

Name an input folder, and pass `--out` so the copies don't land in `fixtures/claude-code/`.

```bash
pnpm scrub fixtures/claude-code --out /tmp/scrub-check
```

### Other agents' logs

`pnpm scrub` is for Claude Code transcripts. It reads only `.jsonl` files, so it skips Gemini and OpenCode logs. It reads Codex logs but drops their commands, which turns most of the session into Unclassified. The fixtures in `fixtures/codex`, `fixtures/gemini` and `fixtures/opencode` are hand-made.

To share a real log's structure without its content, keep the keys and `type` values and replace everything else:

```bash
jq -c 'def shape: if type == "object" then with_entries(if .key == "type" then . else .value |= shape end) elif type == "array" then map(shape) elif type == "string" then "x" elif type == "number" then 0 else . end; shape' <log file> > shape.json
```

Read `shape.json` before you share it. Keys can hold data too. OpenCode keeps each message in its own file, so run this on the ones that matter.

## Changing `src/`

`plugin/scripts/awf.mjs` and `plugin/scripts/record.cjs` are bundles of `src/`, committed so the plugin runs without npm. After any change to `src/`, `default-rules.yaml` included:

```bash
pnpm build
git add plugin/scripts
```

Tests fail if either bundle is stale, and CI runs `git diff --exit-code plugin/scripts` after building. `pnpm awf` rebuilds only `dist/`, not the plugin.

## Changing the pane

`plugin/hooks/panel.tsx` draws the pane beside the chat. It's written by hand and runs inside Claude Code, not Node, so it isn't bundled, and neither `pnpm test` nor CI reaches it. `plugin/types/index.d.ts` declares what it keeps in `$.state`. With Claude Code installed:

```bash
claude plugin validate plugin
claude plugin test plugin
```

The second runs `plugin/tests/`. Claude Code's plugin API is in early access and can change between releases, so check again after an update.

## Browser tests

`test/report/browser.test.ts` opens reports in Chromium, and `pnpm report:screenshots` writes screenshots to `test-results/screenshots/`. Both need Chromium:

```bash
pnpm exec playwright-core install chromium
```

Without it, the browser tests are skipped, not failed, so a passing `pnpm test` may not have run them. Check the summary for skipped tests. Playwright's error message suggests `pnpm exec playwright install`, which doesn't work here: only `playwright-core` is installed.

CI runs the browser tests in its Test job, macOS on Node 22. If you change `src/report/`, run them and look at the screenshots.

## When a transcript format changes

Agents don't promise a stable log format, and Claude Code's docs call its format internal. awf counts what it doesn't recognise, skips it and carries on. [docs/transcript-format.md](docs/transcript-format.md) has what awf reads from Claude Code, and [docs/other-agents.md](docs/other-agents.md) has the others.

After an agent update, check for drift:

```bash
pnpm awf import --since 7d
pnpm awf doctor
```

`awf import` reads recent logs and lists entries it doesn't recognise. `awf doctor` lists them for all imported sessions, with the Claude Code versions that wrote them.

To handle a new entry type:

1. Look at its structure, not its content: its type, keys and IDs.
2. Add it to `SKIPPED_TYPES` in `src/importers/claude-code/format.ts`. If it affects timings, read it in `src/importers/claude-code/import.ts` and add it to `READ_TYPES` instead. Other agents' importers are in `src/importers/`.
3. Add a test to `test/importers/claude-code.test.ts`, or a scrubbed fixture from that version.
4. Update `docs/transcript-format.md`, including its Version notes.
5. Check `src/importers/claude-code/scrub.ts`. New fields are dropped by default. Add a key to its keep list only if the importer needs it and it holds no content.
6. Run `pnpm build` and commit `plugin/scripts/`.

## Releasing

1. Set the new version in all three places. A test fails if they disagree.
   - `package.json`
   - `plugin/.claude-plugin/plugin.json`
   - `src/version.ts`
2. Run `pnpm build`. The CLI in `plugin/scripts/` holds the version.
3. In `CHANGELOG.md`, rename `Unreleased` to the version and date, and start a new `Unreleased`.
4. Commit, tag and push:

   ```bash
   git add package.json plugin src/version.ts CHANGELOG.md
   git commit -m "Release 0.1.0"
   git tag v0.1.0
   git push origin main v0.1.0
   ```

5. Publish. `prepublishOnly` runs lint and tests, and `prepack` builds the package.

   ```bash
   npm publish
   ```

Plugins installed from GitHub only update when the `version` in `plugin/.claude-plugin/plugin.json` changes. A commit to `plugin/` without a version bump doesn't reach them, so a plugin fix needs a release.
