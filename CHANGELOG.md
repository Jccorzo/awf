# Changelog

Notable changes to awf. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The npm package is `agent-waterfall`. The command is `awf`.

## [Unreleased]

The first public release, planned as 0.1.0.

### Added

- `awf sessions`: sessions with start time, duration, turns and tool calls.
- `awf import`: reads past sessions from Claude Code, Codex CLI, Gemini CLI and OpenCode into awf's cache.
- `awf classify`: every step of a session with its phase and the rule that decided it.
- `awf summary`: time per phase, with check runs, failures and rework.
- `awf report`: one self-contained HTML waterfall, with phases, every step on a time axis, failures, rework, slowest steps and build tasks. `--share` writes a copy with phases, durations and tool names only.
- `awf compare`: two sessions or two date ranges side by side.
- `awf stats`: Bash time by phase across sessions, and the unclassified programs that need rules.
- `awf statusline`: one short line for Claude Code's status line, with the current session's phase split so far.
- `awf live`: a board of every active Claude Code session, redrawn in place, with project, task, state and phase split.
- `awf sample` and `awf accuracy`: check the classifier against your own labels.
- `awf doctor`: what awf can read, and log entries it doesn't recognise.
- `awf purge`: deletes everything awf stored.
- A Claude Code plugin that records new sessions through hooks and adds `/awf:waterfall`.
- Project rules in `.awf/rules.yaml`.

[Unreleased]: https://github.com/Jccorzo/awf/commits/main
