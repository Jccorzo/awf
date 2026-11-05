# Agent Phase Waterfall: Build Plan

Exported from the build plan doc on 2026-10-28. Tick a box only when its check passes.

## Goal and scope

Version 1 is a free, local command-line tool that turns a Claude Code session into a static waterfall of where the time went: writing code, writing tests, linting, running tests, building and rework.

The tool is **awf** (agent waterfall), published on npm as `agent-waterfall`. It's built with Claude Code and tested on the sessions that build it.

**In v1**

- Records each new Claude Code session through hooks, with start and end times for every step.
- Imports past sessions from Claude Code's transcript files, read-only, so you have history from day one.
- Sorts every step into a phase, using rules you can extend per repo.
- Detects rework: edits made after a failed lint, test or build.
- Writes a one-file HTML report, a terminal summary and a JSON export.

**Not in v1**

- Live or animated views.
- Team dashboards or any upload.
- Agents other than Claude Code. Milestone 6 adds Codex CLI, Gemini CLI and OpenCode.

**v1 is done when it**

- [x] Parses every one of your own sessions from the last 30 days without crashing.
- [x] Leaves at most 10% of Bash time "unclassified" on those sessions.
- [x] Opens the report for a 1-hour session in under 2 seconds, offline.
- [x] Makes zero network calls, enforced by a test.

## Stack and key decisions

Build it in TypeScript, capture live sessions through Claude Code hooks, and keep everything in local files.

| Decision | Choice | Why |
|---|---|---|
| Language | TypeScript on Node 22 | One language for the recorder, the CLI, the report and a later Claude Code mod, since mods are written in JavaScript or TypeScript. |
| Live capture | Claude Code hooks, shipped in a plugin | Documented events that carry the session ID and transcript path. They work in the terminal, the Desktop app and `claude -p` runs. |
| Past sessions | Best-effort transcript importer | Claude Code's docs say the transcript format is internal and changes between versions. So the importer is isolated and tested per version. Transcripts are kept 30 days by default. |
| Phase rules | YAML: built-in defaults plus `.awf/rules.yaml` per repo | Teams add their own scripts and build tools without code changes. |
| Report | One self-contained HTML file: TypeScript and SVG, bundled with esbuild | Opens offline, can be attached to an email, needs no server. |
| Storage | Plain JSONL files in `~/.awf/` | Nothing to install, easy to inspect, easy to delete. |
| Tests | Vitest, snapshot fixtures, Playwright screenshots | Every rule change is checked against real sessions with their content removed. |
| Distribution | npm package (`agent-waterfall`, command `awf`) plus a Claude Code plugin | The plugin installs the hooks and a `/waterfall` command in one step. |
| Licence | MIT | Common for tools in this space and easy to adopt at work. |

**Assumptions**

- Users need Node to run the CLI. A single-file binary can come later if that's a barrier.

## Architecture

Every source is turned into the same list of steps; the classifier labels each step with a phase, and the reports read only labelled steps.

```text
Hooks recorder ──────┐
Transcript importer ─┼──> Step model ──> Phase classifier ──> Rework detector ──┬──> HTML waterfall
Other agents (v1.1) ─┘    (one row per    (built-in rules +    (edits after a     ├──> Terminal summary
                           model turn or   .awf/rules.yaml)     failed check)      └──> JSON and share export
                           tool call)
```

Adding another agent means writing one adapter. The classifier and the reports don't change.

**How the recorder gets its timings**

| Hook event | What awf records |
|---|---|
| `UserPromptSubmit` | A turn starts, so model time starts |
| `PreToolUse` | A tool call starts, with its tool, command or file path |
| `PermissionRequest` | The call needed your approval, so its time includes waiting on you |
| `PostToolUse` / `PostToolUseFailure` | The call ends, with success or failure |
| `PostToolBatch` | Parallel calls are done, so model time starts again |
| `SubagentStart` / `SubagentStop` | Steps in between nest under that subagent |
| `Stop` | The turn ends |
| `SessionEnd` | Saves the transcript path, for details such as tokens and output |

The recorder hooks run asynchronously, so recording doesn't add the delay it measures.

**Phases**

