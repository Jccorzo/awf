---
name: waterfall
description: Draws a Claude Code session as a waterfall in one HTML file, showing where the time went by phase (writing code, tests, build, lint, rework, waiting on you) and which steps were slow or failed. Use when the user asks why a session was slow, where the time went, what took so long, how long tests or builds took, or for a waterfall, timing report or shareable copy of a session.
allowed-tools: Bash(node *)
---

Build the report for this session and open it in the browser:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" report ${CLAUDE_SESSION_ID} --open
```

Then get the numbers:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" summary ${CLAUDE_SESSION_ID}
```

If the user means another session, use its ID or first characters in both commands. To find one:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" import --since 30d
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" sessions --since 30d --project .
```

To name the slowest steps, run `report` with `--json` instead of `--open`. `slowest` holds indexes into `steps`, slowest first; each step's `text` is its command or file, and `e - s` is its time in ms.

Reply in a few lines: the report's path, the two or three phases that took the most time, and any check that failed or was reworked. Don't paste the whole table unless asked. If Unclassified is large, say so and offer `/awf:rules`.

If the user wants a copy to share, run the report command again with `--share`, and give only that copy's path. It keeps phases, durations and tool names: no task, folder, commands, files or output. The full report holds all of those, so it stays on this machine.
