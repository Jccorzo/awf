# awf

Local CLI that shows where a coding agent's time goes, by phase.

This file is for agents working on this repo, whichever agent you are. To use awf for a user, read [docs/agents.md](docs/agents.md).

## Commands

- pnpm test · pnpm lint · pnpm build
- pnpm awf report <session> --out /tmp/report.html
- pnpm report:screenshots (every fixture's report, light and dark, laptop and phone)
- pnpm format (runs Prettier; pnpm lint fails on unformatted files)
- pnpm scrub (writes scrubbed copies of fixtures/raw/ to fixtures/claude-code/)
- claude plugin validate plugin · claude plugin test plugin (the pane, plugin/hooks/panel.tsx; pnpm test doesn't reach it)

## Rules

- No network calls anywhere in src/. Lint enforces it.
- Real sessions stay in fixtures/raw/ (gitignored). Commit only scrubbed copies.
- Every classifier rule ships with a fixture test.
- The HTML report is one self-contained file.
- Phases are defined in docs/phases.md. Don't add new ones without asking.
- Work from PLAN.md. Tick a step only when its checks pass.
- After changing src/, run pnpm build and commit plugin/scripts/. Those files are built: don't edit them by hand.
- Agents never read ~/.claude/projects in this repo. It holds real sessions, with prompts and tool output.

## Try a change

Use a fixture and a throwaway HOME, so awf can't reach real sessions:

```bash
TMPHOME=$(mktemp -d)
mkdir -p "$TMPHOME/.claude/projects/-tmp-demo"
cp fixtures/claude-code/cc-2.1.312-test-fix/*.jsonl "$TMPHOME/.claude/projects/-tmp-demo/"
pnpm build
HOME="$TMPHOME" node dist/awf.mjs summary last
```

`AWF_HOME`, `CLAUDE_CONFIG_DIR`, `AWF_CLAUDE_PROJECTS`, `CODEX_HOME` and `XDG_DATA_HOME` win over HOME. Unset any that are set. `fixtures/claude-code/`, `fixtures/codex/`, `fixtures/gemini/` and `fixtures/opencode/` hold more sessions to try.

## Where things are

| Path             | What's there                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `src/cli/`       | The CLI. One file per command in `commands/`                                                            |
| `src/classify/`  | Phases, built-in rules (`default-rules.yaml`), shell parsing, script resolution                         |
| `src/analyze/`   | Rework detection, phase totals, the summary                                                             |
| `src/importers/` | Readers for Claude Code, Codex, Gemini and OpenCode logs                                                |
| `src/recorder/`  | The hook that records timings                                                                           |
| `src/report/`    | The HTML report                                                                                         |
| `src/live/`      | Session states for `awf live`                                                                           |
| `src/build/`     | Build timing drill-down                                                                                 |
| `src/store/`     | `~/.awf`, and finding sessions                                                                          |
| `plugin/`        | The Claude Code plugin. `plugin/scripts/` is built; the rest is written by hand                         |
| `fixtures/`      | Scrubbed sessions for tests                                                                             |
| `test/`          | Tests, laid out like `src/`                                                                             |
| `docs/`          | `phases.md` (what each phase means), `rules.md` (`.awf/rules.yaml`), `agents.md` (using awf for a user) |

The step-by-step checklists in `.claude/skills/add-rule/SKILL.md` and `.claude/skills/next-step/SKILL.md` work for any agent.
