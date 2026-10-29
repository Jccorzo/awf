import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { importClaudeCodeTranscript } from '../../src/importers/claude-code/import';
import type { Session, Step } from '../../src/model/types';
import {
  ms,
  notification,
  prompt,
  result,
  system,
  text,
  toolUse,
  writeTranscript,
} from '../transcript';

const FIXTURES = path.resolve(__dirname, '../../fixtures/claude-code');

/** A stable, readable form of a session for snapshots: offsets from the start, not epoch times. */
function outline(session: Session) {
  const t0 = session.startMs;
  const short = (id: string | null | undefined) =>
    id ? id.replace(/^toolu_01/, '').slice(0, 12) : '-';
  const line = (s: Step) =>
    [
      s.kind,
      s.tool ?? '',
      s.command ? JSON.stringify(s.command.slice(0, 60)) : '',
      `+${s.startMs - t0}`,
      `${s.endMs - s.startMs}ms`,
      s.ok === undefined ? '' : s.ok ? 'ok' : 'FAILED',
      s.exitCode !== undefined ? `exit ${s.exitCode}` : '',
      s.flags.length ? `[${s.flags.join(',')}]` : '',
      `in ${short(s.parentId)}`,
    ]
      .filter(Boolean)
      .join(' ');
  return {
    agentVersion: session.agentVersion,
    durationMs: session.endMs - session.startMs,
    unknownEntries: session.diagnostics?.unknownEntries,
    badLines: session.diagnostics?.badLines,
    steps: session.steps.map(line),
  };
}

const fixtures = readdirSync(FIXTURES).filter((name) => !name.startsWith('.'));

describe('Claude Code importer on scrubbed fixtures', () => {
  it.each(fixtures)('%s', (name) => {
    const dir = path.join(FIXTURES, name);
    const main = readdirSync(dir).find((f) => f.endsWith('.jsonl'));
    expect(main, `a transcript in ${dir}`).toBeDefined();
    const session = importClaudeCodeTranscript(path.join(dir, main as string));
    expect(session.steps.length).toBeGreaterThan(0);
    expect(session.diagnostics?.unknownEntries).toEqual({});
    expect(outline(session)).toMatchSnapshot();
  });
});

