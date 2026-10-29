---
name: dogfood
description: Run awf on this repo's own recent sessions and report the phase split and anything unclassified.
disable-model-invocation: true
allowed-tools: Bash(pnpm awf *)
---

Run awf on the sessions that build awf.

1. Run `pnpm awf import --project "$CLAUDE_PROJECT_DIR"` so recent transcripts are imported.
2. Run `pnpm awf sessions --project "$CLAUDE_PROJECT_DIR" --since 7d` and pick the five most recent sessions.
3. For each, run `pnpm awf summary <session>` and collect the phase split.
4. Run `pnpm awf stats --project "$CLAUDE_PROJECT_DIR" --top 15` and list the unclassified Bash commands with their time.
5. Report: one table of phase share per session, the unclassified commands, and anything that looks wrong (a phase that is far too big or too small, a failure that wasn't counted). For each surprise, say whether awf is wrong (then propose a fixture) or the session really went that way (then note it).

Do not paste prompts or command output into the report.
