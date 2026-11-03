import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { main } from '../src/cli/main';
import type { RecorderEvent } from '../src/recorder/event';
import { captureIo } from './helpers';
import { ms, prompt, result, text, toolUse } from './transcript';

function writeEvents(home: string, id: string, events: Array<Partial<RecorderEvent>>): void {
  mkdirSync(path.join(home, 'events'), { recursive: true });
  const lines = events.map((e) => JSON.stringify({ v: 1, sid: id, ...e }));
  writeFileSync(path.join(home, 'events', `${id}.jsonl`), lines.join('\n') + '\n');
}

describe('awf sessions', () => {
  const home = mkdtempSync(path.join(os.tmpdir(), 'awf-sessions-'));
  const projects = mkdtempSync(path.join(os.tmpdir(), 'awf-projects-'));
  const start = new Date(2026, 9, 28, 9, 30).getTime();
  writeEvents(home, '11111111-aaaa', [
    { e: 'SessionStart', t: start - 5000, cwd: '/work/repo' },
    { e: 'UserPromptSubmit', t: start, cwd: '/work/repo' },
    { e: 'PreToolUse', t: start + 2000, tool: 'Bash', tuid: 't1', cmd: 'pnpm test' },
    { e: 'PostToolUse', t: start + 62_000, tuid: 't1', ok: true },
    { e: 'Stop', t: start + 65_000 },
    { e: 'UserPromptSubmit', t: start + 365_000 },
    { e: 'Stop', t: start + 370_000 },
  ]);
  writeEvents(home, '22222222-bbbb', [
    { e: 'UserPromptSubmit', t: start - 86_400_000 },
    { e: 'Stop', t: start - 86_400_000 + 1000 },
  ]);

  it('lists sessions newest first with duration and time in turns', async () => {
    const io = captureIo();
    expect(
      await main(['sessions'], io, {
        AWF_HOME: home,
        AWF_CLAUDE_PROJECTS: projects,
        HOME: '/work',
      }),
    ).toBe(0);
    const [header, first, second] = io.stdout[0]?.split('\n') ?? [];
    expect(header).toMatch(
      /^SESSION\s+STARTED\s+DURATION\s+IN TURNS\s+TURNS\s+TOOLS\s+SOURCE\s+PROJECT$/,
    );
    expect(first).toMatch(
      /^11111111\s+2026-10-28 09:30\s+6m 10s\s+1m 10s\s+2\s+1\s+hooks\s+~\/repo$/,
    );
    expect(second).toMatch(/^22222222/);
  });

  it('prints JSON and filters by age', async () => {
    const io = captureIo();
    await main(
      ['sessions', '--json', '--since', '12h'],
      io,
      { AWF_HOME: home, AWF_CLAUDE_PROJECTS: projects },
      '/',
      start + 400_000,
    );
    const rows = JSON.parse(io.stdout[0] ?? '[]');
    expect(rows.map((r: { id: string }) => r.id)).toEqual(['11111111-aaaa']);
    expect(rows[0]).toMatchObject({
      durationMs: 370_000,
      turnsMs: 70_000,
      turns: 2,
      toolCalls: 1,
    });
  });
});

describe('a session the recorder only saw part of', () => {
  const id = '33333333-cccc';
  const root = mkdtempSync(path.join(os.tmpdir(), 'awf-partial-'));
  const env = {
    AWF_HOME: path.join(root, 'awf'),
    AWF_CLAUDE_PROJECTS: path.join(root, 'projects'),
  };
  const entries = [
    prompt(0, 'first'),
    toolUse(2, 'm1', 'a', 'Bash', { command: 'pnpm test' }),
    result(5, 'a'),
    text(8, 'm2'),
    prompt(100, 'second'),
    toolUse(102, 'm3', 'b', 'Bash', { command: 'pnpm build' }),
    result(105, 'b'),
    text(108, 'm4'),
  ];
  mkdirSync(path.join(env.AWF_CLAUDE_PROJECTS, '-tmp-demo'), { recursive: true });
  writeFileSync(
    path.join(env.AWF_CLAUDE_PROJECTS, '-tmp-demo', `${id}.jsonl`),
    entries.map((e) => JSON.stringify(e)).join('\n') + '\n',
  );
  writeEvents(env.AWF_HOME, id, [
    { e: 'SessionStart', t: ms(50), src: 'resume', cwd: '/work/repo' },
    { e: 'UserPromptSubmit', t: ms(100.013), cwd: '/work/repo' },
    { e: 'PreToolUse', t: ms(102.025), tool: 'Bash', tuid: 'b', cmd: 'pnpm build' },
    { e: 'PostToolUse', t: ms(105.02), tool: 'Bash', tuid: 'b', ok: true },
    { e: 'Stop', t: ms(108.02) },
  ]);

  it('awf sessions counts the turns from before the recorder', async () => {
    const io = captureIo();
    await main(['sessions', '--json'], io, env);
    expect(JSON.parse(io.stdout[0] ?? '[]')[0]).toMatchObject({
      id,
      turns: 2,
      toolCalls: 2,
      sources: ['hooks', 'transcript'],
    });
  });

  it('awf stats counts their Bash calls', async () => {
    const io = captureIo();
    await main(['stats', '--json'], io, env);
    expect(JSON.parse(io.stdout[0] ?? '{}')).toMatchObject({ bashCalls: 2, sessions: 1 });
  });
});

