# Other agents

awf reads three more agents' session logs, read-only, into the same steps as Claude Code. Each importer turns the agent's log into the recorder's events, so the same rules make the steps: model time is time with no call in flight, idle time sits between turns. Tool names are mapped to Claude Code's (a shell call is `Bash`, a file edit `Edit`), so the phase rules apply unchanged.

**These three importers are experimental.** They're tested only on the hand-made logs in `fixtures/codex`, `fixtures/gemini` and `fixtures/opencode`, written from each format: the same small task (a failing test, a look at the code, one edit, the test passing). None has read a real session yet, so expect gaps.

**You can help.** If you use one of these agents, run `awf import --agent <name>` (`codex`, `gemini` or `opencode`), then `awf report <id> --open`, and [open an issue](https://github.com/Jccorzo/awf/issues) saying what looks wrong. `awf summary <id> --share` prints the phases without the task, folder, commands or files, so you can paste that.

A scrubbed real log would help most, so that it can become a fixture. Never post a raw one: logs hold your prompts, file contents, tool output and paths. Replace those by hand and keep the structure, keys, timestamps and tool names. `pnpm scrub` doesn't do this yet. It's written for Claude Code: it skips Gemini's and OpenCode's `.json` files, and on Codex logs it also blanks the commands and call IDs an importer needs.

| Agent      | Where                                                          | What gives the timings                                                                                                                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Codex CLI  | `$CODEX_HOME/sessions/YYYY/MM/DD/rollout-*.jsonl` (`~/.codex`) | Every line's `timestamp`. A call starts at its `function_call` (or `custom_tool_call`, `local_shell_call`) line and ends at its output line; the output's `exit_code` and `duration_seconds` give the result and run time. `token_count` events give each model call's tokens.             |
| Gemini CLI | `~/.gemini/tmp/<project hash>/chats/session-*.json`            | Message timestamps. A model reply is logged when it's complete; its tool calls start then and each is stamped when it ended. Calls of one reply are taken to run together. The project folder is found by hashing the folders the tools touched until one matches the file's project hash. |
| OpenCode   | `~/.local/share/opencode/storage/` (`$XDG_DATA_HOME`)          | Tool parts carry their own start and end times; messages their created and completed times. A `task` call's subagent session nests under it.                                                                                                                                               |

## Mapping

| Agent's tool                                                     | awf tool                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Codex `shell`, `exec_command`, `local_shell`                     | `Bash` (`bash -lc "x"` is the command `x`; a `workdir` other than the session's becomes `cd dir && x`) |
| Codex `apply_patch`                                              | `Edit` (`Write` when it adds one file), with the patch's files                                         |
| Gemini `run_shell_command`                                       | `Bash`, exit code from the result's `Exit Code:` line                                                  |
| Gemini `read_file`, `write_file`, `replace`                      | `Read`, `Write`, `Edit`                                                                                |
| OpenCode `bash`, `read`, `write`, `edit`, `grep`, `glob`, `task` | `Bash`, `Read`, `Write`, `Edit`, `Grep`, `Glob`, `Agent`                                               |
| MCP tools (`server__tool`)                                       | `mcp__server__tool`                                                                                    |

## What's approximate

- **Gemini** stamps a call when it ended, not when it started; awf starts it when the reply that made it was logged. Calls of one reply that really ran one after another show as overlapping.
- **Codex** files older than the `{timestamp, type, payload}` line format carry no timings; their lines are counted as unknown (`awf import` lists them) and skipped.
- None of the three logs approval prompts the way Claude Code's hooks do, so time spent waiting for your approval counts as the call's own.
- Session titles: Codex and Gemini use the first prompt (only in the report, like Claude Code); OpenCode uses its own generated title.

`awf import` reads all four agents (`--agent` picks one), and every command takes a session ID from any of them, or the path of one of their files.