describe('Claude Code importer edge cases', () => {
  it('times a turn: model time, a failed test run, a fix and a passing run', () => {
    const file = writeTranscript('s1', [
      prompt(0, 'fix the tests'),
      toolUse(4, 'm1', 't1', 'Bash', { command: 'pnpm test' }),
      result(10, 't1', { error: true, content: 'Exit code 1\nFAIL src/a.test.ts' }),
      toolUse(15, 'm2', 'e1', 'Edit', { file_path: '/repo/src/a.ts' }),
      result(15.2, 'e1'),
      toolUse(18, 'm3', 't2', 'Bash', { command: 'pnpm test' }),
      result(24, 't2', { content: 'Tests 3 passed' }),
      text(30, 'm4', 'All green.'),
      system(30.1, 'turn_duration', { durationMs: 30100 }),
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session).toMatchObject({
      id: 's1',
      cwd: '/repo',
      agentVersion: '2.1.312',
      startMs: ms(0),
      endMs: ms(30.1),
    });
    const t1 = session.steps.find((s) => s.id === 't1');
    expect(t1).toMatchObject({
      command: 'pnpm test',
      ok: false,
      exitCode: 1,
      startMs: ms(4),
      endMs: ms(10),
    });
    const model = session.steps
      .filter((s) => s.kind === 'model')
      .map((s) => [s.startMs - ms(0), s.endMs - ms(0)]);
    expect(model).toEqual([
      [0, 4000],
      [10000, 15000],
      [15200, 18000],
      [24000, 30100],
    ]);
    expect(session.steps.find((s) => s.kind === 'model')).toMatchObject({
      model: 'claude-opus-5-5',
      tokens: { input: 10, output: 20, cacheRead: 300, cacheWrite: 40 },
    });
  });

  it('links parallel calls to one model step and flags them', () => {
    const file = writeTranscript('s2', [
      prompt(0, 'look around'),
      toolUse(2, 'm1', 'r1', 'Read', { file_path: '/repo/a.ts' }),
      toolUse(2.1, 'm1', 'r2', 'Grep', { path: '/repo' }),
      result(2.3, 'r1'),
      result(2.5, 'r2'),
      text(5, 'm2'),
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session.steps.find((s) => s.kind === 'model')?.produces).toEqual(['r1', 'r2']);
    expect(session.steps.find((s) => s.id === 'r2')?.flags).toContain('parallel');
  });

  it('runs a background shell until its completion notice', () => {
    const file = writeTranscript('s3', [
      prompt(0, 'build in the background'),
      toolUse(1, 'm1', 'b1', 'Bash', { command: 'pnpm build', run_in_background: true }),
      result(1.1, 'b1', {
        content: 'Command running in background with ID: bg123. Output is being written to: /tmp/x',
        toolUseResult: { backgroundTaskId: 'bg123', stdout: '', stderr: '', interrupted: false },
      }),
      text(3, 'm2'),
      notification(61, 'bg123', 'failed'),
      prompt(
        62,
        '<task-notification><task-id>bg123</task-id><status>failed</status></task-notification>',
        'task-notification',
      ),
      text(65, 'm3'),
    ]);
    const session = importClaudeCodeTranscript(file);
    const bg = session.steps.find((s) => s.kind === 'background');
    expect(bg).toMatchObject({
      parentId: 'b1',
      command: 'pnpm build',
      startMs: ms(1),
      endMs: ms(61),
      ok: false,
    });
    expect(session.steps.filter((s) => s.kind === 'turn')[1]?.flags).toEqual(['notification']);
  });

  it('nests a subagent read from its own transcript', () => {
    const file = writeTranscript(
      's4',
      [
        prompt(0, 'explore'),
        toolUse(1, 'm1', 'a1', 'Agent', {
          subagent_type: 'Explore',
          description: 'find it',
          prompt: 'find sum',
        }),
        result(20, 'a1', {
          toolUseResult: { agentId: 'x9', agentType: 'Explore', status: 'completed' },
        }),
        text(22, 'm2'),
      ],
      {
        x9: [
          {
            type: 'user',
            timestamp: new Date(ms(1.2)).toISOString(),
            message: { role: 'user', content: 'find sum' },
          },
          toolUse(5, 'sm1', 'g1', 'Grep', { path: '/repo' }),
          result(5.5, 'g1'),
          text(19, 'sm2', 'found it'),
        ],
      },
    );
    const session = importClaudeCodeTranscript(file);
    const sub = session.steps.find((s) => s.kind === 'subagent');
    expect(sub).toMatchObject({
      parentId: 'a1',
      agentType: 'Explore',
      startMs: ms(1.2),
      endMs: ms(19),
    });
    expect(session.steps.find((s) => s.id === 'g1')).toMatchObject({
      parentId: 'agent:x9',
      agentId: 'x9',
    });
  });

  it('marks interrupted calls and ends the turn at the interruption', () => {
    const file = writeTranscript('s5', [
      prompt(0, 'run it'),
      toolUse(1, 'm1', 't1', 'Bash', { command: 'sleep 100' }),
      result(9, 't1', {
        error: true,
        content: 'Interrupted',
        toolUseResult: { interrupted: true, stdout: '', stderr: '' },
      }),
      {
        type: 'user',
        timestamp: new Date(ms(9.1)).toISOString(),
        message: {
          role: 'user',
          content: [{ type: 'text', text: '[Request interrupted by user for tool use]' }],
        },
      },
      prompt(300, 'try something else'),
      text(305, 'm2'),
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session.steps.find((s) => s.id === 't1')).toMatchObject({ ok: false });
    expect(session.steps.find((s) => s.id === 't1')?.flags).toContain('interrupted');
    const turns = session.steps.filter((s) => s.kind === 'turn');
    expect(turns[0]?.endMs).toBe(ms(9.1));
    expect(session.steps.find((s) => s.kind === 'idle')).toMatchObject({
      startMs: ms(9.1),
      endMs: ms(300),
    });
  });

  it('treats a resumed session as one session with the gap as idle', () => {
    const file = writeTranscript('s6', [
      prompt(0, 'a'),
      text(5, 'm1'),
      prompt(7200, 'b, the next morning'),
      text(7210, 'm2'),
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session.steps.filter((s) => s.kind === 'turn')).toHaveLength(2);
    expect(session.steps.find((s) => s.kind === 'idle')).toMatchObject({
      startMs: ms(5),
      endMs: ms(7200),
    });
  });

  it('reads a compaction from its boundary and duration', () => {
    const file = writeTranscript('s7', [
      prompt(0, 'long task'),
      toolUse(10, 'm1', 't1', 'Read', { file_path: '/repo/a' }),
      result(11, 't1'),
      system(80, 'compact_boundary', {
        compactMetadata: { trigger: 'auto', durationMs: 60000, preTokens: 190000 },
      }),
      toolUse(85, 'm2', 't2', 'Read', { file_path: '/repo/b' }),
      result(86, 't2'),
      text(90, 'm3'),
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session.steps.find((s) => s.kind === 'compact')).toMatchObject({
      startMs: ms(20),
      endMs: ms(80),
    });
    const before = session.steps.filter((s) => s.kind === 'model' && s.produces?.includes('t2'));
    expect(before.map((s) => [s.startMs - ms(0), s.endMs - ms(0)])).toEqual([
      [11000, 20000],
      [80000, 85000],
    ]);
  });

  it('flags calls you approved or rejected', () => {
    const file = writeTranscript('s8', [
      prompt(0, 'deploy'),
      toolUse(1, 'm1', 't1', 'Bash', { command: 'rm -rf dist' }),
      result(31, 't1', { permission: { decision: 'accept', source: 'user_temporary' } }),
      toolUse(32, 'm2', 't2', 'Bash', { command: 'git push --force' }),
      result(40, 't2', {
        error: true,
        content: 'rejected',
        permission: { decision: 'reject', source: 'user_reject' },
      }),
      text(41, 'm3'),
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session.steps.find((s) => s.id === 't1')).toMatchObject({ waitMs: 30000 });
    expect(session.steps.find((s) => s.id === 't1')?.flags).toContain('approval');
    expect(session.steps.find((s) => s.id === 't2')).toMatchObject({ ok: false });
    expect(session.steps.find((s) => s.id === 't2')?.flags).toEqual(
      expect.arrayContaining(['approval', 'denied']),
    );
  });

  it('counts unknown entries and bad lines without crashing', () => {
    const file = writeTranscript('s9', [
      prompt(0, 'hi'),
      { type: 'brand-new-entry', timestamp: new Date(ms(1)).toISOString() },
      { type: 'brand-new-entry', timestamp: new Date(ms(2)).toISOString() },
      system(3, 'new_subtype'),
      '{"type": "user", "timest',
      text(4, 'm1'),
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session.diagnostics).toMatchObject({
      unknownEntries: { 'brand-new-entry': 2, 'system:new_subtype': 1 },
      badLines: 1,
    });
    expect(session.steps.some((s) => s.kind === 'turn')).toBe(true);
  });

  it('flags a turn that ended on an API error', () => {
    const file = writeTranscript('s10', [
      prompt(0, 'hi'),
      {
        type: 'assistant',
        timestamp: new Date(ms(9)).toISOString(),
        isApiErrorMessage: true,
        message: { id: 'e1', model: '<synthetic>', content: [{ type: 'text', text: 'API Error' }] },
      },
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session.steps.find((s) => s.kind === 'model')?.flags).toContain('api-error');
  });

  it('reads the first prompt, descriptions and output only when asked', () => {
    const entries = [
      prompt(0, 'please run the tests with TOKEN=abc123'),
      toolUse(1, 'm1', 't1', 'Bash', { command: 'pnpm test', description: 'Run tests' }),
      result(2, 't1', { content: 'Tests 2 passed' }),
      text(3, 'm2'),
    ];
    const plain = importClaudeCodeTranscript(writeTranscript('s11', entries));
    expect(plain.title).toBeUndefined();
    expect(plain.steps.some((s) => s.detail)).toBe(false);
    const detailed = importClaudeCodeTranscript(writeTranscript('s11', entries), { detail: true });
    expect(detailed.title).toBe('please run the tests with TOKEN=‹masked›');
    expect(detailed.steps.find((s) => s.id === 't1')?.detail).toEqual({
      description: 'Run tests',
      output: 'Tests 2 passed',
    });
  });
});