| Phase | What counts |
|---|---|
| Writing code | Model time before an Edit or Write on a source file, plus the edit |
| Writing tests | The same on test files: `*_test.go`, `*.spec.ts`, `test_*.py`, `src/test/`, `Tests/` |
| Lint and format | eslint, prettier, ruff, black, golangci-lint, cargo clippy, cargo fmt, ktlint, detekt, swiftlint, dotnet format, `tsc --noEmit` |
| Running tests | jest, vitest, pytest, go test, cargo test, gradle test, mvn test, dotnet test, xcodebuild test, bazel test |
| Build | tsc, vite build, go build, cargo build, gradle assemble, mvn package, dotnet build, msbuild, xcodebuild build, bazel build, make, cmake --build |
| Rework | Code or test edits after a failed check, until that check passes |
| Exploring | Read, Grep, Glob, web search, and the model time before them. Browser and computer-use calls that only look at a page or the screen (added 2026-10-29) |
| Running scripts | Running something that isn't a check, an edit or a read: scripts, the app and its servers, HTTP calls, databases, containers, deploys, `git push` and CI actions, and polling loops. Browser and computer-use calls that act on a page or the screen. Added 2026-10-29 |
| Planning and answering | Model time that ends without a tool call |
| Waiting on you | Approval prompts, computer use asking for access, and idle gaps |
| Unclassified | Anything no rule matches. Shown as is, never guessed |

**Attribution rules**

1. Model time goes to the phase of the tool call it produced.
2. A compound command such as `npm run lint && npm test` takes the highest-ranked phase, in the order build, tests, lint. The others stay as tags.
3. `npm run <script>`, `make <target>` and Gradle tasks are resolved to what they actually run before classifying.
4. A failed check is detected from the failure event, the exit code, or output patterns kept in the rules file.

## Setting up the repo for Claude Code

Set the repo up once, so every Claude Code session starts with the rules, the checks and the sample data it needs.

**Repo layout**

```text
awf/
├── CLAUDE.md                 # what awf is, commands, hard rules
├── PLAN.md                   # this plan's milestones as checkboxes
├── .claude/
│   ├── settings.json         # permissions and this repo's own hooks
│   ├── skills/               # /next-step, /add-rule, /dogfood
│   └── agents/               # rules-reviewer, report-checker
├── plugin/                   # the awf plugin users install
│   ├── .claude-plugin/plugin.json
│   ├── hooks/hooks.json      # recorder hooks
│   └── skills/waterfall/     # the /waterfall command
├── src/
│   ├── recorder/  importers/  model/
│   └── classify/  rework/  report/  cli/
├── fixtures/
│   ├── raw/                  # your real sessions, gitignored
│   └── claude-code/          # scrubbed copies, committed
└── docs/                     # phases.md, transcript-format.md
```

**CLAUDE.md**

Keep it short. Claude reads it at the start of every session.

```markdown
# awf
Local CLI that shows where a coding agent's time goes, by phase.

## Commands
- pnpm test · pnpm lint · pnpm build
- pnpm awf report <session> --out /tmp/report.html

## Rules
- No network calls anywhere in src/. Lint enforces it.
- Real sessions stay in fixtures/raw/ (gitignored). Commit only scrubbed copies.
- Every classifier rule ships with a fixture test.
- The HTML report is one self-contained file.
- Phases are defined in docs/phases.md. Don't add new ones without asking.
- Work from PLAN.md. Tick a step only when its checks pass.
```

**Settings**

- Allow `pnpm test`, `pnpm lint`, `pnpm build` and `git` commands, so routine checks don't stop for approval.
- Deny `curl` and `wget`, and deny reading `~/.claude/projects/`. Real session data reaches Claude only through `fixtures/raw/`, which you fill by hand.
- Add a `PostToolUse` hook that runs Prettier on edited files. Keep this repo's hooks light, because awf will measure them.
- Optional: a `Stop` hook that runs the fast unit tests, so a turn can't end on failing tests.

**Skills (they become slash commands)**

- `/next-step`: reads PLAN.md, takes the first unticked step, proposes a plan, implements it after you approve, runs the checks, ticks the box and commits.
- `/add-rule <tool>`: adds classifier rules for one tool, with a fixture, a test and an update to `docs/phases.md`.
- `/dogfood`: runs awf on this repo's own recent sessions and reports the phase split and anything unclassified.

**Subagents**

- `rules-reviewer`: read-only. Reviews a classifier change and hunts for false positives, such as a `make` target that is really a test run.
- `report-checker`: renders each fixture's report with Playwright, looks at the screenshots and lists layout problems.

**Working rhythm**

