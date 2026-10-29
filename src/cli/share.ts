import type { ClassifiedSession, ClassifiedStep } from '../classify/classify';

/**
 * What `--share` keeps: phases, durations, tool names and flags. No commands, files, paths, prompts,
 * output, task title or working directory. Check keys keep only the tool name (vitest, gradle).
 */
export function shareSession(session: ClassifiedSession): ClassifiedSession {
  const ids = new Map<string, string>();
  const anon = (id: string | null | undefined) => {
    if (!id) return null;
    if (!ids.has(id)) ids.set(id, `s${ids.size + 1}`);
    return ids.get(id) as string;
  };
  for (const step of session.steps) anon(step.id);
  const steps: ClassifiedStep[] = session.steps.map((s) => {
    const shared: ClassifiedStep = {
      id: anon(s.id) as string,
      parentId: anon(s.parentId),
      kind: s.kind,
      startMs: s.startMs,
      endMs: s.endMs,
      flags: s.flags,
      tags: s.tags.filter((t) => !/^(script|make|task|file|hook|via|unmatched):/.test(t)),
      checks: s.checks.map((c) => {
        // A script name like "npm lint:fix" is the project's; keep only the runner.
        const tool = c.tool.replace(/^(npm|pnpm|yarn|bun|deno|make) .*/, '$1');
        return { ...c, tool, key: `${c.phase}:${tool}` };
      }),
      failed: s.failed,
    };
    if (s.tool)
      shared.tool = s.tool.startsWith('mcp__') ? `mcp__${s.tool.split('__')[1] ?? ''}` : s.tool;
    if (s.phase) shared.phase = s.phase;
    if (s.ok !== undefined) shared.ok = s.ok;
    if (s.runMs !== undefined) shared.runMs = s.runMs;
    if (s.waitMs !== undefined) shared.waitMs = s.waitMs;
    if (s.agentType) shared.agentType = s.agentType;
    if (s.model) shared.model = s.model;
    if (s.tokens) shared.tokens = s.tokens;
    if (s.produces) shared.produces = s.produces.map((id) => anon(id) as string);
    if (s.reworkFor) shared.reworkFor = s.reworkFor;
    return shared;
  });
  return {
    id: session.id,
    agent: session.agent,
    sources: session.sources,
    startMs: session.startMs,
    endMs: session.endMs,
    steps,
    ...(session.agentVersion ? { agentVersion: session.agentVersion } : {}),
  };
}
