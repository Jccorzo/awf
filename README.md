# awf

Find the build, test and lint tax on your coding agents.

awf (agent waterfall) shows where a coding agent's time went, by phase: writing code, writing tests, lint and format, running tests, building, rework, exploring, running scripts, planning and waiting on you. It reads Claude Code sessions (and Codex CLI, Gemini CLI and OpenCode ones), sorts every step into a phase, finds rework after failed checks, and draws each session as a one-file HTML waterfall. It runs only on your machine and sends nothing anywhere.

```text
$ awf summary last
Session 4045beec · 2026-10-28 23:34 · 9.9s · ~/demo
Task: The sum test fails. Fix it.

Running tests           1.9s ·  20% · 2 runs, 1 failed
Rework                  1.8s ·  18% · 1 edit after 1 failed check
Exploring               2.7s ·  27% · 2 calls
Planning and answering  3.5s ·  35%
Waiting on you          0 ms ·   0%
Unclassified            0 ms ·   0%
Total                   9.9s · 100% · 6 model calls, 5 tool calls, 1 failure
```

## Install

awf needs Node 20 or later. Until it's on npm, build it from this repository:

```bash
pnpm install && pnpm build
```

That writes `dist/awf.mjs` (the CLI: `node dist/awf.mjs`, or link it as `awf`) and the Claude Code plugin's scripts in `plugin/`.

**The plugin** records every new Claude Code session through hooks and adds `/awf:waterfall`, which opens the current session's report. Try it for one session with `claude --plugin-dir plugin`, or install it from a plugin marketplace that lists this repository. Without the plugin, awf still reads past sessions from their transcripts.

## Use

```bash
awf import                      # read past sessions (all four agents), read-only
awf sessions                    # list them, newest first
awf summary last                # one line per phase
awf report last --open          # the HTML waterfall
awf report last --share         # a copy with phases, durations and tool names only
awf compare 14d..7d 7d          # this week against last week, phase by phase
awf stats --since 30d           # Bash time by phase, and what has no rule yet
```

Every command takes `--help` and `--json`. A session is an ID or its first characters, `last`, or the path of a transcript.

| Command              | What it does                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sessions`           | Sessions with start time, duration, turns and tool calls                                                           |
| `import`             | Reads past sessions from Claude Code, Codex CLI, Gemini CLI and OpenCode into awf's cache                          |
| `classify`           | Every step of a session with its phase and the rule that decided it                                                |
| `summary`            | Time per phase, with check runs, failures and rework                                                               |
| `report`             | One self-contained HTML waterfall: phases, every step on a time axis, failures, rework, slowest steps, build tasks |
| `compare`            | Two sessions or two date ranges side by side                                                                       |
| `stats`              | Bash time by phase across sessions, and the unclassified programs that need rules                                  |
| `statusline`         | One short line for Claude Code's status line: the current session's phase split so far                             |
| `live`               | A board of every active Claude Code session, redrawn in place: project, task, state and phase split                |
| `sample`, `accuracy` | Check the classifier against your own labels                                                                       |
| `doctor`             | What awf can read, and log entries it doesn't recognise                                                            |
| `purge`              | Deletes everything awf stored                                                                                      |

## Status line

`awf statusline` puts the current session's phase split in Claude Code's status line, updated as the session goes:

```text
tests 3% · build 32% · scripts 26% · 9 failed · rework 9s
```

It shows Running tests, always and first, then the phases that took the most time so far (three phases in all), then failed lint, test and build runs, and rework time when rework isn't one of the phases shown. Pin other phases with `--pin` (`--pin tests,build`), or none with `--pin none` for only the top three. Shares are of the time the agent worked, without Waiting on you, so they hold still while you're away. Phase names are short: code, test code, lint, tests, build, rework, explore, scripts, plan and unclassified, coloured as in the report (`NO_COLOR=1` turns colours off).

To set it up, add a `statusLine` to `~/.claude/settings.json`, with the path to your build:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/awf/dist/awf.mjs statusline",
    "padding": 0
  }
}
```

Claude Code sends the session's `transcript_path` on stdin; awf reads that transcript (and the plugin's recorded events, when there are any) and keeps the line in `~/.awf/cache/statusline/` until the transcript changes, so a repeat costs about 30 ms. Reading a long session again takes as long as `awf summary` does (0.4s for an 8 MB transcript). It never breaks the status line: on any error it prints nothing and exits 0; run it with `AWF_DEBUG=1` to see the error. Try it by hand with:

```bash
echo '{"transcript_path": "'"$(ls -t ~/.claude/projects/*/*.jsonl | head -1)"'"}' | node dist/awf.mjs statusline
```

## Live board

`awf live` shows every active Claude Code session at a glance, in a terminal tab you leave open. It reads the transcripts, so it shows the desktop app's sessions too, where the status line never appears:

```text
awf live · 4 active · every 20s · 22:41
acme-billing/web   CI pipeline for demo-000…    working     tests 35% · build 33% · explore 12% · 12 failed
deploys            Cache key rollout…           your turn   tests 4% · scripts 57% · explore 23% · rework 14m
notes-website      how does this work…          working     tests 18% · scripts 24% · code 15% · 10 failed
acme-billing/api   PR checks for …              idle 12m    tests 0% · unclassified 52% · explore 24%
```

It lists the sessions whose transcript, or a subagent's transcript, changed in the last 2 hours (`--since`), newest first, at most 10 (`--limit`). Each row has the folder the session started in (relative to your home, without `Documents` and other folders that only hold projects), the session's title or first prompt, its state, and the status line's phase split (`--pin` works as it does there). The state comes from the end of the transcript:

