# Claude Code hook events used by the recorder

Source: [Claude Code hooks reference](https://code.claude.com/docs/en/hooks), read on 2026-10-28 (Claude Code 2.1.312).

The recorder is one async command hook (`plugin/hooks/hooks.json`) registered on the events below. Each run reads the event JSON from stdin and appends one line to `~/.awf/events/<session_id>.jsonl`. It never stores prompts, tool input bodies, tool output or assistant text.

## Fields every event carries

| Field                    | Use in awf                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `session_id`             | Picks the events file                                                                             |
| `transcript_path`        | Saved, so the report can read details later (tokens, output)                                      |
| `cwd`                    | Saved on session and prompt events; the classifier resolves `package.json` and `Makefile` from it |
| `permission_mode`        | Saved on prompt events (`default`, `plan`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`) |
| `hook_event_name`        | The event                                                                                         |
| `prompt_id`              | Groups the steps of one prompt. Absent before the first prompt                                    |
| `agent_id`, `agent_type` | Present when the hook fires inside a subagent. See below                                          |

No event carries a timestamp. The recorder uses the moment its own process started (`performance.timeOrigin`), which is when Claude Code spawned the hook, so Node's startup time doesn't shift the reading.

## Event-specific fields

| Event                       | Fields awf reads                                                                      | What awf records                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `SessionStart`              | `source` (`startup`, `resume`, `clear`, `compact`, `fork`), `model` (not always sent) | Session start                                                                                                                       |
| `UserPromptSubmit`          | `prompt` (never stored)                                                               | A turn starts; model time starts                                                                                                    |
| `PreToolUse`                | `tool_name`, `tool_input`, `tool_use_id`                                              | A tool call starts: tool, Bash command (secrets masked, heredoc bodies dropped), file path, background flag, a hash of `tool_input` |
| `PermissionRequest`         | `tool_name`, `tool_input`, no `tool_use_id`                                           | The call waits for approval. Paired with its `PreToolUse` by tool name and `tool_input` hash                                        |
| `PermissionDenied`          | `tool_name`, `tool_input`, `tool_use_id`, `reason` (not stored)                       | The call was denied                                                                                                                 |
| `PostToolUse`               | `tool_use_id`, `tool_response` (only IDs are read), `duration_ms`                     | The call ends with success. `duration_ms` is execution time without permission prompts and PreToolUse hooks                         |
| `PostToolUseFailure`        | `tool_use_id`, `error` (not stored), `is_interrupt`, `duration_ms`                    | The call ends with failure; `is_interrupt` marks an abort                                                                           |
| `PostToolBatch`             | `tool_calls[].tool_use_id` (responses not stored)                                     | All calls of a batch are done; model time starts again                                                                              |
| `SubagentStart`             | `agent_id`, `agent_type`                                                              | A subagent starts                                                                                                                   |
| `SubagentStop`              | `agent_id`, `agent_type`, `agent_transcript_path`                                     | A subagent ends                                                                                                                     |
| `Stop`                      | `background_tasks[]` (`id`, `type`, `command`)                                        | The turn ends; background shells still running                                                                                      |
| `StopFailure`               | `error` (`rate_limit`, `overloaded`, `server_error`, ...)                             | The turn ends on an API error                                                                                                       |
| `PreCompact`, `PostCompact` | `trigger` (`manual`, `auto`)                                                          | Context compaction starts and ends                                                                                                  |
| `SessionEnd`                | `reason` (`clear`, `resume`, `logout`, `prompt_input_exit`, `other`)                  | Session end, and the transcript path                                                                                                |

From `tool_response` the recorder keeps two IDs and nothing else: `agentId` on an `Agent`/`Task` call (which subagent it ran) and `backgroundTaskId` on a background Bash call.

## How a tool call inside a subagent is identified

Hooks configured in settings and plugins also fire inside subagents. When a subagent calls a tool, `PreToolUse`, `PostToolUse` and the other tool events carry `agent_id` (the subagent's unique ID) and `agent_type` (for example `Explore`). In the main thread the fields are absent, except `agent_type` when the session runs with `--agent`.

awf nests a subagent's steps like this:

1. `PreToolUse` for `Agent` (or `Task`, its older name) in the parent opens the call.
2. `SubagentStart` carries the new subagent's `agent_id`. awf creates a subagent step under the open `Agent` call with the same `subagent_type`.
3. Every tool event with that `agent_id` nests under the subagent step and runs its own model-time clock.
4. `SubagentStop` closes it. `PostToolUse` for the `Agent` call carries `tool_response.agentId`, which confirms the link.

A background agent (`run_in_background: true`) returns from its `Agent` call at once; its subagent step keeps running and is flagged background.

## Timing rules

- Model time starts at `UserPromptSubmit`, and again when a batch of tool calls is done (`PostToolBatch`; on versions without it, when the last open call ends). It stops at the next `PreToolUse`, `Stop` or `SubagentStop`.
- `PostToolUse` fires once per call, concurrently for parallel calls. `PostToolBatch` fires once after every call in the batch has resolved.
- A call that needed approval (`PermissionRequest`) has `duration_ms` for its execution. The rest of its time, from `PreToolUse` to `PostToolUse`, is the wait for you. Without `duration_ms`, everything after the request counts as waiting.
- Async hooks are spawned in the background, so they add no delay to Claude. In `claude -p`, Claude Code kills async hooks still running at teardown; a test run lost its last `Stop` that way. So `Stop`, `StopFailure` and `SessionEnd` run synchronously: they fire after the turn's work is done, take about 40 ms, and can't shift a measured step.
- Claude Code starts a call as soon as the model has written it, while the model keeps writing the rest of the batch. So model time runs whenever the agent has no call in flight, including the gap between one call of a batch ending and the next starting.
- A turn that a background task's completion notice started (not you) is flagged. The recorder checks only whether the prompt starts with `<task-notification>`; it never stores the prompt.
- `transcript_path` may lag the current turn; awf only reads the transcript after the session.

## Measured lag (2026-10-28, Claude Code 2.1.312, `claude -p`, Haiku)

Hook timestamps against the transcript's own timestamps for the same moments, in one recorded session:

| Moment                                                    | Hook minus transcript |
| --------------------------------------------------------- | --------------------- |
| Prompt submitted                                          | +13 ms                |
| Tool call starts (`PreToolUse` vs its `tool_use` entry)   | +19 to +28 ms         |
| Tool call ends (`PostToolUse` vs its `tool_result` entry) | +10 to +15 ms         |

The lag is the time Claude Code takes to spawn the hook process. It is about the same at both ends of a call, so durations agree: each call's hook span matched its `duration_ms` within 0 to 16 ms. The session's duration (first prompt to `Stop`, 9.86 s) plus the CLI's startup (4.87 s) and teardown (0.60 s) matched the wall clock around the `claude -p` run (15.32 s).
