# Repo rules

`.awf/rules.yaml` teaches awf a repo's own scripts and tools. The built-in rules, in [src/classify/default-rules.yaml](../src/classify/default-rules.yaml), cover common tools. What they miss shows as Unclassified, or as Running scripts when it's a script awf can't read as shell.

awf only reads this file and the scripts your commands run. It never runs anything. What each phase means is in [phases.md](phases.md).

```yaml
version: 1

commands:
  - { phase: tests, program: test.sh }
  - { phase: tests, program: acme, args: [verify], tool: acme verify }

tools:
  - { phase: running, match: '^mcp__acme__' }

testFiles:
  - 'qa/**'
```

Every key is optional. `version` isn't read: the built-in file has it, and awf ignores it.

## Where the file goes

Put it at `.awf/rules.yaml` in the repo root, and commit it so everyone's sessions read the same way.

awf finds it from the directory a command runs in, after any `cd`. It looks there, then in each parent, 12 folders in all. It doesn't look for `.git`: the nearest file wins.

- Only the nearest file counts. Files don't merge, so `ios/.awf/rules.yaml` replaces the root's file for commands that run in `ios/`.
- A command that runs in another repo follows that repo's file. `cd ../ios && ./scripts/test.sh`, from a session started elsewhere, uses the iOS repo's rules.
- A directory with no file in those 12 folders follows the rules of the session's own folder.

## How rules apply

**Repo rules come first.** In each section, your rules are tried before the built-in ones, and the first match wins. So a repo rule can override a built-in one, and specific rules go before general ones.

**In `commands`, a repo rule decides before awf reads what a command runs.** Built-in rules decide after. Take a `./scripts/test.sh` that builds, then tests. awf reads the script and calls it Build, tagged `tests`. With `{ phase: tests, program: test.sh }`, it's Running tests whatever the script holds. This holds for package scripts, make targets and task runners too.

**Rules also apply inside what a command runs.** With `{ phase: tests, program: frobnicate }`, `npm run qa`, `make qa` and `./scripts/ci.sh` are all Running tests if they run `frobnicate`.

**A compound command takes its highest-ranked phase.** `a && b` is split, and each simple command is matched on its own. See [phases.md](phases.md) for the order.

**Changes apply at once**, to past sessions too. There's nothing to import again. The exception is `awf statusline` and `awf live`: they keep a session's line until the session changes.

## Phases

