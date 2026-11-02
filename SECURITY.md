# Security

awf runs on your machine. `src/` has no network code: lint forbids it, the tests run with the network blocked, and the report's page blocks every request. So the risks are in what awf reads and what it writes.

## Report a problem

Report it privately at <https://github.com/Jccorzo/awf/security/advisories/new>. Please don't open a public issue.

Include the awf version, the steps to reproduce and what you expected. Use a made-up example, not a real session. If a problem depends on the format of a secret, use a fake value in that format.

Fixes go into the latest release.

## What counts

**Secrets that survive masking.** awf masks secrets by pattern before it stores or shows a command or output. A real secret format that gets through is a valid report, wherever it shows up:

- in a full report, which shows commands, file paths, the first prompt and tool output
- in a `--share` copy, which must hold only phases, durations and tool names, so any command, path, prompt, file or project name in one is also a bug, secret or not
- in what awf stores under `~/.awf/`
- in fixtures written by `pnpm scrub`

**Code execution from reading a project's files.** To classify commands, awf reads `package.json`, Makefiles, `deno.json`, `.awf/rules.yaml`, git hooks and shell scripts from the projects a session worked in. Those files can come from a repo you don't trust. awf reads them as text and never runs them. These are all valid reports:

- a project file that makes awf run something
- a project file that hangs awf, such as a regex in `.awf/rules.yaml`
- text in a session or a project file that runs as script in the report's page

The only program awf starts is your system's file opener, for `awf report --open`.

## What doesn't count

- Secrets in an agent's own logs. awf reads those logs and never changes them.
- Someone who already has access to your user account reading `~/.awf/`.
