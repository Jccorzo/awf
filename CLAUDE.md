@AGENTS.md

## Claude Code

Skills in this repo. Only the user starts them:

- /add-rule <tool>: add classifier rules for one tool, with a fixture, a test and an update to docs/phases.md.
- /dogfood: run awf on this repo's own recent sessions and report the phase split and anything unclassified.
- /next-step: take the first unticked step in PLAN.md, propose a plan, implement it after approval, run the checks, tick the box and commit.

Subagents:

- rules-reviewer: read-only review of classifier changes. Use after editing src/classify or default-rules.yaml.
- report-checker: renders every fixture's report and lists layout problems. Use after changing src/report.
