# awf documentation

New here? Start with the [README](../README.md): install, your first report and troubleshooting.

## Using awf

- [Phases](phases.md): each phase, and the rules that decide it
- [Rules](rules.md): teach awf your own scripts and tools in `.awf/rules.yaml`
- [Status line](statusline.md): the session's phase split in Claude Code's status line
- [Live board](live.md): every active Claude Code session in a terminal tab
- [Using awf from an agent](agents.md): running awf from an agent, and its JSON output
- [Build drill-down](build-drilldown.md): a build's slowest tasks in the report
- [Other agents](other-agents.md): the experimental Codex CLI, Gemini CLI and OpenCode importers
- [Sample report](sample-report.html): a report of a made-up session. GitHub shows HTML as source, so download it and open it in your browser.

## Internals

- [Transcript format](transcript-format.md): Claude Code's transcripts, as awf reads them
- [Hook events](hook-events.md): the Claude Code hook events the recorder uses
- [PLAN.md](../PLAN.md): the build plan, with each milestone's checks

For working on awf itself, see [CONTRIBUTING.md](../CONTRIBUTING.md).
