---
name: trends
description: Shows where coding agent time goes across sessions, by phase (tests, build, lint, rework, waiting on you), and whether a change helped. Use when the user asks what's slowing the team or repo down, where the time went this week or month, how much time goes to tests or builds, whether things got faster or slower, or for a before and after comparison of a change or of two sessions.
allowed-tools: Bash(node *)
---

Read past sessions first. It only reads the agents' logs, and keeps timings in `~/.awf`:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" import --since 30d
```

`--project .` below keeps to this repo. Drop it if the user asks about all their work.

**Where the time goes.** Set this week against the last, then break down the phase that's biggest or grew most:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" compare 14d..7d 7d --project .
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" stats --since 7d --project . --phase tests
```

`--phase` takes `writing-code`, `writing-tests`, `lint`, `tests`, `build`, `exploring`, `running` or `unclassified`. To list the sessions behind a number:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" sessions --since 7d --project .
```

**Before and after.** Compare the days around the change, or two sessions by ID:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" compare 2026-10-01..2026-10-15 2026-10-16..2026-10-30 --project .
node "${CLAUDE_PLUGIN_ROOT}/scripts/awf.mjs" compare <before> <after>
```

Each side is a session (ID, its first characters, or `last`) or a range: `2026-10-01..2026-10-15`, `2026-10-20`, `7d`, `14d..7d`. Use the real dates of the change, and ask if you can't tell them.

`compare` fails with "no sessions in ..." when a side is empty. Then widen the range, or use `stats --since 30d --project .` alone and say there's no earlier period to compare with.

How to read the numbers:

- When the sides have different numbers of sessions, compare shares, not times.
- `stats` counts Bash time only, and `compare` all of a session's time. Don't mix their percentages.
- Sessions do different work, so one session on each side is weak evidence. Say so.

Reply in a few lines: the two or three phases that took the most time, what changed in share points, and the commands behind the biggest phase. Don't paste the whole tables unless asked.