1. One milestone per branch. Start each step in plan mode and approve the plan before any edits.
2. Commit after every green step, so a bad turn is one revert away.
3. Run `/clear` between steps. PLAN.md and CLAUDE.md carry the context forward.
4. Run `/dogfood` at the end of each milestone. From M1 on, the recorder is capturing the sessions that build awf.

## Milestones

v1 is M0 to M5, with three gates where you stop and check the numbers before going on; M6 is v1.1.

```text
Capture: M0 Repo setup, M1 Recorder, M2 Importer
  ◆ Gate A: data is flowing
Understand: M3 Phase classifier, M4 Rework and summary
  ◆ Gate B: numbers you trust
Show: M5 Static report and /waterfall
  ◆ Gate C: used daily for a week, then release v1
Extend (v1.1): M6 Build drill-down, more agents, compare sessions
```

Don't start a stage until the gate before it passes: a classifier built on bad timings, or a report built on a classifier you don't trust, has to be redone.

Each milestone has a prompt to paste into Claude Code.

### M0 · Repo and guardrails

```text
Create a TypeScript CLI project called awf (Node 22, pnpm, Vitest, ESLint, Prettier, esbuild).
Use the layout, CLAUDE.md and settings from PLAN.md, section "Setting up the repo".
Add an ESLint rule that fails on fetch, http, https and net imports anywhere in src/.
Stub the CLI: `awf --version` and `awf sessions` (prints "not implemented").
Make pnpm test and pnpm lint pass, then commit.
```

- [x] `pnpm test` and `pnpm lint` pass on a clean clone
- [x] A test proves the network rule fails on a sample file

### M1 · Recorder

```text
First read the Claude Code hooks reference and write docs/hook-events.md: the fields each
event gives us, and how a tool call made inside a subagent is identified.

Then build the recorder as a Claude Code plugin in plugin/. Add async command hooks for
UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure,
PostToolBatch, SubagentStart, SubagentStop, Stop and SessionEnd.
Each hook appends one JSON line to ~/.awf/events/<session_id>.jsonl: event name,
timestamp in ms, tool name, Bash command or file path, success or failure, transcript_path.
Never store prompts or tool output. Keep each hook under 50 ms, with a test that times it.

Implement src/model (Step: id, parentId, kind, tool, command, files, startMs, endMs, ok,
flags) and src/recorder, which turns an events file into steps.
`awf sessions` lists recorded sessions with start time and duration.
```

- [x] The plugin is installed and a real session produces an events file (checked with `claude -p --plugin-dir plugin`)
- [x] `awf sessions` shows the right duration, checked against your clock (9.86 s session = 15.32 s wall clock minus 4.87 s startup and 0.60 s teardown)
- [x] Hooks add no visible delay: about 3 ms of CPU on top of Node's start and the append, held under 15 ms so a run stays inside the 50 ms budget (test/recorder/hook.test.ts)

### M2 · Importer for past sessions

```text
I put 3 of my Claude Code transcripts in fixtures/raw/ (gitignored).
1. Study them and write docs/transcript-format.md: entry types, timestamps, how a tool
   call is paired with its result, how subagents and errors show up. Note the version.
2. Write scripts/scrub.ts: keep structure, timestamps, tool names and commands; replace
   prompts, file contents and output with placeholders; mask anything like a secret.
   Write scrubbed copies to fixtures/claude-code/.
3. Implement src/importers/claude-code: transcript to the same Step model. Count and
   report unknown entry types; never crash on them.
4. `awf import` reads every transcript under ~/.claude/projects/ and prints sessions,
   steps and unknown entries found.
Snapshot-test the steps for each scrubbed fixture.
```

- [x] All your sessions from the last 30 days import without a crash
- [x] For a recorded session, importer and recorder agree on total time within 5% (0.93% and 0.26% on two recorded sessions; test/importers/scrub-and-agree.test.ts)

**Gate A: data is flowing.** The recorder runs on your machine and your history is imported.

### M3 · Phase classifier

```text
Write docs/phases.md from the Phases table in PLAN.md, then implement src/classify.
Rules live in src/classify/default-rules.yaml; a repo can extend them in .awf/rules.yaml.
Cover the lint, test and build tools listed in PLAN.md, and test-file patterns for Go,
TypeScript, Python, Java/Kotlin, Swift and C#.
Resolve npm/pnpm scripts from package.json, make targets and Gradle tasks before classifying.
Split compound commands and apply the attribution rules in PLAN.md.
Anything no rule matches is "unclassified". Never guess.
Add `awf classify <session>` and `awf stats` (share of Bash time left unclassified).
One fixture test per rule. Then ask the rules-reviewer subagent to hunt for false positives.
```