describe('a session resumed under a new ID', () => {
  const FIXTURE = path.resolve(
    __dirname,
    '../fixtures/claude-code/cc-2.1.312-test-fix/4045beec-4abe-4901-822b-0e34d3c9fa14.jsonl',
  );
  /** A prompt, one Bash call and the answer. */
  const turn = (t: number, call: string) => [
    prompt(t, 'go'),
    toolUse(t + 2, `use-${call}`, call, 'Bash', { command: 'pnpm test' }),
    result(t + 5, call),
    text(t + 8, `end-${call}`),
  ];

  /** Claude Code's layout and an awf home in a temp folder, with these transcripts imported. */
  async function imported(transcripts: Record<string, unknown[]>) {
    const root = mkdtempSync(path.join(os.tmpdir(), 'awf-resumed-'));
    const env = {
      AWF_HOME: path.join(root, 'awf'),
      AWF_CLAUDE_PROJECTS: path.join(root, 'projects'),
    };
    mkdirSync(path.join(env.AWF_CLAUDE_PROJECTS, '-repo'), { recursive: true });
    for (const [id, entries] of Object.entries(transcripts)) {
      writeFileSync(
        path.join(env.AWF_CLAUDE_PROJECTS, '-repo', `${id}.jsonl`),
        entries.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n') + '\n',
      );
    }
    await main(['import'], captureIo(), env);
    return env;
  }

  async function run(env: Record<string, string>, args: string[], now?: number) {
    const io = captureIo();
    expect(await main([...args, '--json'], io, env, '/', now)).toBe(0);
    return JSON.parse(io.stdout[0] ?? 'null');
  }

  const rows = async (env: Record<string, string>) =>
    (await run(env, ['sessions'])).map((r: { id: string; toolCalls: number }) => [
      r.id,
      r.toolCalls,
    ]);

  it('leaves out the copy it left behind, in every list and total', async () => {
    const env = await imported({
      real: [...turn(0, 'toolu_1'), ...turn(100, 'toolu_2')],
      copy: turn(0, 'toolu_1'),
    });
    expect(await rows(env)).toEqual([['real', 2]]);
    expect(await run(env, ['stats'])).toMatchObject({ sessions: 1, bashCalls: 2 });
    const { after } = await run(env, ['compare', '1h', '1h'], ms(400));
    expect(after).toMatchObject({ sessions: 1, toolCalls: 2 });
  });

  it('still shows the copy when asked for it by name', async () => {
    const env = await imported({
      real: [...turn(0, 'toolu_1'), ...turn(100, 'toolu_2')],
      copy: turn(0, 'toolu_1'),
    });
    expect(await run(env, ['summary', 'copy'])).toMatchObject({ id: 'copy', toolCalls: 1 });
  });

  it('keeps the session, not its copy, when the recorder saw it just after the transcript', async () => {
    const env = await imported({
      real: [...turn(0, 'toolu_1'), ...turn(100, 'toolu_2')],
      copy: turn(0, 'toolu_1'),
    });
    writeEvents(env.AWF_HOME, 'real', [
      { e: 'SessionStart', t: ms(-1), src: 'startup', cwd: '/repo' },
      { e: 'UserPromptSubmit', t: ms(0.03), cwd: '/repo' },
      { e: 'PreToolUse', t: ms(2.03), tool: 'Bash', tuid: 'toolu_1', cmd: 'pnpm test' },
      { e: 'PostToolUse', t: ms(5.03), tool: 'Bash', tuid: 'toolu_1', ok: true },
      { e: 'Stop', t: ms(8.03) },
      { e: 'UserPromptSubmit', t: ms(100.03) },
      { e: 'PreToolUse', t: ms(102.03), tool: 'Bash', tuid: 'toolu_2', cmd: 'pnpm test' },
      { e: 'PostToolUse', t: ms(105.03), tool: 'Bash', tuid: 'toolu_2', ok: true },
      { e: 'Stop', t: ms(108.03) },
    ]);
    writeEvents(env.AWF_HOME, 'copy', [
      { e: 'SessionStart', t: ms(50), src: 'resume', cwd: '/repo' },
    ]);
    expect(await rows(env)).toEqual([['real', 2]]);
  });

  it('counts the session that carried on, which holds the old one whole', async () => {
    const env = await imported({
      old: turn(0, 'toolu_1'),
      next: [...turn(0, 'toolu_1'), ...turn(100, 'toolu_2')],
    });
    expect(await rows(env)).toEqual([['next', 2]]);
  });

  it('starts a session after the part of an older one it repeats', async () => {
    const carriedOn = [
      ...turn(100, 'toolu_2'),
      ...turn(300, 'toolu_3'),
      ...turn(400, 'toolu_4'),
      ...turn(500, 'toolu_5'),
    ];
    const env = await imported({
      old: [...turn(0, 'toolu_1'), ...turn(100, 'toolu_2')],
      next: carriedOn,
    });
    expect(await rows(env)).toEqual([
      ['next', 3],
      ['old', 2],
    ]);
    expect((await run(env, ['sessions']))[0]).toMatchObject({
      startMs: ms(300),
      endMs: ms(508),
      turns: 3,
    });
    expect(await run(env, ['stats'])).toMatchObject({ sessions: 2, bashCalls: 5 });
    const { after } = await run(env, ['compare', '1h', '1h'], ms(600));
    expect(after).toMatchObject({ sessions: 2, toolCalls: 5, totalMs: (108 + 208) * 1000 });
  });

  it('starts right after what it repeats when it carried on in the same turn', async () => {
    const env = await imported({
      old: [...turn(0, 'toolu_1'), ...turn(100, 'toolu_2')],
      next: [
        prompt(100, 'go'),
        toolUse(102, 'use-toolu_2', 'toolu_2', 'Bash', { command: 'pnpm test' }),
        result(105, 'toolu_2'),
        toolUse(110, 'use-toolu_3', 'toolu_3', 'Bash', { command: 'pnpm test' }),
        result(115, 'toolu_3'),
        toolUse(120, 'use-toolu_4', 'toolu_4', 'Bash', { command: 'pnpm test' }),
        result(125, 'toolu_4'),
        text(130, 'end'),
      ],
    });
    expect(await rows(env)).toEqual([
      ['next', 2],
      ['old', 2],
    ]);
    expect((await run(env, ['sessions']))[0]).toMatchObject({ startMs: ms(105), turns: 1 });
  });

  it('reads a copy and a continuation of one session together', async () => {
    const env = await imported({
      old: [...turn(0, 'toolu_1'), ...turn(100, 'toolu_2')],
      copy: turn(0, 'toolu_1'),
      next: [
        ...turn(100, 'toolu_2'),
        ...turn(300, 'toolu_3'),
        ...turn(400, 'toolu_4'),
        ...turn(500, 'toolu_5'),
      ],
    });
    expect(await rows(env)).toEqual([
      ['next', 3],
      ['old', 2],
    ]);
  });

  it('finds the copy of a real transcript', async () => {
    const lines = readFileSync(FIXTURE, 'utf8').trimEnd().split('\n');
    const env = await imported({
      real: lines,
      copy: lines.slice(0, Math.floor(lines.length / 2)),
    });
    expect((await rows(env)).map(([id]: [string]) => id)).toEqual(['real']);
  });

  it("doesn't take IDs that aren't Claude's for the same history", async () => {
    const env = await imported({ one: turn(0, 't1'), two: turn(100, 't1') });
    expect(await rows(env)).toEqual([
      ['two', 1],
      ['one', 1],
    ]);
  });
});

