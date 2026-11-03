import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
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