- [x] `awf stats` shows at most 10% of Bash time unclassified on your sessions
- [ ] You hand-check 50 random steps and agree with at least 47 (your check: run `awf sample --n 50`)

### M4 · Rework and summary

```text
Implement src/rework: after a lint, test or build step fails, the edits and the model time
before them, until that same check passes or the session ends, count as rework for it.
Failure comes from the failure event, the exit code, or output patterns in the rules file
(FAILED, BUILD FAILED, error[) when the transcript has the output.
Add `awf summary <session>`: one line per phase with time, share, runs and failures, e.g.
"Build 6m 10s · 28% · 3 runs, 2 failed", plus Rework, Waiting on you and Unclassified.
Add --json to every command. Test on fixtures with known failures.
```

- [x] Phase times add up to the session's total time (by construction: one phase per instant; test/analyze/analyze.test.ts checks every fixture)
- [ ] On 5 sessions you remember, the rework numbers match what happened (checked on 1 session, the one that built M0 to M3: all 10 failures and their fixes match, except fixes made by a python3 heredoc script, which awf can't see as edits. 4 more are yours)

**Gate B: numbers you trust.** Both M3 and M4 checks pass on your own sessions.

### M5 · Static waterfall report and /waterfall

```text
Build `awf report <session> [--out file.html] [--share]`: one self-contained HTML file
(inline CSS, JS and SVG, no network). Static, no animation.
- Header: the task (first prompt, one line), total time, a stacked bar of phase totals,
  model calls, tool calls, failures.
- Left: a collapsible tree (session, subagents, steps), each row in its phase colour.
- Right: bars on one time axis with durations; failed steps red; the slowest step tagged.
- Click a row: command, files, result, duration; output only if the transcript has it,
  with secrets masked.
- Filters: phase chips and "failed only". Light and dark mode; works on a phone.
- --share keeps phases, durations and tool names only.
Add a /waterfall skill to the plugin that builds the report for the current session.
Then ask the report-checker subagent to render every fixture and fix what it finds.
```

- [x] A 1-hour session's report opens in under 2 seconds
  - `test/report/browser.test.ts`: a made-up session with an hour of work (20 turns, 1,088 steps) draws in about 0.2 s in headless Chromium, with no network requests. This session's own report (1 h 44 m, 652 steps) draws in 15 ms of script time.
- [ ] You can answer "why was that task slow?" from the report alone
  - Yours to judge: open `pnpm awf report last --open`. The report-checker's review was fixed: failed bars are red, squeezed idle gaps are labelled, slowest model steps say which call they were writing, folded turns show their split by phase, unclassified time names its programs, and phone rows show what ran. Model calls still don't show time to first token (the transcript doesn't record it).

**Gate C: you used it daily for a week.** Then release v1.

### M6 · v1.1: build drill-down, more agents, compare

```text
1. Build drill-down: when a step ran Gradle (--profile), Cargo (--timings), Bazel
   (--profile), MSBuild (-bl) or Xcode (-showBuildTimingSummary) with timing output on,
   nest its slowest tasks under the build bar. Start with the tool our users use most.
2. Importers for Codex CLI, Gemini CLI and OpenCode, into the same Step model,
   with one scrubbed fixture each.
3. `awf compare <a> <b>`: phase totals side by side for two sessions or two date
   ranges, for before/after checks.
```

- [x] Your main build tool shows its slowest tasks inside the waterfall
  - `cargo build --timings` puts its slowest crates under the build bar, with their real start times; checked with real Cargo 1.94 output. Xcode (`-showBuildTimingSummary`, real output), Gradle (`--profile`), Bazel (`--profile`) and MSBuild (`-clp:PerformanceSummary`) work too; the last three are tested on hand-made files. See docs/build-drilldown.md.
- [ ] One session from each new agent renders correctly
  - A hand-made session in each format (Codex CLI, Gemini CLI, OpenCode) imports, classifies (failed test, rework) and renders in the browser test. None of the three is installed here, so no real session was tried: import one of each with `awf import` and open `awf report <id> --open`.

### M7 · Dashboard across sessions

```text
Build `awf dash [--since 30d] [--project <dir>] [--out file.html] [--open] [--json]`: one
self-contained HTML file with every session: time by phase, by project (the repository a session
ran in) and over time, and a table of sessions that sorts and searches. Filters: phase chips with
presets (all, working time, only waiting on you), period, project, day/week/month, hours or
shares. The report's tokens, light and dark, and a phone layout. No prompts, commands or output.
```

- [x] It draws every session offline, and its filters work
  - `test/dash/browser.test.ts`: three sessions draw in headless Chromium with no requests and no errors; phase presets, a project, a period, sorting and search change what it shows; a phone screen doesn't scroll sideways. On one machine's 289 sessions it writes the page in about 12 s.
- [ ] You can answer "where did my agent's time go this month?" from it
  - Yours to judge: `awf import && awf dash --open`.

**After v1.1 (ideas, not committed):** a Claude Code mod that draws the waterfall in a pane while you work. Mods are JavaScript or TypeScript plugins that can draw panes in the terminal, the Desktop app and VS Code.

## Testing and validation

Trust comes from checking awf's numbers against real sessions, not only from passing unit tests.

| Check | How | When |
|---|---|---|
| Snapshot fixtures | Scrubbed real sessions with their expected steps, phases and summary | Every commit |
| Rule tests | One fixture per classifier rule, plus known false positives | Every commit |
| Labelled sample | `fixtures/labels.csv`: 200 Bash commands from your sessions with the phase you'd give each; awf reports its accuracy per phase | Every classifier change |
| Edge cases | Generated sessions with parallel tool calls, background Bash, subagents, interrupted tools, resumed and compacted sessions | Every commit |
| Format drift | The importer counts unknown entry types; `awf doctor` lists them with the Claude Code version | Every Claude Code update |
| Clock check | A recorded session's total against your own stopwatch, and recorder against importer | M1, M2, then monthly |
| Visual check | Playwright screenshots of every fixture report, light and dark, laptop and phone width | Every report change |
| No network | The lint rule, plus a test run with network access blocked | Every commit |

Use awf on the sessions that build awf. When a report surprises you, either awf is wrong, so add a fixture, or you learned something.

## Privacy and safety

awf works only on your machine and sends nothing anywhere; sharing is a separate, explicit step that strips content.

- **Local only.** No network code in v1, enforced by lint and tests. No telemetry.
- **Timing, not content.** The recorder stores event names, timestamps, tool names, commands and file paths. It never stores prompts or tool output.
- **Read-only on Claude Code's data.** awf reads transcripts but never changes or deletes them. It writes only to `~/.awf/`.
- **Secrets masked.** Tokens, API keys, passwords in environment assignments, connection strings and private keys are masked in the recorder and the report.
- **Output stays local.** The full report can show command output taken from the transcript. `--share` keeps only phases, durations and tool names.
- **Easy to remove.** `awf purge` deletes `~/.awf/`. The README lists exactly what awf reads and writes.

## Risks

The biggest risk is Claude Code changing what it records; capturing through hooks and testing the importer per version are the main defences.

| Risk | What happens | Mitigation |
|---|---|---|
| Transcript format changes | The importer breaks on new sessions | Hooks are the main source. The importer tolerates unknown entries, is tested per version, and `awf doctor` reports what changed |
| Approval waits counted as tool time | Steps look slower than they ran | `PermissionRequest` flags those calls, and the report shows that time as "Waiting on you" |
| Hooks slow the agent down | awf adds the delay it measures | Async hooks, a 50 ms budget and a test that times them |
| Scripts hide what really runs | Too much "unclassified" | Resolve npm scripts, make targets and Gradle tasks; per-repo rules; show unclassified time as is |
| Transcripts deleted after 30 days | No history | The recorder's own event files don't expire |
| Seen as surveillance | Teams won't install it | No per-person views; share exports carry no content |

## Sources

- [Claude Code docs: manage sessions](https://code.claude.com/docs/en/sessions) (transcript location, format and 30-day retention)
- [Claude Code docs: hooks guide](https://code.claude.com/docs/en/hooks-guide) (events, matchers, where hooks live)
- [Claude Code docs: mods overview](https://code.claude.com/docs/en/plugins/mods/overview) (panes inside Claude Code)
- [Claude Code docs map](https://code.claude.com/docs/en/claude_code_docs_map.md) (skills, subagents, plugins)
- [Claude Code issue #90811](https://github.com/anthropics/claude-code/issues/90811) (request for time usage by phase)