describe('before there are any sessions', () => {
  const empty = mkdtempSync(path.join(os.tmpdir(), 'awf-empty-'));
  const env = {
    AWF_HOME: path.join(empty, 'awf'),
    AWF_CLAUDE_PROJECTS: path.join(empty, 'projects'),
    HOME: empty,
  };

  it.each(['summary', 'report', 'classify'])('awf %s last says what to do next', async (name) => {
    const io = captureIo();
    expect(await main([name, 'last'], io, env)).toBe(1);
    expect(io.stderr).toEqual([
      `awf ${name}: no sessions found. Run "awf import" to read past sessions, or install the plugin to record new ones.`,
    ]);
  });

  it('awf sessions says what to do next', async () => {
    const io = captureIo();
    expect(await main(['sessions'], io, env)).toBe(0);
    expect(io.stdout.join('\n')).toContain('run "awf import"');
  });

  it('awf doctor gives both commands the plugin takes to install', async () => {
    const io = captureIo();
    expect(await main(['doctor'], io, env)).toBe(0);
    const lines = io.stdout.join('\n').split('\n');
    const marketplace = lines.findIndex(
      (l) => l.trim() === 'claude plugin marketplace add Jccorzo/awf',
    );
    expect(marketplace).toBeGreaterThan(0);
    expect(lines[marketplace + 1]?.trim()).toBe('claude plugin install awf@awf');
  });
});
