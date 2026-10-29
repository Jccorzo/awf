---
name: next-step
description: Take the first unticked step in PLAN.md, propose a plan, implement it after approval, run the checks, tick the box and commit.
disable-model-invocation: true
---

Work on the next step of PLAN.md.

1. Read PLAN.md. Find the first milestone with an unticked check box (`- [ ]`). Read its prompt block and its checks.
2. Read CLAUDE.md and any docs the prompt names (docs/phases.md, docs/hook-events.md, docs/transcript-format.md).
3. Propose a short plan: files to add or change, tests to write, and how each check will be verified. Wait for approval before editing anything.
4. Implement it. Every classifier rule ships with a fixture test.
5. Run `pnpm lint`, `pnpm test` and `pnpm build`. Fix failures until all three pass.
6. Verify the milestone's checks. Tick a box only when its check actually passed; say how you checked it. Leave a box that needs the user (a stopwatch, a hand check, a week of use) unticked and say what they need to do.
7. Commit with a message that names the milestone and step.
