# awf

Local CLI that shows where a coding agent's time goes, by phase.

## Commands

- pnpm test · pnpm lint · pnpm build
- pnpm awf report <session> --out /tmp/report.html
- pnpm report:screenshots (every fixture's report, light and dark, laptop and phone)

## Rules

- No network calls anywhere in src/. Lint enforces it.
- Real sessions stay in fixtures/raw/ (gitignored). Commit only scrubbed copies.
- Every classifier rule ships with a fixture test.
- The HTML report is one self-contained file.
- Phases are defined in docs/phases.md. Don't add new ones without asking.
- Work from PLAN.md. Tick a step only when its checks pass.
