# Claude Code transcript format, as awf reads it

Studied on 2026-10-28 from the structure (types, keys, IDs, never content) of transcripts written by Claude Code 2.1.181 to 2.1.312, plus three fixtures in `fixtures/claude-code/` (2.1.309 and 2.1.312).

Claude Code's docs call this format internal: it changes between versions. The importer reads what is listed here, counts everything else as unknown (`awf import`, `awf doctor`), and never stops on it.

## Files

| Path under `~/.claude/projects/`                                 | What it is                                                                                                                                      |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `<project>/<session-id>.jsonl`                                   | The session's main transcript. `<project>` is the session's working directory with every character other than a letter or digit replaced by `-` |
| `<project>/<session-id>/subagents/agent-<agent-id>.jsonl`        | One subagent's transcript. Its entries carry `agentId` and `isSidechain: true`                                                                  |
| `<project>/<session-id>/subagents/agent-<agent-id>.meta.json`    | Subagent metadata (`agentType`, `toolUseId`, ...). Not read                                                                                     |
| `<project>/<session-id>/subagents/workflows/<run>/journal.jsonl` | A workflow's journal (`started`, `result`, `failed`). Not a transcript; skipped                                                                 |
| `<project>/<session-id>/tool-results/`                           | Large tool outputs saved to disk. Not read                                                                                                      |

Transcripts are deleted after 30 days by default. `awf import` keeps their timings in `~/.awf/imported/`.

## Entries

One JSON object per line. Most carry `type`, `timestamp` (ISO 8601, ms), `uuid`, `parentUuid`, `sessionId`, `cwd`, `version` (Claude Code version) and `isSidechain`.

