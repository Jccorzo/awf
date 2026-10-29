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

| `type`            | Read for                                                                                                                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`            | Prompts, and tool results (`message.content[]` blocks of type `tool_result`)                                                                                                                                                                                                |
| `assistant`       | One content block per line: `thinking`, `text` or `tool_use`. Lines of one model response share `message.id` and `message.usage`                                                                                                                                            |
| `system`          | `subtype` `turn_duration` and `stop_hook_summary` (a turn ended), `compact_boundary` (a compaction, with `compactMetadata.durationMs` and `trigger`); `api_error`, `away_summary`, `local_command`, `informational`, `agents_killed`, `bridge_status` are known and skipped |
| `queue-operation` | `operation: "enqueue"` with a `<task-notification>` in `content`: when a background task finished                                                                                                                                                                           |
| `attachment`      | Skipped, except `<task-notification>` text inside it. Over 40 attachment types exist (`hook_success` with `durationMs`, `queued_command`, `edited_text_file`, ...)                                                                                                          |

Known and skipped: `summary`, `last-prompt`, `ai-title`, `custom-title`, `agent-name`, `mode`, `permission-mode`, `atis-latch`, `cost-state`, `pr-link`, `file-history-snapshot`, `file-history-delta`, `api-request`, `api-request-blob`, `api-request-shape`, `bridge-session`, `relocated`, `frame-link`, `artifact-autoreact-ledger`, `artifact-comment-monitor`, `tools-used`, `fork-context-ref`, `progress`.

`api-request` (2.1.30x and later, about half of recent transcripts) marks when each model request was sent; assistant lines point to it with `requestRef`. awf doesn't need it: model time is measured the same way as from hooks (below), which keeps the two sources comparable.

## Prompts

A `user` entry whose content isn't a tool result. Since about 2.1.28, `origin.kind` says who sent it:

| `origin.kind`          | Meaning                      | awf                                     |
| ---------------------- | ---------------------------- | --------------------------------------- |
| `human`                | You                          | Starts a turn                           |
| `task-notification`    | A background task finished   | Starts a turn flagged as a notification |
| `peer` (with `isMeta`) | A message from another agent | Starts a turn flagged as a notification |

Without `origin` (older versions): plain text and `<command-name>` (slash commands) are yours; `isMeta` entries, `<system-reminder>`, `<local-command-stdout>`, `<local-command-caveat>` and `<bash-input>` are not turns. `isCompactSummary` entries are compaction summaries. `[Request interrupted by user]` ends the turn where it stands.

A turn ends at the next prompt, at the end of the file, or at the latest `turn_duration` / `stop_hook_summary` entry before them.

## Tool calls

- A call starts at its `tool_use` line's timestamp. Claude Code starts executing a call as soon as its block is complete, so that is also when the call began running.
- It ends at the `user` line holding the `tool_result` with the same `tool_use_id`.
- `is_error: true` marks a failure. A failed Bash call's content starts with `Exit code N`; its `toolUseResult` is the string `Error: Exit code N ...`.
- `toolUseResult` holds the structured result. Keys read: `interrupted`, `backgroundTaskId` (Bash with `run_in_background`), `agentId` and `agentType` (Agent calls). About 40% of tool results have no `toolUseResult`; nothing depends on it.
- `permissionDecision` on the result says who allowed the call: `source: "config"` (rules, the classifier, the permission mode), `"user_temporary"` / `"user_reject"` (you, so the call waited for you), or `"hook"`. `decision: "reject"` means denied.
- All `tool_use` blocks of one `message.id` form a batch; it is done when every one has a result.
- Browser calls (Claude in Chrome, `mcp__claude-in-chrome__*`; the desktop app's built-in browser, `mcp__Claude_Browser__*`) name what they did in their input: a `computer` call's `input.action` (`screenshot`, `left_click`, `wait`), and a `browser_batch` call's `input.actions`, a list of `{ name, input }`. Computer use's `computer_batch` lists `{ action, ... }`, each action also the name of its own tool. awf keeps only these names, never URLs, typed text or selectors.

## Subagents

An `Agent` call (`Task` in older versions) has `input.subagent_type`. Its result's `toolUseResult.agentId` names the subagent, whose transcript is `subagents/agent-<agentId>.jsonl`. With `isAsync: true` (`status: "async_launched"`) the call returns at once and the subagent runs in the background; its completion arrives later as a `<task-notification>` with the agent ID as `<task-id>`.

No transcript from the last 30 days kept subagent entries in the main file; the importer still reads `isSidechain` entries there as subagent steps.

## Background tasks

A background Bash call returns `Command running in background with ID: <id>` and `toolUseResult.backgroundTaskId`. When the task ends, Claude Code queues a notification:

```text
<task-notification><task-id>…</task-id><tool-use-id>…</tool-use-id><status>completed|failed|killed|stopped</status><summary>…</summary>…</task-notification>
```

It appears in a `queue-operation` (`enqueue`, when the task ended), often again in an attachment, and as a `user` prompt with `origin.kind: "task-notification"` (when it reached the model). awf takes the earliest as the end of the background step.

## Version notes

| Versions               | Difference                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| 2.1.18x and later      | Subagents in `subagents/agent-*.jsonl`; `system` `turn_duration` entries                            |
| about 2.1.28 and later | `origin.kind` on prompts, `permissionDecision` on tool results                                      |
| 2.1.30x and later      | `api-request`, `api-request-blob`, `api-request-shape` entries                                      |
| 2.1.309                | Assistant lines carry `wireToolInputs`, a copy of tool inputs; the scrubber treats it as tool input |
