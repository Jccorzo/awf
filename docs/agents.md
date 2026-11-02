# awf for agents

This page is for an agent using awf for its user. To work on awf itself, read [AGENTS.md](../AGENTS.md).

awf shows where a coding agent's time went, by phase. It reads session logs from Claude Code, Codex CLI, Gemini CLI and OpenCode, and makes no network calls. Every command takes `--help` and `--json`.

## Run it

awf needs Node 20 or later.

| Setup                        | Command                                                  | Install                                                                           |
| ---------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Claude Code with the plugin  | `awf <command>`                                          | `claude plugin marketplace add Jccorzo/awf`, then `claude plugin install awf@awf` |
| CLI installed                | `awf <command>`                                          | `npm install -g agent-waterfall`                                                  |
| Nothing installed            | `npx agent-waterfall <command>`                          | None                                                                              |
| Inside a skill of the plugin | `node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" <command>` | The plugin                                                                        |

The npm package is `agent-waterfall`, and the command it installs is `awf`. The package called `awf` on npm is an unrelated Alfred package, so with `npx` always use the full name.

`${CLAUDE_PLUGIN_ROOT}` works in a skill's text, where Claude Code fills it in. It isn't set in the Bash tool, so a command you write there can't use it. Use `awf`. A skill can use `${CLAUDE_SESSION_ID}` the same way, for the current session.

The examples below use `awf`. Use the form for your setup.

**The plugin's `bin/` folder.** Claude Code's docs say files in a plugin's `bin/` are on the Bash tool's PATH while the plugin is enabled. `plugin/bin/awf` uses that to give agents a bare `awf` with no npm install. The trade-off: claude.ai and Cowork don't install a plugin that has this directory. awf reads local transcripts and needs hooks, so Claude Code is what it targets.

## Name a session

`summary`, `classify` and `report` take one session. `compare` takes two.

| Form             | Example                                     | Meaning                                                                                         |
| ---------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ID               | `4045beec-4abe-4901-822b-0e34d3c9fa14`      | That session                                                                                    |
| First characters | `4045beec`                                  | The one session whose ID starts that way. More than one match is an error                       |
| `last`           | `last`                                      | The session active most recently. `latest` and `current` mean the same                          |
| File path        | `~/.claude/projects/-repo/4045beec-….jsonl` | A Claude Code transcript or events file, a Codex `rollout-*.jsonl` or a Gemini `session-*.json` |

Inside a running session, `last` is that session. To reach an earlier one, get its ID from `awf sessions`.

`--project <dir>` narrows `last` to Claude Code sessions started in exactly that folder: `awf summary last --project .`

## Name a time range

`compare` takes a range on either side, in place of a session:

| Form                     | Meaning                                             |
| ------------------------ | --------------------------------------------------- |
| `2026-10-01..2026-10-15` | Those days, the end day included                    |
| `2026-10-20`             | That day                                            |
| `7d`                     | The last 7 days. Also `h`, `w`, and `m` for minutes |
| `14d..7d`                | From 14 days ago to 7 days ago                      |

A session is in a range if it started there. `sessions`, `stats`, `import` and `sample` take `--since 30d` instead, with the same units. `--project <dir>` keeps sessions started in that folder or below it: `--project .` is this repo.

## Import first

`summary`, `classify` and `report` read a session's log directly.

`sessions`, `stats`, `sample` and date ranges in `compare` only see sessions the plugin recorded or `awf import` read. With neither, `sessions` and `stats` say so and exit 0, and `compare` exits 1. So run `awf import --since 30d` before them.

`awf import` only reads agents' logs. It writes timings and commands to `~/.awf/imported/`, never prompts or output, and `--dry-run` writes nothing. `--agent` limits it to `claude-code`, `codex`, `gemini` or `opencode`.

If sessions are missing, `awf doctor` shows where awf reads and writes, and whether the plugin is recording.

## Recipes

### "Why was this session slow?"

```bash
awf summary <session>
awf report <session> --json
```

