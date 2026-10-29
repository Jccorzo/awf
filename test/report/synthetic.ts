// A long, made-up session for the report's performance test and screenshots: about an hour of
// turns with model calls, reads, edits, failing and passing checks, approvals, a subagent, a
// background build and idle gaps. Seeded, so it's the same every run.
import type { Session, Step } from '../../src/model/types';

export function syntheticSession(options: { turns?: number; seed?: number } = {}): Session {
  let seed = options.seed ?? 7;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const between = (a: number, b: number) => Math.round(a + rand() * (b - a));
  const start = Date.UTC(2026, 9, 28, 14, 0, 0);
  const steps: Step[] = [];
  let n = 0;
  const id = (prefix: string) => `${prefix}-${++n}`;
  let t = start;

  const tools: Array<
    [
      weight: number,
      make: () => Omit<Step, 'id' | 'parentId' | 'startMs' | 'endMs' | 'flags'> & { ms: number },
    ]
  > = [
    [
      4,
      () => ({
        kind: 'tool',
        tool: 'Read',
        files: [`/work/shop/src/cart/item${between(1, 40)}.ts`],
        ok: true,
        ms: between(40, 400),
      }),
    ],
    [2, () => ({ kind: 'tool', tool: 'Grep', ok: true, ms: between(80, 900) })],
    [
      3,
      () => ({
        kind: 'tool',
        tool: 'Edit',
        files: [`/work/shop/src/cart/item${between(1, 40)}.ts`],
        ok: true,
        ms: between(30, 200),
      }),
    ],
    [
      1,
      () => ({
        kind: 'tool',
        tool: 'Edit',
        files: [`/work/shop/test/cart/item${between(1, 40)}.test.ts`],
        ok: true,
        ms: between(30, 200),
      }),
    ],
    [
      2,
      () => ({
        kind: 'tool',
        tool: 'Bash',
        command: 'git status --short',
        ok: true,
        exitCode: 0,
        ms: between(60, 200),
      }),
    ],
    [
      1,
      () => {
        const failed = rand() < 0.3;
        return {
          kind: 'tool',
          tool: 'Bash',
          command: 'pnpm vitest run test/cart',
          ok: !failed,
          exitCode: failed ? 1 : 0,
          ms: between(8_000, 70_000),
        };
      },
    ],
    [
      1,
      () => {
        const failed = rand() < 0.2;
        return {
          kind: 'tool',
          tool: 'Bash',
          command: 'pnpm eslint src',
          ok: !failed,
          exitCode: failed ? 1 : 0,
          ms: between(3_000, 15_000),
        };
      },
    ],
    [
      0.5,
      () => {
        const failed = rand() < 0.15;
        return {
          kind: 'tool',
          tool: 'Bash',
          command: 'pnpm tsc -p .',
          ok: !failed,
          exitCode: failed ? 2 : 0,
          ms: between(10_000, 45_000),
        };
      },
    ],
  ];
  const totalWeight = tools.reduce((sum, [w]) => sum + w, 0);
  const pickTool = () => {
    let r = rand() * totalWeight;
    for (const [w, make] of tools) if ((r -= w) <= 0) return make();
    return (tools[0] as (typeof tools)[number])[1]();
  };

  const model = (parentId: string, agentId?: string): Step => {
    const ms = between(800, 3_200);
    const step: Step = {
      id: id('model'),
      parentId,
      kind: 'model',
      startMs: t,
      endMs: t + ms,
      flags: [],
      model: 'claude-opus-5-5',
      tokens: {
        input: between(5, 400),
        output: between(50, 900),
        cacheRead: between(20_000, 90_000),
        cacheWrite: between(0, 3_000),
      },
      produces: [],
      ...(agentId ? { agentId } : {}),
    };
    t += ms;
    steps.push(step);
    return step;
  };
  const tool = (parentId: string, producer: Step, agentId?: string): Step => {
    const { ms, ...made } = pickTool();
    const step: Step = {
      ...made,
      id: id('tool'),
      parentId,
      startMs: t,
      endMs: t + ms,
      flags: [],
      ...(agentId ? { agentId } : {}),
    };
    if (step.tool === 'Bash' && rand() < 0.08) {
      const wait = between(4_000, 40_000);
      step.flags.push('approval');
      step.waitMs = wait;
      step.runMs = ms;
      step.endMs += wait;
    }
    t = step.endMs;
    producer.produces?.push(step.id);
    steps.push(step);
    return step;
  };

  const turns = options.turns ?? 20;
  for (let turn = 0; turn < turns; turn++) {
    const turnStep: Step = {
      id: id('turn'),
      parentId: null,
      kind: 'turn',
      startMs: t,
      endMs: t,
      flags: [],
    };
    steps.push(turnStep);
    const calls = between(15, 35);
    for (let c = 0; c < calls; c++) {
      const producer = model(turnStep.id);
      if (turn % 9 === 4 && c === 3) {
        // An Explore subagent with its own model calls and reads.
        const call: Step = {
          id: id('tool'),
          parentId: turnStep.id,
          kind: 'tool',
          tool: 'Agent',
          agentType: 'Explore',
          startMs: t,
          endMs: t,
          flags: [],
          ok: true,
        };
        producer.produces?.push(call.id);
        steps.push(call);
        const agentId = `a${turn}`;
        const sub: Step = {
          id: `agent:${agentId}`,
          parentId: call.id,
          kind: 'subagent',
          agentType: 'Explore',
          agentId,
          startMs: t,
          endMs: t,
          flags: [],
        };
        steps.push(sub);
        for (let k = 0; k < 12; k++) tool(sub.id, model(sub.id, agentId), agentId);
        sub.endMs = t;
        call.endMs = t;
        continue;
      }
      if (turn === 10 && c === 1) {
        // A build left running in the background for a few minutes.
        const bg: Step = {
          id: id('bg'),
          parentId: turnStep.id,
          kind: 'background',
          tool: 'Bash',
          command: 'pnpm build --watch',
          startMs: t,
          endMs: t + 240_000,
          flags: ['background'],
          ok: true,
        };
        producer.produces?.push(bg.id);
        steps.push(bg);
      }
      tool(turnStep.id, producer);
    }
    const answer = model(turnStep.id);
    answer.flags.push('answer');
    turnStep.endMs = t;
    // Idle between turns: usually short, once a long break.
    const idle = turn === 13 ? 25 * 60_000 : between(5_000, 90_000);
    if (turn < turns - 1) {
      steps.push({
        id: id('idle'),
        parentId: null,
        kind: 'idle',
        startMs: t,
        endMs: t + idle,
        flags: [],
      });
      t += idle;
    }
  }
  return {
    id: 'synthetic-0000-4000-8000-000000000000',
    agent: 'claude-code',
    sources: ['transcript'],
    cwd: '/work/shop',
    title: 'Fix the cart total rounding and make the checkout tests pass',
    agentVersion: '2.1.312',
    startMs: start,
    endMs: t,
    steps,
  };
}
