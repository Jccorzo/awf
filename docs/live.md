# Live board

`awf live` shows every active Claude Code session at a glance, in a terminal tab you leave open. It reads the transcripts, so it shows the desktop app's sessions too, where the status line never appears:

```text
awf live · 4 active · every 20s · 22:41
acme-billing/web   CI pipeline for demo-000…    working     tests 35% · build 33% · explore 12% · 12 failed
deploys            Cache key rollout…           your turn   tests 4% · scripts 57% · explore 23% · rework 14m
notes-website      how does this work…          working     tests 18% · scripts 24% · code 15% · 10 failed
acme-billing/api   PR checks for …              idle 12m    tests 0% · unclassified 52% · explore 24%
```

It's Claude Code only, and it runs in a terminal, so it needs the npm CLI or a build from source. See [Install](../README.md#install).

## What it lists

It lists the sessions active in the last 2 hours (`--since`), newest first, at most 10 (`--limit`). Activity is the transcript's last entry, or a subagent's transcript changing, not the time the transcript's file changed: Claude Code adds entries without a time when a session's process exits or the app reopens it, which would bring back sessions untouched for days.

Each row has the folder the session started in (relative to your home, without `Documents` and other folders that only hold projects), the session's title or first prompt, its state, and the [status line's](statusline.md) phase split (`--pin` works as it does there).

## States

The state comes from the end of the transcript:

- **working**: a turn is under way (a model or tool call is open), or background tasks or subagents it started are still running. A server left running in the background (`pnpm dev`, `next dev`, `cloud-sql-proxy`, `PORT=8080 ./api`) doesn't count: the agent comes back when background work ends, and a server doesn't end. `--json` counts them in `servers`.
- **approval?**: a permission prompt is waiting. Only the awf plugin's recorder sees these; without it, a call waiting for your approval reads as working.
- **your turn**: the turn ended, or a question waits for your answer.
- **idle 12m**: your turn for 5 minutes or more.

When the session's process exits (you quit it, or the app restarts it), whatever it was running ends with it, and the row shows your turn.

## Redrawing

The board is redrawn in place every 20 seconds (`--every`), fitted to the terminal's width, until Ctrl-C. Phase lines share the status line's cache, so a pass reads only the sessions that changed. The first pass reads every session: 1.9s for 10 sessions and 53 MB of transcripts, showing the rows at once and filling in phase lines as they come. A pass with nothing changed takes about 5 ms.

`--once` prints one pass and exits, as it does when the output isn't a terminal; `--json` prints that pass as JSON.

A transcript awf can't read is left off the board, and a session whose phase split can't be worked out shows without one (`AWF_DEBUG=1` says why).