`summary` gives the time per phase, with failed checks and rework. In the report's JSON, `slowest` holds indexes into `steps`, slowest first; each step's `text` is its command or file, and `e - s` its time in ms. `rework` lists failed checks and the edits that followed. `unclassified` lists programs with no rule.

To show the user the waterfall, run `awf report <session> --open`. Reply with the two or three biggest phases, the slowest steps, and any failed checks.

### "What's slowing us this week?"

```bash
awf import --since 14d
awf compare 14d..7d 7d --project .
awf stats --since 7d --project . --phase tests
```

`compare` sets each phase against the week before. `stats --phase <id>` breaks one phase down by command: run it on the phase that's biggest or grew most. Drop `--project .` to cover every repo.

`compare` exits 1 when a side has no sessions. Then use `awf stats --since 7d` alone. `stats` counts Bash time only, so its shares aren't session shares.

### "Did this change help?"

```bash
awf import --since 30d
awf compare <before> <after>
awf compare 2026-10-01..2026-10-15 2026-10-16..2026-10-30 --project .
```

The first form takes two sessions, the second the days around the change. Look at the phase the change was meant to shrink, then `Failed checks` and `Rework loops`.

When the sides have different numbers of sessions, compare shares, not times. Sessions do different work, so one on each side is weak evidence: say so in your reply.

### "What should I add a rule for?"

```bash
awf import --since 30d
awf stats --since 30d --project .
```

`stats` lists unclassified programs by Bash time (`topUnclassified` in JSON) and unclassified tools (`otherUnclassified`). Read what a program does, then write a rule in `.awf/rules.yaml`: see [rules.md](rules.md). `awf classify <session>` shows the result, with no import needed.

### "Share this with someone"

```bash
awf report <session> --share --out waterfall.html
```

Give the user that file's path. It keeps phases, durations and tool names: no task, folder, commands, files or output. See [Privacy](#privacy).

## Exit codes

| Code | Meaning                                                                 |
| ---- | ----------------------------------------------------------------------- |
| 0    | OK                                                                      |
| 1    | Error: no such session, a bad rule, a missing or wrong argument         |
| 2    | Bad usage: an unknown command or option. awf prints the usage on stderr |

Errors go to stderr, as `awf <command>: <message>`. With `--json`, stdout is JSON when the exit code is 0.

- A missing or wrong argument is 1, not 2: `awf summary` with no session, `awf compare last` with one side.
- `awf import` prints its report and then exits 1 if any log failed. Read `errors`.
- `awf statusline` prints nothing and exits 0 on any error, by design, so it can't break a status line. `AWF_DEBUG=1` prints the error on stderr.
- `awf accuracy` exits 0 when it disagrees with your labels.

## JSON reference

- Times are in ms. Names ending in `Ms` are durations, except `startMs`, `endMs`, `activityMs`, `sinceMs`, `lastEventMs`, `failedAtMs` and `passedAtMs`, which are Unix times in ms, like `generatedAt`.
- Shares are 0 to 1, so `0.35` is 35%. What they're a share of depends on the command: the session's total in `summary`, `report` and `compare`, Bash time in `stats`, working time (without Waiting on you) in `statusline`.
- Fields with nothing to say are left out, not null. The exception is `lastEventMs`.

### summary

`awf summary <session> --json`

| Field          | Meaning                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `id`           | Session ID                                                                                                         |
| `title`        | Its title or first prompt                                                                                          |
| `cwd`          | The folder the session started in                                                                                  |
| `agentVersion` | The agent's version                                                                                                |
| `sources`      | Where the data came from: `recorder`, `transcript`, `import-cache`                                                 |
| `startMs`      | Start                                                                                                              |
| `endMs`        | End                                                                                                                |
| `totalMs`      | The session's length. Phase times add up to this                                                                   |
| `turnsMs`      | Time inside turns                                                                                                  |
| `awayWorkMs`   | Time between turns that background work took                                                                       |
| `phases`       | All 11 phases, as `{ phase, label, ms, share }` plus counts (below)                                                |
| `modelCalls`   | Model calls                                                                                                        |
| `toolCalls`    | Tool calls                                                                                                         |
| `subagents`    | Subagents                                                                                                          |
| `failures`     | Failed checks                                                                                                      |
| `tokens`       | `{ input, output, cacheRead, cacheWrite }`                                                                         |
| `rework`       | Failed checks with `{ check, failedStepId, failedAtMs, edits, passedAtMs }`. No `passedAtMs` means it never passed |
| `uncoveredMs`  | Time no step covered, counted in Unclassified                                                                      |