| `type`            | Read for                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`            | Prompts, and tool results (`message.content[]` blocks of type `tool_result`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `assistant`       | One content block per line: `thinking`, `text` or `tool_use`. Lines of one model response share `message.id` and `message.usage`. Claude Code writes some itself, with `message.model` `<synthetic>` and no tokens: no model call made them, so they add no model time and start no turn. One can come days after the turn's last call (after a rejected plan, or a notice the model never answered); before 2026-11-05 awf counted that gap as model time, 112 hours in 8 sessions. An API error is written the same way, with `isApiErrorMessage`, and ends the turn |
| `system`          | `subtype` `turn_duration` and `stop_hook_summary` (a turn ended), `compact_boundary` (a compaction, with `compactMetadata.durationMs` and `trigger`, see [Compactions](#compactions)); `api_error`, `away_summary`, `local_command`, `informational`, `agents_killed`, `bridge_status` are known and skipped                                                                                                                                                                                                                                                           |
| `queue-operation` | `operation: "enqueue"` with a `<task-notification>` in `content`: when a background task finished                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `api-request`     | When a model request was sent (2.1.300 and later). An assistant line's `requestRef` names the one it answers. A request sent again after an API error, a timeout or a rate limit repeats the entry                                                                                                                                                                                                                                                                                                                                                                     |
| `attachment`      | Skipped, except `<task-notification>` text inside it. Over 40 attachment types exist (`hook_success` with `durationMs`, `queued_command`, `edited_text_file`, ...)                                                                                                                                                                                                                                                                                                                                                                                                     |

Known and skipped: `summary`, `last-prompt`, `ai-title`, `custom-title`, `agent-name`, `mode`, `permission-mode`, `atis-latch`, `cost-state`, `pr-link`, `file-history-snapshot`, `file-history-delta`, `api-request-blob`, `api-request-shape`, `bridge-session`, `relocated`, `frame-link`, `artifact-autoreact-ledger`, `artifact-comment-monitor`, `tools-used`, `fork-context-ref`, `continued-in`, `progress`.

`api-request` (2.1.300 and later) marks when each model request was sent; assistant lines point to the one they answer with `requestRef`. A request normally goes out within a second of the result it answers (median 30 ms), so model time is measured the same way as from hooks (below), which keeps the two sources comparable. The exception: when the same request was sent more than once since the agent's last input (identical requests, at backoff intervals, sometimes for an hour, often with a cold cache on the answer), the agent wasn't generating until the send that was answered, and model time starts there. In 30 days of transcripts, 443 answers had a resent request and 78 waited more than a minute, mostly in subagents.

## Prompts

A `user` entry whose content isn't a tool result. Since about 2.1.28, `origin.kind` says who sent it:

| `origin.kind`          | Meaning                      | awf                                     |
| ---------------------- | ---------------------------- | --------------------------------------- |
| `human`                | You                          | Starts a turn                           |
| `task-notification`    | A background task finished   | Starts a turn flagged as a notification |
| `peer` (with `isMeta`) | A message from another agent | Starts a turn flagged as a notification |

Without `origin` (older versions): plain text and `<command-name>` (slash commands) are yours; `isMeta` entries, `<system-reminder>`, `<local-command-stdout>`, `<local-command-caveat>` and `<bash-input>` are not turns. `isCompactSummary` entries are compaction summaries: not turns, and not messages the model answers. `[Request interrupted by user]` ends the turn where it stands.

A turn ends at the next prompt, at the end of the file, or at the latest `turn_duration` / `stop_hook_summary` entry before them.

## Tool calls

- A call starts at its `tool_use` line's timestamp. Claude Code starts executing a call as soon as its block is complete, so that is also when the call began running.
- It ends at the `user` line holding the `tool_result` with the same `tool_use_id`.
- `is_error: true` marks a failure. A failed Bash call's content starts with `Exit code N`; its `toolUseResult` is the string `Error: Exit code N ...`.
- `toolUseResult` holds the structured result. Keys read: `interrupted`, `backgroundTaskId` (Bash with `run_in_background`), `agentId` and `agentType` (Agent calls), `taskId`, `timeoutMs` and `persistent` (Monitor calls). About 40% of tool results have no `toolUseResult`; nothing depends on it.
- `permissionDecision` on the result says who allowed the call: `source: "config"` (rules, the classifier, the permission mode), `"user_temporary"` / `"user_reject"` (you, so the call waited for you), or `"hook"`. `decision: "reject"` means denied.
- All `tool_use` blocks of one `message.id` form a batch; it is done when every one has a result.
- Browser calls (Claude in Chrome, `mcp__claude-in-chrome__*`; the desktop app's built-in browser, `mcp__Claude_Browser__*`) name what they did in their input: a `computer` call's `input.action` (`screenshot`, `left_click`, `wait`), and a `browser_batch` call's `input.actions`, a list of `{ name, input }`. Computer use's `computer_batch` lists `{ action, ... }`, each action also the name of its own tool. awf keeps only these names, never URLs, typed text or selectors.

## Subagents

An `Agent` call (`Task` in older versions) has `input.subagent_type`. Its result's `toolUseResult.agentId` names the subagent, whose transcript is `subagents/agent-<agentId>.jsonl`. With `isAsync: true` (`status: "async_launched"`) the call returns at once and the subagent runs in the background; its completion arrives later as a `<task-notification>` with the agent ID as `<task-id>`.

No transcript from the last 30 days kept subagent entries in the main file; the importer still reads `isSidechain` entries there as subagent steps.

## Background tasks

A background Bash call returns `Command running in background with ID: <id>` and `toolUseResult.backgroundTaskId`. Some subagent transcripts have no `toolUseResult`; awf then reads the task ID from that text, only when the result starts with it. When the task ends, Claude Code queues a notification:

```text
<task-notification><task-id>…</task-id><tool-use-id>…</tool-use-id><status>completed|failed|killed|stopped</status><summary>…</summary>…</task-notification>
```

It appears in a `queue-operation` (`enqueue`, when the task ended), often again in an attachment (a `queued_command`, also in a subagent's transcript for its own tasks, timestamped when the task ended but written when the agent read it), and as a `user` prompt with `origin.kind: "task-notification"` (when it reached the model). awf takes the earliest as the end of the background step.

A task stopped with TaskStop (KillShell in older versions) gets no notification; its background step ends at the stop's result.

### Monitors

A `Monitor` call (seen from 2.1.283) runs `input.command` in the background and streams each line it prints back as an event, until the command exits, `input.timeout_ms` passes (default 5 minutes, capped at 30), or a TaskStop stops it. It returns at once: `Monitor started (task <id>, expires in 20m ...)`, with `toolUseResult` `{ taskId, timeoutMs, persistent }`. Some subagent transcripts (2.1.299, 2.1.309) have no `toolUseResult`; awf then reads the task ID from that text. A Monitor with a WebSocket source (`input.ws`) has no command.

Each event is a `<task-notification>` with the task ID, a `<summary>Monitor event: "…"</summary>` and an `<event>`, but no `<status>` and no `<tool-use-id>`, in a `queue-operation`, an attachment or a `task-notification` prompt. The end is a notification like a background shell's, with `<tool-use-id>` and `<status>completed|killed</status>` (sometimes with a last `<event>`); `killed` when Claude Code stopped it, at its timeout or when it exited. awf takes a notice as a task's end only when it has a status. With no end notice, a Monitor's step ends at its timeout or at the transcript's last entry, whichever comes first.

## Compactions

A `system` entry with `subtype: "compact_boundary"`, written when the compaction ended, its `compactMetadata` holding `durationMs` and `trigger` (`auto` or `manual`); a `user` entry with `isCompactSummary: true` follows. awf times the compaction from `durationMs` before the entry to the entry.

| Kind                            | What the transcript shows                                                                                                                                                                                                                                 | awf                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Inside a turn                   | `trigger: "auto"` while a turn is running                                                                                                                                                                                                                 | Unclassified, tagged `compaction`                                                                                  |
| `/compact`                      | `trigger: "manual"`; the `<command-name>/compact</command-name>` prompt is written after the boundary, timestamped when you sent it                                                                                                                       | Unclassified, tagged `compaction`                                                                                  |
| While idle (2.1.292 and later)  | `trigger: "auto"` after the turn ended, about 54 minutes later, before the prompt cache expires, then a `system` `informational` entry: "Compacted while idle, before the prompt cache expired". Nothing in `compactMetadata` says so: no turn is running | No turn running and not `manual`: Waiting on you between turns, left out after the last turn ([phases](phases.md)) |
| Precomputed (2.1.308 and later) | A summary written while you were away, applied at your next prompt: `trigger: "auto"`, `precomputed: true`, a `durationMs` of a few milliseconds, and an `informational` entry: "Compacted using a summary written while you were away"                   | Inside the turn, like any other                                                                                    |

## Resumed sessions

Resuming can write a new file under a new session ID that repeats entries of the old one, with the same `tool_use` IDs and the same timestamps. Three shapes, from `awf import`'s timings for the last 30 days (2.1.309 to 2.1.316) and a recorder file, not from the entries themselves:

| Shape               | What's there                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A copy left behind  | The new file stops where it was written and the old one carries on. The recorder has one event under the new ID: `SessionStart` with `source: "resume"`. Seen on 2.1.309 in the desktop app |
| The whole history   | The new file repeats every call of the old one, then carries on. The old file holds one `continued-in` entry (2.1.316)                                                                      |
| Part of the history | The same, repeating only the old session's later calls: 251 of 1,357 in the one seen, where the old session's recorder events stop 4 calls short of its transcript                          |

Start times don't tell these from sessions started together: of the 11 pairs in those 30 days that started within 2 seconds of each other in one folder, 9 shared no calls. A `toolu_` ID does: each belongs to one model response. `sessions`, `stats`, `sample`, `compare` on ranges and `live` use it to count repeated work once. `summary`, `classify` and `report` show a session's file as it is.

## Version notes

| Versions               | Difference                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| 2.1.18x and later      | Subagents in `subagents/agent-*.jsonl`; `system` `turn_duration` entries                              |
| about 2.1.28 and later | `origin.kind` on prompts, `permissionDecision` on tool results                                        |
| 2.1.283 and later      | `Monitor` calls                                                                                       |
| 2.1.292 and later      | Compactions while idle                                                                                |
| 2.1.30x and later      | `api-request`, `api-request-blob`, `api-request-shape` entries                                        |
| 2.1.309                | Assistant lines carry `wireToolInputs`, a copy of tool inputs; the scrubber treats it as tool input   |
| 2.1.316                | `continued-in` entries in a session carried on under a new ID ([Resumed sessions](#resumed-sessions)) |

## What `awf live` reads

`awf live` (src/live/state.ts) reads a few entries the importer skips, to tell whether a session is working or waiting for you. Studied on 2026-10-30 from the structure of transcripts by Claude Code 2.1.181 to 2.1.312, from the terminal (`entrypoint: "cli"`) and the desktop app (`"claude-desktop"`, which runs Claude Code headless with `--output-format stream-json` and writes its transcripts to the same place).

| Entry or field                                                                                 | Read as                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `custom-title` (`customTitle`), `ai-title` (`aiTitle`)                                         | The session's name, then Claude Code's title for it; both are written again and again, the last one counts                                                                                                                                                                                                                                                                                                                                                                                      |
| `message.stop_reason` on assistant lines                                                       | `end_turn` (`stop_sequence` on API errors) with no tool call ends the turn. Every line of a response carries the response's final stop reason. The desktop app writes no `turn_duration`; it writes a `stop_hook_summary` after most turns                                                                                                                                                                                                                                                      |
| `api-request` after a turn ended                                                               | The agent works again (it answers a notice or a queued message); `querySource` is `repl_main_thread` from the terminal and `sdk` from the app                                                                                                                                                                                                                                                                                                                                                   |
| `<local-command-stdout>` right after a prompt                                                  | A slash command that ran without the model (`/model`, `/login`): its turn is over                                                                                                                                                                                                                                                                                                                                                                                                               |
| `toolUseResult.taskId` of `Monitor` and `Workflow`                                             | A task running in the background, like `backgroundTaskId` and async `agentId`. A monitor's events arrive as `<task-notification>`s with an `<event>` and no `<status>`; only a notice with a `<status>` ends a task                                                                                                                                                                                                                                                                             |
| `cost-state`                                                                                   | Written when the process exits. 353 of 404 are a file's last entries; a session whose process never exited has none. Everything in flight before one died: of the background tasks and calls still open at a `cost-state`, the 9 that reported back did so as `killed` (when the session was resumed, up to two days later), and 3 calls got killed-by-signal results (exit 137 or 144) within 2 minutes. A desktop session's `cost-state` was written the moment the app restarted its process |
| Timestamps of `user`, `assistant`, `system`, `api-request`, `queue-operation` and `attachment` | The session's activity. A file can change long after its last such entry: Claude Code writes entries without a time (`cost-state`, `last-prompt`, `mode`, `atis-latch`, `bridge-session`) when the process exits or the app reopens the session. `pr-link` and `file-history-delta` carry a time but aren't activity                                                                                                                                                                            |
| A background `Bash` call's `input.command`                                                     | A server when it serves or watches until stopped (`pnpm dev`, `next dev`, `cloud-sql-proxy`, `PORT=8080 ./api`, `node server.mjs`): it doesn't keep the session working. Servers run until they're killed or fail. Other shells often outlast the turn, mostly CI polls the agent comes back from later                                                                                                                                                                                         |
