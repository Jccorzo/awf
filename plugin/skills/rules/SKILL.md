---
name: rules
description: Teaches awf a repo's own scripts and tools by writing .awf/rules.yaml, so they count as tests, build or lint rather than Unclassified or Running scripts. Use when the user asks why a script is unclassified or in the wrong phase, wants awf to recognise a script, task or MCP tool, or asks what to add a rule for.
allowed-tools: Bash(node *)
---

Find what has no rule. Import only reads the agents' logs:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" import --since 30d
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" stats --since 30d --project .
```

`stats` lists unclassified programs by Bash time, then other tools. To check what a phase holds, add `--phase tests` (or `build`, `lint`, `running`). A script in the wrong phase shows there.

Read what each program with real time does before naming it: the script, `package.json`, the Makefile. Don't go by its name alone. Ask the user if you can't tell.

Write the rules in `.awf/rules.yaml` at the repo root. Rules in that file come first, and the first match wins, so put specific rules first:

```yaml
commands:
  # A script, by file name, whatever it runs: ./scripts/test.sh, bash scripts/test.sh
  - { phase: tests, program: test.sh }
  # Scripts by path
  - { phase: tests, match: '(^|/)scripts/e2e-.*\.sh' }
  # A CLI's subcommands. args skips options; with: any argument, anywhere
  - { phase: lint, program: acme, args: [verify], with: [--style], tool: acme style }
  - { phase: tests, program: acme, args: [verify], tool: acme verify }
  - { phase: build, program: acme, args: ['compile|bundle'], tool: 'acme {1}' }

tasks: # Gradle tasks, Maven goals, sbt tasks
  - { phase: tests, match: '^smokeCheck$' }

scripts: # turbo, nx, lerna, just and rake tasks, and scripts awf can't read
  - { phase: tests, match: '^nightly$' }

tools: # Tool calls other than Bash
  - { phase: running, match: '^mcp__acme__' }

testFiles: # Edits to these count as Writing tests
  - 'qa/**'

failurePatterns: # Failures a pipe hides, by the check's tool name
  - { tool: acme verify, pattern: '(?m)^\d+ specs did not pass' }
```

Phases for a rule: `lint`, `tests`, `build`, `exploring`, `writing`, `running`, `planning`, `waiting`, `neutral`. Never `writing-code`, `writing-tests`, `rework` or `unclassified`: reports use those, and rules can't set them. Never add a phase.

- Use single quotes around regexes, or YAML rejects backslashes.
- Unknown keys are ignored with no error, so check spelling: `arg` isn't `args`.
- `neutral` doesn't clear a program from the unclassified list. Run alone, it stays Unclassified.
- The full reference is at https://github.com/Jccorzo/awf/blob/main/docs/rules.md.

Rules apply at once, to past sessions too. Check them:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" stats --since 30d --project .
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" stats --since 30d --project . --phase tests
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" classify last
```

`classify last` is this session. For one that ran the script, get its ID from `sessions --since 30d --project .`, and add `--json` to see each step's `rule`: `rules.yaml:commands[1]` is your file.

If a command fails with an error naming `.awf/rules.yaml`, fix that rule; it counts from 0. An error with a line and column but no path is a YAML syntax error in the same file.

Reply in a few lines: the rules you added, the unclassified share before and after, and what's still unclassified. Tell the user to commit `.awf/rules.yaml`. Don't paste the whole table unless asked.