- **working**: a turn is under way (a model or tool call is open), or background tasks or subagents it started are still running.
- **approval?**: a permission prompt is waiting. Only the awf plugin's recorder sees these; without it, a call waiting for your approval reads as working.
- **your turn**: the turn ended, or a question waits for your answer.
- **idle 12m**: your turn for 5 minutes or more.

When the session's process exits (you quit it, or the app restarts it), whatever it was running ends with it, and the row shows your turn.

The board is redrawn in place every 20 seconds (`--every`), fitted to the terminal's width, until Ctrl-C. Phase lines share the status line's cache, so a pass reads only the sessions that changed. The first pass reads every session: 1.9s for 10 sessions and 53 MB of transcripts, showing the rows at once and filling in phase lines as they come. A pass with nothing changed takes about 5 ms. `--once` prints one pass and exits, as it does when the output isn't a terminal; `--json` prints that pass as JSON. A transcript awf can't read is left off the board, and a session whose phase split can't be worked out shows without one (`AWF_DEBUG=1` says why).

## Phases and rules

Every instant of a session gets exactly one phase, so phase times add up to the session's time. A Bash command is classified by what it really runs: `npm run test` by its script, `make lint` by its recipe, `./gradlew check` by its tasks, `fastlane <lane>` by the lane's actions, `git commit` by its pre-commit hook, `git push` by its pre-push hook. Commands that run something other than a check, an edit or a read (scripts, the app and its servers, `curl`, databases, deploys, `git push`, polling loops) are Running scripts. Browser and computer-use calls are Exploring when they only look at a page or the screen, and Running scripts when they act on it. A failed check is read from its exit code when the exit code is the check's own, and from its output when a pipe hid it. Edits after a failed check, until the same check passes, are Rework. [docs/phases.md](docs/phases.md) has every rule.

Teach awf your own scripts and tools in `.awf/rules.yaml` in your repo, in the format of [src/classify/default-rules.yaml](src/classify/default-rules.yaml). Your rules come first: one that matches a command decides before awf reads the script it runs, so `{ phase: tests, program: test.sh }` makes `./scripts/test.sh` a test run even if it builds first, and `{ phase: tests, match: '(^|/)scripts/e2e-.*\.sh' }` names scripts by path. A command follows the rules of the repo it runs in, so `cd ../ios && ./scripts/test.sh` from a session started in another folder still uses the iOS repo's rules. `awf stats` lists the unclassified programs worth a rule; `awf stats --phase tests` shows which commands a phase's time went to.

**Build drill-down.** Run builds with their timing output on (`cargo build --timings`, `./gradlew --profile`, `xcodebuild -showBuildTimingSummary`, `bazel build --profile=…`, `dotnet build -clp:PerformanceSummary`) and the report nests each build's slowest tasks under its bar. See [docs/build-drilldown.md](docs/build-drilldown.md).

**Other agents.** Codex CLI, Gemini CLI and OpenCode sessions get the same phases and report. See [docs/other-agents.md](docs/other-agents.md) for what's read and what's approximate.

## What awf reads and writes

awf makes no network calls: lint forbids network code in `src/`, the tests run with the network blocked, and the report's page blocks every request.

**Reads, never changes:**

- Claude Code transcripts: `~/.claude/projects/**/*.jsonl` (or `$CLAUDE_CONFIG_DIR/projects`)
- Codex CLI sessions: `~/.codex/sessions/` (or `$CODEX_HOME/sessions`)
- Gemini CLI chats: `~/.gemini/tmp/*/chats/`
- OpenCode storage: `~/.local/share/opencode/storage/` (or `$XDG_DATA_HOME/opencode/storage`)
- In your projects, to classify commands: `package.json`, Makefiles, `deno.json`, `.awf/rules.yaml`, git hooks, shell scripts a command runs
- Build timing reports a build wrote: `target/cargo-timings/`, `build/reports/profile/`, a `--profile` file

**Writes, only under `~/.awf/`** (or `$AWF_HOME`):

- `events/<session>.jsonl`: the plugin's recorder, one line per hook event: event name, time, tool name, Bash command or file path, the action names of a browser call (`screenshot`, `left_click`), success or failure. Never prompts, tool output, URLs or typed text. Secrets in commands are masked.
- `imported/<session>.json`: `awf import`'s cache of timings, so your history outlives the agents deleting old logs. No prompts or output.
- `reports/<session>.html`: reports, unless you pass `--out`.
- `cache/statusline/<session>.json`: the status line's last line for a session and the transcript size and time it was made from, shared by `awf live`. Lines of sessions untouched for 30 days are deleted.

**The full report** shows commands, file paths, the first prompt and tool output from the transcript, with secrets masked. Keep it to yourself; `--share` makes a copy with phases, durations and tool names only.

**Remove everything:** `awf purge --yes` deletes `~/.awf/`. Uninstall the plugin in Claude Code. Agents' own logs are never touched.

## Develop

```bash
pnpm test                 # unit, fixture and browser tests, network blocked
pnpm lint                 # ESLint (with the no-network rule), Prettier, tsc
pnpm build                # dist/awf.mjs and the plugin's scripts
pnpm awf <command>        # build the CLI and run it
pnpm report:screenshots   # every fixture's report, light and dark, laptop and phone
```

[PLAN.md](PLAN.md) is the build plan, with each milestone's checks. Fixtures in `fixtures/` are scrubbed or hand-made; real sessions stay in `fixtures/raw/`, which git ignores.

## Licence

MIT
