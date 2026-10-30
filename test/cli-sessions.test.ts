import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { main } from '../src/cli/main';
import type { RecorderEvent } from '../src/recorder/event';
import { captureIo } from './helpers';

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