Counts in `phases`: `runs` and `failed` on `lint`, `tests` and `build`. `edits` on `writing-code`, `writing-tests` and `rework`, which also has `failures`. `calls` on `exploring` and `running`, which also has `pollingMs`. `approvals`, `questions` and `gaps` on `waiting`. `steps` on `unclassified`.

### classify

`awf classify <session> --json`

`id`, `agent`, `sources`, `startMs`, `endMs`, `cwd`, `title`, `agentVersion`, `transcriptPath`, `diagnostics` (`unknownEntries`, `badLines`, `warnings`), and `steps`, a list of:

| Field              | Meaning                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`, `parentId`   | The step, and the step it's inside                                                                                           |
| `kind`             | `turn`, `model`, `tool`, `subagent`, `idle`, `compact` or `background`                                                       |
| `tool`             | Tool name                                                                                                                    |
| `command`, `files` | Bash command, or files the call touched                                                                                      |
| `startMs`, `endMs` | Start and end                                                                                                                |
| `phase`            | Its phase. Turns and subagents have none: their children carry the time                                                      |
| `rule`             | The rule that decided, like `rules.yaml:commands[1]` or `default-rules.yaml:tools[1]`. `none` means no rule matched          |
| `decidedBy`        | The part of the command that decided                                                                                         |
| `tags`             | Other phases it touched, and notes like `install`, `by-name` or `script:test`                                                |
| `flags`            | `approval`, `denied`, `interrupted`, `background`, `parallel`, `api-error`, `unfinished`, `answer`, `notification`, `resent` |
| `checks`, `failed` | Lint, test and build runs in the step as `{ key, phase, tool, failed }`, and whether any failed                              |
| `ok`, `exitCode`   | The tool's result                                                                                                            |
| `detail`           | With `--detail`: tool output, secrets masked                                                                                 |

`classify` runs before rework is worked out, so no step says `rework`: those edits show as `writing-code` or `writing-tests`. To see rework per step, use `report --json`, where steps have `reworkFor`.

### report

`awf report <session> --json`

| Field                 | Meaning                                                                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v`                   | Format version                                                                                                                                                                                                              |
| `generatedAt`         | When it was made                                                                                                                                                                                                            |
| `share`               | Whether `--share` was on                                                                                                                                                                                                    |
| `session`             | `id`, `agent`, `sources`, `startMs`, `totalMs`, `turnsMs`, `awayWorkMs`, `agentVersion`, `title`, `cwd`                                                                                                                     |
| `phases`              | All 11 phases, as `{ id, label, ms, share, detail }`. The key is `id`, not `phase`                                                                                                                                          |
| `counts`              | `modelCalls`, `toolCalls`, `subagents`, `failures`, `reworkLoops`                                                                                                                                                           |
| `tokens`              | `{ input, output, cacheRead, cacheWrite }`                                                                                                                                                                                  |
| `rework`              | `{ check, failedAt, passedAt, edits }`, in ms from the session's start                                                                                                                                                      |
| `steps`               | Steps in display order: `i`, `p` (parent's `i`, or -1), `depth`, `kind`, `phase`, `s`, `e`, `label`, `text`, `tool`, `failed`, `flags`, `tags`, `checks`, `reworkFor` and more. `s` and `e` are ms from the session's start |
| `slowest`             | Indexes into `steps`, slowest first                                                                                                                                                                                         |
| `unclassified`        | `{ name, ms }`: programs with no rule                                                                                                                                                                                       |
| `unclassifiedModelMs` | Model time spent on those calls                                                                                                                                                                                             |
| `timeline`            | `[start, end, phase]`: which phase each stretch counts as, in ms from the start                                                                                                                                             |

### compare

`awf compare <before> <after> --json`

| Field     | Meaning                                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before`  | One side: `label`, `sessions`, `totalMs`, `turnsMs`, `awayWorkMs`, `phases` (all 11, as `{ phase, label, ms, share }`), `modelCalls`, `toolCalls`, `failures`, `reworkLoops` |
| `after`   | The other side, the same way                                                                                                                                                 |
| `changes` | Per phase, `{ phase, ms, share }`: after minus before. Here `ms` can be negative, and `share` runs from -1 to 1                                                              |

### sessions

`awf sessions --json` prints a list, newest first:

| Field                | Meaning                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `id`                 | Session ID                                                       |
| `startMs`, `endMs`   | Start and end                                                    |
| `durationMs`         | Length                                                           |
| `turnsMs`            | Time inside turns                                                |
| `turns`, `toolCalls` | Counts                                                           |
| `cwd`                | The folder it started in                                         |
| `sources`            | `hooks`, `transcript` or both. Not the same words as `summary`'s |

### stats

`awf stats --json` counts Bash calls only.

| Field               | Meaning                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| `sessions`          | Sessions read                                                                         |
| `bashMs`            | Bash time                                                                             |
| `bashCalls`         | Bash calls                                                                            |
| `unclassifiedMs`    | Unclassified Bash time                                                                |
| `unclassifiedShare` | Its share of Bash time                                                                |
| `byPhase`           | `{ phase, ms, calls, share }`, only phases that have calls                            |
| `topUnclassified`   | `{ program, ms, calls }`. With `--phase <id>` this lists that phase, despite the name |
| `otherUnclassified` | `{ tool, ms, calls }`: unclassified time of other tools, MCP tools by server          |

### statusline

`awf statusline --json` reads Claude Code's JSON on stdin, with `transcript_path` and `session_id`.

| Field       | Meaning                                                                            |
| ----------- | ---------------------------------------------------------------------------------- |
| `id`        | Session ID                                                                         |
| `sources`   | As in `summary`                                                                    |
| `workingMs` | The session's time without Waiting on you                                          |
| `phases`    | The phases shown: `{ phase, ms, share, label, name }`, and `pinned` on pinned ones |
| `failed`    | Failed lint, test and build runs                                                   |
| `reworkMs`  | Rework time                                                                        |
| `line`      | The line, without colours                                                          |

### live

`awf live --json` prints one pass as a list:

| Field                  | Meaning                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `id`, `project`, `cwd` | Session ID, short folder name, folder                           |
| `title`                | Its title or first prompt                                       |
| `state`                | `working`, `approval`, `your-turn` or `idle`                    |
| `label`                | The state as the board shows it, like `idle 12m`                |
| `sinceMs`              | On `your-turn` and `idle`: since when the agent has waited      |
| `question`             | The tool asking the user something, if any                      |
| `background`           | Background tasks and subagents still running                    |
| `servers`              | Of those, servers left running. They don't count as working     |
| `activityMs`           | The last entry, or the latest change to a subagent's transcript |
| `line`                 | The status line's phase split                                   |
| `error`                | Why `line` is missing                                           |
| `transcript`           | The transcript's path                                           |

### import

`awf import --json`

| Field            | Meaning                                                       |
| ---------------- | ------------------------------------------------------------- |
| `transcripts`    | Logs found                                                    |
| `agents`         | Sessions read per agent: `{ "claude-code": 12 }`              |
| `imported`       | New or changed                                                |
| `unchanged`      | Already imported                                              |
| `steps`          | Steps read                                                    |
| `toolCalls`      | Tool calls read                                               |
| `unknownEntries` | Log entries awf doesn't know: `{ type: { count, versions } }` |
| `badLines`       | Lines that weren't valid JSON                                 |
| `versions`       | Claude Code versions seen                                     |
| `errors`         | `{ file, message }` per log that failed                       |

### sample

`awf sample --json` prints a list of `{ command, cwd, phase }`, one per sampled Bash step. `phase` is a report id.

### accuracy

`awf accuracy <labels.csv> --json`

| Field      | Meaning                                                |
| ---------- | ------------------------------------------------------ |
| `labelled` | Rows with a label                                      |
| `agree`    | Rows where awf agrees                                  |
| `accuracy` | `agree` over `labelled`, 0 to 1                        |
| `perPhase` | `{ phase: { total, agree, accuracy } }`, by your label |
| `misses`   | `{ command, yours, awf }`                              |

### doctor

`awf doctor --json`

| Field                   | Meaning                                             |
| ----------------------- | --------------------------------------------------- |
| `awf`, `node`           | Versions                                            |
| `awfHome`               | Where awf writes                                    |
| `claudeProjects`        | Where it reads Claude Code's transcripts            |
| `recordedSessions`      | Sessions the plugin recorded                        |
| `lastEventMs`           | The recorder's last event, or null if it has none   |
| `transcriptsLast30Days` | Transcripts changed in the last 30 days             |
| `importedSessions`      | Sessions imported                                   |
| `unknownEntries`        | Transcript entries awf doesn't know, as in `import` |

### purge

`awf purge --json` lists what awf stored and deletes nothing. It prints `dir`, `parts` (`{ name, bytes }`), `foreign` (files awf didn't make, which stop a delete) and `deleted`.

- With `--yes` it deletes the folder, and `deleted` is `true`.
- If `foreign` isn't empty, `--yes` deletes nothing, prints no JSON and exits 1.
- If `~/.awf` doesn't exist, `parts` and `foreign` are empty.

Only run `awf purge --yes` when the user asks. It deletes recorded timings, which can't be read back.

## Phases

Every instant of a session has one phase. [phases.md](phases.md) has what counts as each.

| Report id       | Label                  | Status line  | In a rule    |
| --------------- | ---------------------- | ------------ | ------------ |
| `writing-code`  | Writing code           | code         | `writing`    |
| `writing-tests` | Writing tests          | test code    | `writing`    |
| `lint`          | Lint and format        | lint         | `lint`       |
| `tests`         | Running tests          | tests        | `tests`      |
| `build`         | Build                  | build        | `build`      |
| `rework`        | Rework                 | rework       | Can't be set |
| `exploring`     | Exploring              | explore      | `exploring`  |
| `running`       | Running scripts        | scripts      | `running`    |
| `planning`      | Planning and answering | plan         | `planning`   |
| `waiting`       | Waiting on you         | Never shown  | `waiting`    |
| `unclassified`  | Unclassified           | unclassified | Can't be set |
| None            | None                   | None         | `neutral`    |

**The trap.** Report ids and rule ids differ. `summary --json` says `writing-code` and `writing-tests`, but a rule says `writing`, and awf picks one by the file. Rules also take `neutral`, which no report shows: it means the command changes nothing and doesn't count. A rule can't set `rework` or `unclassified`: awf works out rework from failed checks, and Unclassified is what no rule matched.

A rule with `writing-code`, `rework` or `unclassified` makes commands fail with `unknown phase`. The other way round fails too: `awf stats --phase writing` and an `awf accuracy` label of `writing` both want report ids.

## Privacy

A full report holds what the session held. `awf report` without `--share`, and `awf classify`, show commands, file paths, the first prompt and tool output. Secrets are masked, but not everything sensitive is a secret. `summary` and `live` show the folder and first prompt too, and `sessions` the folder.

- Don't paste any of this outside the machine: no chats, issues, pull requests or pastebins.
- `awf report <session> --share` is the only form meant to leave the machine. It keeps phases, durations and tool names, and drops the task, folder, commands, files and output.
- If the user wants to share a result, make that copy.
- In your own replies, quote commands and output only as far as the answer needs.
