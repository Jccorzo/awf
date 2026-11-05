import { describe, expect, it } from 'vitest';
import type { Step } from '../../src/model/types';
import type { RecorderEvent } from '../../src/recorder/event';
import { eventsToSession } from '../../src/recorder/steps';

function ev(e: string, t: number, extra: Partial<RecorderEvent> = {}): RecorderEvent {
  return { v: 1, e, t, sid: 's', ...extra };
}

function span(step: Step | undefined): [number, number] | undefined {
  return step ? [step.startMs, step.endMs] : undefined;
}

function models(steps: Step[]): Step[] {
  return steps.filter((s) => s.kind === 'model');
}

describe('eventsToSession', () => {
  it('splits a turn into model time and a tool call', () => {
    const session = eventsToSession('s', [
      ev('SessionStart', 0, { cwd: '/repo' }),
      ev('UserPromptSubmit', 1000, { cwd: '/repo' }),
      ev('PreToolUse', 3000, { tool: 'Bash', tuid: 't1', cmd: 'pnpm test' }),
      ev('PostToolUse', 8000, { tool: 'Bash', tuid: 't1', ok: true, dur: 4900 }),
      ev('PostToolBatch', 8010, { ids: ['t1'] }),
      ev('Stop', 10000),
      ev('SessionEnd', 20000),
    ]);
    expect(session).toMatchObject({ startMs: 1000, endMs: 10000, cwd: '/repo' });
    const turn = session.steps.find((s) => s.kind === 'turn');
    const tool = session.steps.find((s) => s.id === 't1');
    const [first, last] = models(session.steps);
    expect(span(turn)).toEqual([1000, 10000]);
    expect(span(first)).toEqual([1000, 3000]);
    expect(first?.produces).toEqual(['t1']);
    expect(tool).toMatchObject({
      startMs: 3000,
      endMs: 8000,
      ok: true,
      runMs: 4900,
      command: 'pnpm test',
      parentId: turn?.id,
    });
    expect(span(last)).toEqual([8000, 10000]);
    expect(last?.flags).toContain('answer');
  });

  it('links one model step to a whole parallel batch', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Read', tuid: 'r1', files: ['/a'] }),
      ev('PreToolUse', 2001, { tool: 'Read', tuid: 'r2', files: ['/b'] }),
      ev('PostToolUse', 2100, { tuid: 'r1', ok: true }),
      ev('PostToolUse', 2150, { tuid: 'r2', ok: true }),
      ev('PostToolBatch', 2160, { ids: ['r1', 'r2'] }),
      ev('Stop', 5000),
    ]);
    const [first, last] = models(session.steps);
    expect(first?.produces).toEqual(['r1', 'r2']);
    expect(session.steps.find((s) => s.id === 'r2')?.flags).toContain('parallel');
    expect(span(last)).toEqual([2150, 5000]);
    expect(models(session.steps)).toHaveLength(2);
  });

  it('splits an approval wait from the run using duration_ms', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Bash', tuid: 't1', ih: 'h1' }),
      ev('PreToolUse', 2001, { tool: 'Bash', tuid: 't0', ih: 'h0' }),
      ev('PermissionRequest', 2005, { tool: 'Bash', ih: 'h1' }),
      ev('PostToolUse', 2500, { tuid: 't0', ok: true }),
      ev('PostToolUse', 12000, { tuid: 't1', ok: true, dur: 3000 }),
      ev('Stop', 13000),
    ]);
    const call = session.steps.find((s) => s.id === 't1');
    expect(call?.flags).toContain('approval');
    expect(call).toMatchObject({ waitMs: 7000, runMs: 3000 });
    expect(session.steps.find((s) => s.id === 't0')?.flags).not.toContain('approval');
  });

  it('nests a subagent and its own model time under the Agent call', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Agent', tuid: 'a1', sub: 'Explore' }),
      ev('SubagentStart', 2050, { aid: 'x1', at: 'Explore' }),
      ev('PreToolUse', 3000, { tool: 'Grep', tuid: 'g1', aid: 'x1', at: 'Explore' }),
      ev('PostToolUse', 3100, { tuid: 'g1', ok: true, aid: 'x1' }),
      ev('PostToolBatch', 3110, { ids: ['g1'], aid: 'x1' }),
      ev('SubagentStop', 6000, { aid: 'x1', at: 'Explore' }),
      ev('PostToolUse', 6010, { tuid: 'a1', ok: true, child: 'x1' }),
      ev('PostToolBatch', 6020, { ids: ['a1'] }),
      ev('Stop', 8000),
    ]);
    const sub = session.steps.find((s) => s.kind === 'subagent');
    expect(sub).toMatchObject({
      id: 'agent:x1',
      parentId: 'a1',
      startMs: 2050,
      endMs: 6000,
      agentType: 'Explore',
    });
    const grep = session.steps.find((s) => s.id === 'g1');
    expect(grep).toMatchObject({ parentId: 'agent:x1', agentId: 'x1' });
    const subModels = models(session.steps).filter((s) => s.agentId === 'x1');
    expect(subModels.map(span)).toEqual([
      [2050, 3000],
      [3100, 6000],
    ]);
    expect(subModels[0]?.produces).toEqual(['g1']);
    const mainModels = models(session.steps).filter((s) => !s.agentId);
    expect(mainModels.map(span)).toEqual([
      [1000, 2000],
      [6010, 8000],
    ]);
  });

  it('cuts model time around a compaction and links both parts to the next call', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreCompact', 5000, { trigger: 'auto' }),
      ev('PostCompact', 9000, { trigger: 'auto' }),
      ev('PreToolUse', 10000, { tool: 'Edit', tuid: 'e1', files: ['/repo/a.ts'] }),
      ev('PostToolUse', 11000, { tuid: 'e1', ok: true }),
      ev('Stop', 12000),
    ]);
    const compaction = session.steps.find((s) => s.kind === 'compact');
    expect(span(compaction)).toEqual([5000, 9000]);
    const [a, b] = models(session.steps);
    expect([span(a), span(b)]).toEqual([
      [1000, 5000],
      [9000, 10000],
    ]);
    expect(a?.produces).toEqual(['e1']);
    expect(b?.produces).toEqual(['e1']);
  });

  it('closes an interrupted turn when the next prompt arrives', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Bash', tuid: 't1' }),
      ev('UserPromptSubmit', 5000),
      ev('Stop', 7000),
    ]);
    const turns = session.steps.filter((s) => s.kind === 'turn');
    expect(turns.map(span)).toEqual([
      [1000, 5000],
      [5000, 7000],
    ]);
    expect(session.steps.find((s) => s.id === 't1')).toMatchObject({ endMs: 5000 });
    expect(session.steps.find((s) => s.id === 't1')?.flags).toContain('interrupted');
    expect(session.steps.some((s) => s.kind === 'idle')).toBe(false);
  });

  it('counts the gap between turns as idle', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('Stop', 10000),
      ev('UserPromptSubmit', 40000),
      ev('Stop', 41000),
    ]);
    expect(span(session.steps.find((s) => s.kind === 'idle'))).toEqual([10000, 40000]);
    expect(session.endMs - session.startMs).toBe(40000);
  });

  it("keeps a compaction while you're away inside the idle gap, flagged background", () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('Stop', 2000),
      ev('PreCompact', 50000, { trigger: 'auto' }),
      ev('PostCompact', 80000, { trigger: 'auto' }),
      ev('UserPromptSubmit', 100000),
      ev('Stop', 101000),
    ]);
    const compaction = session.steps.find((s) => s.kind === 'compact');
    expect(compaction).toMatchObject({ parentId: null, flags: ['background'] });
    expect(span(compaction)).toEqual([50000, 80000]);
    expect(session.steps.filter((s) => s.kind === 'idle').map(span)).toEqual([[2000, 100000]]);
  });

  it('carves a /compact you waited for out of the idle gap', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('Stop', 2000),
      ev('PreCompact', 50000, { trigger: 'manual' }),
      ev('PostCompact', 80000, { trigger: 'manual' }),
      ev('UserPromptSubmit', 100000),
      ev('Stop', 101000),
    ]);
    expect(session.steps.find((s) => s.kind === 'compact')?.flags).toEqual([]);
    expect(session.steps.filter((s) => s.kind === 'idle').map(span)).toEqual([
      [2000, 50000],
      [80000, 100000],
    ]);
  });

  it("drops a compaction while you're away after the last turn: it doesn't stretch the session", () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('Stop', 2000),
      ev('PreCompact', 3_200_000, { trigger: 'auto' }),
      ev('PostCompact', 3_235_000, { trigger: 'auto' }),
    ]);
    expect(session.steps.some((s) => s.kind === 'compact')).toBe(false);
    expect(session).toMatchObject({ startMs: 1000, endMs: 2000 });
  });

  it('splits a compaction while you were away at the prompt you sent during it', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('Stop', 2000),
      ev('PreCompact', 50000, { trigger: 'auto' }),
      ev('UserPromptSubmit', 60000),
      ev('PostCompact', 80000, { trigger: 'auto' }),
      ev('Stop', 90000),
    ]);
    const turn = session.steps.filter((s) => s.kind === 'turn')[1];
    const parts = session.steps.filter((s) => s.kind === 'compact');
    expect(parts.map((s) => [s.startMs, s.endMs, s.parentId, s.flags])).toEqual([
      [50000, 60000, null, ['background']],
      [60000, 80000, turn?.id, []],
    ]);
    expect(session.steps.filter((s) => s.kind === 'idle').map(span)).toEqual([[2000, 60000]]);
    expect(models(session.steps).map(span).at(-1)).toEqual([80000, 90000]);
  });

  it('starts model time when the last call ends on versions without PostToolBatch', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Bash', tuid: 't1' }),
      ev('PostToolUse', 3000, { tuid: 't1', ok: true }),
      ev('PreToolUse', 4000, { tool: 'Bash', tuid: 't2' }),
      ev('PostToolUseFailure', 5000, { tuid: 't2', ok: false, code: 2 }),
      ev('Stop', 6000),
    ]);
    expect(models(session.steps).map(span)).toEqual([
      [1000, 2000],
      [3000, 4000],
      [5000, 6000],
    ]);
    expect(session.steps.find((s) => s.id === 't2')).toMatchObject({ ok: false, exitCode: 2 });
  });

  it('counts the gap between calls of a batch as model time writing the next call', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Edit', tuid: 't1' }),
      ev('PostToolUse', 2010, { tuid: 't1', ok: true }),
      ev('PreToolUse', 2600, { tool: 'Bash', tuid: 't2' }),
      ev('PostToolUse', 4000, { tuid: 't2', ok: true }),
      ev('PostToolBatch', 4010, { ids: ['t1', 't2'] }),
      ev('Stop', 6000),
    ]);
    expect(models(session.steps).map(span)).toEqual([
      [1000, 2000],
      [2010, 2600],
      [4000, 6000],
    ]);
    expect(models(session.steps)[1]?.produces).toEqual(['t2']);
  });

  it("doesn't restart a subagent's model time when its last batch resolves after SubagentStop", () => {
    // A subagent ends on a SubagentHandback call, and Claude Code stamps that call's
    // PostToolBatch just after SubagentStop. The subagent is done: no model time after it.
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Agent', tuid: 'a1', sub: 'Explore' }),
      ev('SubagentStart', 2050, { aid: 'x1', at: 'Explore' }),
      ev('PreToolUse', 3000, { tool: 'Grep', tuid: 'g1', aid: 'x1' }),
      ev('PostToolUse', 3100, { tuid: 'g1', ok: true, aid: 'x1' }),
      ev('PostToolBatch', 3110, { ids: ['g1'], aid: 'x1' }),
      ev('PreToolUse', 5000, { tool: 'SubagentHandback', tuid: 'h1', aid: 'x1' }),
      ev('PostToolUse', 5100, { tuid: 'h1', ok: true, aid: 'x1' }),
      ev('SubagentStop', 5110, { aid: 'x1' }),
      ev('PostToolBatch', 5111, { ids: ['h1'], aid: 'x1' }),
      ev('PostToolUse', 5200, { tuid: 'a1', ok: true, child: 'x1' }),
      ev('PostToolBatch', 5210, { ids: ['a1'] }),
      ev('Stop', 8000),
      ev('UserPromptSubmit', 100_000),
      ev('Stop', 101_000),
      ev('SessionEnd', 200_000),
    ]);
    const subModels = models(session.steps).filter((s) => s.agentId === 'x1');
    expect(subModels.map(span)).toEqual([
      [2050, 3000],
      [3100, 5000],
      [5100, 5110],
    ]);
    expect(subModels.flatMap((s) => s.flags)).not.toContain('unfinished');
    expect(span(session.steps.find((s) => s.kind === 'subagent'))).toEqual([2050, 5110]);
  });

  it("doesn't start model time when a batch resolves after the turn's Stop", () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Bash', tuid: 'b1' }),
      ev('PostToolUse', 2100, { tuid: 'b1', ok: true }),
      ev('Stop', 2200),
      ev('PostToolBatch', 2201, { ids: ['b1'] }),
      ev('PreToolUse', 50_000, { tool: 'Bash', tuid: 'b2' }),
      ev('PostToolUse', 50_100, { tuid: 'b2', ok: true }),
      ev('Stop', 51_000),
    ]);
    expect(models(session.steps).map(span)).toEqual([
      [1000, 2000],
      [2100, 2200],
      [50_100, 51_000],
    ]);
  });

  it('flags a subagent whose Agent call returned at once as background', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Agent', tuid: 'a1', sub: 'Explore' }),
      ev('SubagentStart', 2010, { aid: 'x1', at: 'Explore' }),
      ev('PostToolUse', 2020, { tuid: 'a1', ok: true, child: 'x1' }),
      ev('SubagentStop', 9000, { aid: 'x1' }),
      ev('Stop', 9500),
      ev('UserPromptSubmit', 9510, { src: 'task-notification' }),
      ev('Stop', 11000),
    ]);
    expect(session.steps.find((s) => s.kind === 'subagent')?.flags).toContain('background');
    const turns = session.steps.filter((s) => s.kind === 'turn');
    expect(turns[1]?.flags).toEqual(['notification']);
  });

  it('gives the same steps when async hooks wrote lines out of order', () => {
    const events = [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Read', tuid: 'r1' }),
      ev('PreToolUse', 2001, { tool: 'Read', tuid: 'r2' }),
      ev('PostToolUse', 2100, { tuid: 'r1', ok: true }),
      ev('PostToolUse', 2150, { tuid: 'r2', ok: true }),
      ev('PostToolBatch', 2160, { ids: ['r1', 'r2'] }),
      ev('Stop', 5000),
    ];
    const shuffled = [
      events[3],
      events[0],
      events[6],
      events[2],
      events[5],
      events[1],
      events[4],
    ] as RecorderEvent[];
    expect(eventsToSession('s', shuffled)).toEqual(eventsToSession('s', events));
  });

  it('ends a call that never ran when its batch resolves, not when the turn ends', () => {
    // b2 was stopped before it ran (a deny rule, say): Claude Code sends no PostToolUse for it.
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Bash', tuid: 'b1', cmd: 'pnpm test' }),
      ev('PreToolUse', 2001, { tool: 'Bash', tuid: 'b2', cmd: 'curl https://example.com' }),
      ev('PostToolUseFailure', 2500, { tuid: 'b1', ok: false }),
      ev('PostToolBatch', 2510, { ids: ['b1', 'b2'] }),
      ev('PreToolUse', 3000, { tool: 'Read', tuid: 'r1' }),
      ev('PostToolUse', 3100, { tuid: 'r1', ok: true }),
      ev('PostToolBatch', 3110, { ids: ['r1'] }),
      ev('Stop', 1_200_000),
    ]);
    const call = session.steps.find((s) => s.id === 'b2');
    expect(span(call)).toEqual([2001, 2510]);
    expect(call?.flags).toEqual(['parallel', 'unfinished']);
    expect(models(session.steps).map(span)).toEqual([
      [1000, 2000],
      [2510, 3000],
      [3100, 1_200_000],
    ]);
  });

  it("keeps a call's own end when its batch was stamped first", () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PreToolUse', 2000, { tool: 'Bash', tuid: 'b1', cmd: 'pnpm build' }),
      ev('PostToolBatch', 9000, { ids: ['b1'] }),
      ev('PostToolUse', 9000, { tuid: 'b1', ok: true, dur: 7000 }),
      ev('Stop', 12_000),
    ]);
    const calls = session.steps.filter((s) => s.id === 'b1');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ startMs: 2000, endMs: 9000, ok: true, flags: [] });
    expect(models(session.steps).map(span)).toEqual([
      [1000, 2000],
      [9000, 12_000],
    ]);
  });

  it('builds a call once when its PostToolUse is stamped before its PreToolUse', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('PostToolUse', 2000, { tool: 'Read', tuid: 'r1', ok: true, dur: 3 }),
      ev('PreToolUse', 2002, { tool: 'Read', tuid: 'r1', files: ['/a'] }),
      ev('PostToolBatch', 2005, { ids: ['r1'] }),
      ev('Stop', 5000),
    ]);
    const calls = session.steps.filter((s) => s.id === 'r1');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ startMs: 1997, endMs: 2000, ok: true, files: ['/a'] });
    expect(calls[0]?.flags).not.toContain('unfinished');
    expect(models(session.steps).map(span)).toEqual([
      [1000, 1997],
      [2000, 5000],
    ]);
  });

  it('flags a turn that ended on an API error', () => {
    const session = eventsToSession('s', [
      ev('UserPromptSubmit', 1000),
      ev('StopFailure', 4000, { err: 'rate_limit' }),
    ]);
    expect(models(session.steps)[0]?.flags).toEqual(['answer', 'api-error']);
  });
});