Rules take these ids. Reports use slightly different ones: [docs/agents.md](agents.md#phases) has the full table.

| In a rule   | Report phase                  | Use for                                                          |
| ----------- | ----------------------------- | ---------------------------------------------------------------- |
| `lint`      | Lint and format               | Linters, formatters, type checks                                 |
| `tests`     | Running tests                 | Test runs                                                        |
| `build`     | Build                         | Builds, code generation, installing dependencies                 |
| `exploring` | Exploring                     | Commands that only read                                          |
| `writing`   | Writing code or Writing tests | Commands and tools that change files. awf picks one by the file  |
| `running`   | Running scripts               | Anything else that runs: servers, deploys, HTTP calls, databases |
| `planning`  | Planning and answering        | Planning tools                                                   |
| `waiting`   | Waiting on you                | Calls that wait for a person                                     |
| `neutral`   | None                          | Commands that change nothing, like `cd` or `echo`                |

`writing-code`, `writing-tests`, `rework` and `unclassified` are not allowed, and fail with `unknown phase`. awf works out rework from failed checks, and Unclassified is what's left when no rule matches.

On a command of your own, `writing` gives Writing code: awf can't tell which file it wrote. On a tool call, awf reads the file from the call's input, so a file that `testFiles` matches makes it Writing tests.

`neutral` has two limits:

- A `neutral` command doesn't count next to other commands, but run on its own it's Unclassified, tagged `neutral`. It won't take a program off the unclassified list.
- It doesn't match a program run by its path. `{ phase: neutral, program: notify.sh }` has no effect on `./scripts/notify.sh`, which stays Running scripts.

## commands

Bash commands. awf splits a compound command, removes wrappers (`env FOO=1`, `sudo`, `time`, `timeout`, `npx`, `pnpm exec`, `uv run`, `poetry run`, `bundle exec`, `python -m`, `fvm` and others), and matches each simple command. A rule needs `program` or `match`. With both, both must match.

| Field     | Value          | Meaning                                                                                                         |
| --------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| `phase`   | Required       | One of the ids above                                                                                            |
| `program` | String or list | The command's name, without its path. `test.sh` matches `./scripts/test.sh` and `bash scripts/test.sh`          |
| `match`   | Regex          | Tested on the simple command, wrappers removed. `^acme smoke` matches `npx acme smoke`                          |
| `args`    | List           | Leading arguments, in order, options skipped. `'a\|b'` is either word, `'test:*'` is any word starting that way |
| `with`    | List           | Arguments that must all appear anywhere. `--flag` also matches `--flag=value`                                   |
| `without` | List           | Arguments that must not appear                                                                                  |
| `only`    | List           | Every argument must be one of these. `only: []` means no arguments                                              |
| `tag`     | String         | An extra tag on the step, like `install`                                                                        |
| `tool`    | String         | The check's name, when it isn't the program. `{1}` is the first argument: `tool: 'acme {1}'`                    |

Set `tool` on lint, test and build rules when one program runs several checks. A check's name decides which `failurePatterns` apply, and rework ends only when the same check passes, so without it `acme test` and `acme e2e` count as one check.

`args` skips options, not their values. `acme --env prod verify` doesn't match `args: [verify]`, because `prod` comes first. `acme --env=prod verify` does. To catch both, use `match: '^acme\s.*\bverify\b'`.

## tasks

Gradle tasks, Maven goals and sbt tasks. Other runners use `scripts`.

| Field   | Value    | Meaning                                                                              |
| ------- | -------- | ------------------------------------------------------------------------------------ |
| `phase` | Required | One of the ids above                                                                 |
| `match` | Required | Regex tested on each task's name, and on the last part of one like `:app:smokeCheck` |

## scripts

Names that decide when awf can't see what they run:

- npm, pnpm, yarn and bun scripts, and make targets, when the file that defines them can't be read. That includes scripts of other workspace packages (`pnpm -r nightly`, `pnpm --filter web nightly`). When `package.json` or the Makefile defines the script, awf reads it and this section isn't used.
- Task names given to `turbo`, `nx` and `lerna`, and to `just`, `task`, `mise run`, `poe`, `devbox run`, `composer`, `rake` and `invoke`. awf doesn't read what these tasks run, so the name decides. A `commands` rule on the runner works too: `{ phase: tests, program: just, args: [e2e] }`.

| Field   | Value    | Meaning                                                                                   |
| ------- | -------- | ----------------------------------------------------------------------------------------- |
| `phase` | Required | One of the ids above                                                                      |
| `match` | Required | Regex tested on the name's first word (split at `:`, `_` and `-`), then on the whole name |

So `^nightly$` also matches `nightly-full`, and `build:test` is a build. Steps decided this way are tagged `by-name`.

## tools

Tool calls other than Bash, like an MCP server's. A rule needs `name` or `match`.

| Field    | Value          | Meaning                                                                           |
| -------- | -------------- | --------------------------------------------------------------------------------- |
| `phase`  | Required       | One of the ids above                                                              |
| `name`   | String or list | Exact tool names, like `mcp__acme__deploy`                                        |
| `match`  | Regex          | Tested on the tool's name                                                         |
| `action` | String or list | Only calls with this `action` in their input, `'a\|b'` for either. MCP tools only |

`awf stats` groups MCP tools by server, as `mcp__acme`. `awf classify` shows each call's full name.

Subagent calls (`Agent`, `Task`) and calls on background tasks (`TaskOutput`, `BashOutput`, `TaskStop`, `KillShell`) take their phase from what they ran. Rules here don't change them.

## testFiles

A list of globs. Edits to matching files count as Writing tests. Your globs add to the built-in ones: they can't remove one.

```yaml
testFiles:
  - 'qa/**'
  - '**/*.feature'
```

`**`, `*`, `?` and `{a,b}` work. A glob matches at any depth, so `qa/**` also matches `web/qa/login.ts`.

## failurePatterns

Regexes tested on a check's output, to catch failures a pipe hid (`acme verify | tail`). They need the output, which the transcript has and the hooks don't.

| Field     | Value    | Meaning                                                                                           |
| --------- | -------- | ------------------------------------------------------------------------------------------------- |
| `tool`    | String   | The check's name: a rule's `tool`, or else the program. `*` means every check, and is the default |
| `pattern` | Required | Regex tested on the output                                                                        |

When the exit code is the check's own, it decides: a pass stays a pass, whatever the output says. [phases.md](phases.md) has the details, in rule 4.

## Regexes

`match` and `pattern` are JavaScript regexes. A leading `(?m)`, `(?i)` or `(?s)` is a flag. `(?m)^FAILED` matches at the start of any line.

Use single quotes in YAML, so backslashes stay as written. `match: "\d"` is a YAML error; `match: '\d'` isn't.

## Examples

**A test script, whatever it runs:**

```yaml
commands:
  - { phase: tests, program: test.sh }
```

**Scripts by path:**

```yaml
commands:
  - { phase: tests, match: '(^|/)scripts/e2e-.*\.sh' }
```

**Your own CLI.** Order matters: the rule with `with` goes first.

```yaml
commands:
  - { phase: lint, program: acme, args: [verify], with: [--style], tool: acme style }
  - { phase: tests, program: acme, args: [verify], tool: acme verify }
  - { phase: build, program: acme, args: ['compile|bundle'], tool: 'acme {1}' }
  - { phase: running, program: acme, args: [deploy], tag: deploy }
  - { phase: exploring, program: acme, with: [--dry-run] }
```

**Override a built-in rule.** `docker compose up` is Running scripts. Here, one that exits with the tests is a test run:

```yaml
commands:
  - {
      phase: tests,
      program: docker,
      args: [compose, up],
      with: [--abort-on-container-exit],
      tool: compose tests,
    }
```

**A make target, without reading its recipe:**

```yaml
commands:
  - { phase: tests, program: make, args: [smoke], tool: make smoke }
```

**A Gradle task:**

```yaml
tasks:
  - { phase: tests, match: '^smokeCheck$' }
  - { phase: build, match: '^release[A-Z]' }
```

**A turbo, nx or just task, or another package's script:**

```yaml
scripts:
  - { phase: tests, match: '^nightly$' }
```

**An MCP server's tools.** The general rule goes last.

```yaml
tools:
  - { phase: exploring, match: '^mcp__acme__(get|list)_' }
  - { phase: running, match: '^mcp__acme__' }
```

**A failure a pipe hides:**

```yaml
commands:
  - { phase: tests, program: acme, args: [verify], tool: acme verify }

failurePatterns:
  - { tool: acme verify, pattern: '(?m)^\d+ specs did not pass' }
```

## When a rule is wrong

A bad rule makes `summary`, `classify`, `report`, `compare`, `stats`, `sample` and `accuracy` fail with exit code 1. The error names the file and the rule, counting from 0:

```text
awf summary: /repo/.awf/rules.yaml commands[0]: unknown phase "rework"; use one of lint, tests, build, exploring, writing, running, planning, waiting, neutral
```

| Message                     | Fix                                                |
| --------------------------- | -------------------------------------------------- |
| `unknown phase "..."`       | Use an id from [Phases](#phases)                   |
| `needs program or match`    | A `commands` rule needs one                        |
| `needs name or match`       | A `tools` rule needs one                           |
| `needs match`               | A `tasks` or `scripts` rule needs one              |
| `bad regex "..."`           | Fix the regex                                      |
| `"commands" must be a list` | Each section is a list. The same goes for the rest |
| `expected a YAML mapping`   | The file's top level must be keys, not a list      |

- **A YAML syntax error names a line and column, not the file.** It reads like `awf summary: Invalid escape sequence \d at line 2, column 31`. If an error like that has no path, check `.awf/rules.yaml`.
- **Unknown keys are ignored, with no error.** A misspelt field just drops out: `{ phase: tests, program: acme, arg: [verify] }` matches every `acme` command.
- **Other repos' sessions aren't affected.** But `awf stats` and date ranges in `awf compare` read every session, so they fail unless `--project` leaves that repo out.
- `sessions`, `import` and `doctor` don't use rules and keep working.
- `awf live` shows the session without its phase split. With `--json`, its `error` says why.
- `awf statusline` shows nothing and exits 0. Until the session changes it may still show its last line. `AWF_DEBUG=1` prints the error on stderr.

## Check a rule

```bash
awf import --since 30d                          # read past sessions
awf stats --since 30d --project .               # find what's unclassified
```

`stats` lists the unclassified programs by Bash time, and the other tools after them. Add the rule, then look at it:

```bash
awf classify last                               # every step of the last session, with its phase
awf stats --since 30d --project . --phase tests # what a phase contains
```

`--phase` takes report ids: `writing-code`, not `writing`. Inside a running session `last` is that session, so use an ID from `awf sessions` to look at an earlier one.

`awf classify <session> --json` gives each step's `rule`: `rules.yaml:commands[1]` for your file, `default-rules.yaml:commands[213]` for a built-in rule, and `none` when nothing matched.

**To test a rule with no session,** use `awf accuracy`. It classifies each command with the current rules, and runs nothing. Write a CSV. `your_phase` takes report ids, and `cwd` is optional:

```csv
command,cwd,your_phase
./scripts/test.sh,/path/to/repo,tests
acme verify --style,/path/to/repo,lint
```

```bash
awf accuracy check.csv
```

It lists each command where awf disagrees, and exits 0 either way. With `--json`, read `misses`.
