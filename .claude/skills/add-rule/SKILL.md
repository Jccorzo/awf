---
name: add-rule
description: Add classifier rules for one tool, with a fixture, a test and an update to docs/phases.md.
argument-hint: <tool>
disable-model-invocation: true
---

Add classifier rules for `$ARGUMENTS`.

1. Read docs/phases.md and src/classify/default-rules.yaml. Decide which existing phase the tool belongs to. Never add a phase; if none fits, stop and ask.
2. Collect the real command shapes for the tool: plain invocation, wrappers (`npx`, `pnpm exec`, `uv run`, wrapper scripts like `./gradlew`), subcommands that belong to a different phase, and flags that change the phase (for example `tsc --noEmit` is lint, `tsc` is build).
3. Add the rules to src/classify/default-rules.yaml next to the tools of the same phase.
4. Add a fixture test in test/classify/rules.test.ts: one positive case per command shape, plus at least one known false positive that must not match.
5. If the tool reports failures in its output, add its failure pattern under `failurePatterns`, with a test.
6. Update the tool list for that phase in docs/phases.md.
7. Run `pnpm build`, `pnpm test` and `pnpm lint`, then commit, with plugin/scripts/: the rules are bundled into it.
