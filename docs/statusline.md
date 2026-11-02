# Status line

`awf statusline` puts the current session's phase split in Claude Code's status line, updated as the session goes:

```text
tests 3% · build 32% · scripts 26% · 9 failed · rework 9s
```

It's Claude Code only. The status line doesn't appear in the desktop app; [`awf live`](live.md) shows those sessions.

## What it shows

It shows Running tests, always and first, then the phases that took the most time so far (three phases in all), then failed lint, test and build runs, and rework time when rework isn't one of the phases shown. Pin other phases with `--pin` (`--pin tests,build`), or none with `--pin none` for only the top three.

Shares are of the time the agent worked, without Waiting on you, so they hold still while you're away. Phase names are short: code, test code, lint, tests, build, rework, explore, scripts, plan and unclassified, coloured as in the report (`NO_COLOR=1` turns colours off).

## Set it up

Claude Code runs one status line command, so this replaces yours. What it showed, such as a context bar, goes away, and awf's line doesn't show context use. To keep it, see [Keep your status line](#keep-your-status-line).

Add a `statusLine` to `~/.claude/settings.json`. With the npm install (`npm install -g agent-waterfall`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "awf statusline",
    "padding": 0
  }
}
```

From source, use the path to your build:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/awf/dist/awf.mjs statusline",
    "padding": 0
  }
}
```

If you ran `npm link` in your clone, `awf statusline` works there too.

**The plugin alone isn't enough.** Claude Code runs this command from your settings, so it needs a path that stays put, and the plugin's folder changes with each version. Install the npm CLI for the status line, next to the plugin. They share `~/.awf/`, so the line uses the plugin's recorded events.

## Keep your status line

Installing the plugin doesn't touch your `statusLine`. Only the setup above replaces it.

Claude Code shows each line the command prints on its own row, so one script can run both. Save this as `~/.claude/statusline.sh`, with your old command on the third line, and run `chmod +x ~/.claude/statusline.sh`:

```bash
#!/bin/bash
input=$(cat)
printf '%s' "$input" | ~/.claude/your-status-line.sh
printf '%s' "$input" | awf statusline
```

From source, use `node /path/to/awf/dist/awf.mjs statusline` in place of `awf statusline`. Then point `statusLine` at the script:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 0
  }
}
```

For a context bar above awf's line, use this script instead. It needs `jq`:

```bash
#!/bin/bash
input=$(cat)
pct=$(printf '%s' "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
printf -v used '%*s' "$((pct / 10))" ''
printf -v left '%*s' "$((10 - pct / 10))" ''
echo "context ${used// /▓}${left// /░} $pct%"
printf '%s' "$input" | awf statusline
```

```text
context ▓▓▓░░░░░░░ 34%
tests 3% · build 32% · scripts 26% · 9 failed · rework 9s
```

Claude Code doesn't draw this bar itself. On its own it only shows context use near the limit, as `12% until auto-compact`.

## How it works

Claude Code sends the session's `transcript_path` on stdin. awf reads that transcript (and the plugin's recorded events, when there are any) and keeps the line in `~/.awf/cache/statusline/` until the transcript, the recorded events or a subagent's transcript changes, so a repeat costs about 30 ms. Reading a long session again takes as long as `awf summary` does (0.4s for an 8 MB transcript). Lines of sessions untouched for 30 days are deleted.

It never breaks the status line: on any error it prints nothing and exits 0. Run it with `AWF_DEBUG=1` to see the error on stderr.

`--json` prints the phases, failures and rework as JSON, and isn't cached.

## Try it by hand

Run it on your latest session:

```bash
echo '{"transcript_path": "'"$(ls -t ~/.claude/projects/*/*.jsonl | head -1)"'"}' | awf statusline
```

From source, end the line with `| node /path/to/awf/dist/awf.mjs statusline` instead.

If it prints nothing, put `AWF_DEBUG=1` in front of the last command: `| AWF_DEBUG=1 awf statusline`. For example, a bad rule in `.awf/rules.yaml` prints:

```text
awf statusline: /path/to/repo/.awf/rules.yaml commands[0]: unknown phase "test"; use one of lint, tests, build, exploring, writing, running, planning, waiting, neutral
```

It also prints nothing until the session has some working time, and that isn't an error.
