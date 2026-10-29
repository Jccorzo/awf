---
name: waterfall
description: Draws this Claude Code session as a waterfall in one HTML file, showing where the time went by phase (writing code, tests, build, lint, rework, waiting on you) and which steps were slow or failed. Use when the user asks where the time went, what was slow, or for a waterfall or timing report of this session.
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

Reply in a few lines: the report's path, the two or three phases that took the most time, and any
check that failed or was reworked. Don't paste the whole table unless asked.

If the user wants a copy to share, run the report command again with `--share`. That copy keeps
only phases, durations and tool names: no task, folder, commands, files or output.
