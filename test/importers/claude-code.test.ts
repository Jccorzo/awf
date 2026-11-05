import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/analyze/summary';
import { memoryFiles } from '../../src/classify/resolve';
import { importClaudeCodeTranscript } from '../../src/importers/claude-code/import';
import type { Session, Step } from '../../src/model/types';
import {
  compactSummary,
  monitorEvent,
  ms,
  notification,
  prompt,
  queuedNotice,
  request,
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

  it('starts a turn when the model answers a notice after its turn ended, not stretching model time', () => {
    const notice = (t: number, words: string) => ({
      type: 'user',
      timestamp: new Date(ms(t)).toISOString(),
      message: { role: 'user', content: words },
    });
    const day = 86_400;
    const file = writeTranscript('s9', [
      prompt(0, 'ship it'),
      text(5, 'm1', 'Shipped.'),
      system(5.1, 'stop_hook_summary'),
      // Hours later the app sends a reminder, and the model answers it.
      notice(
        7 * 3600,
        '<system-reminder>\nThe user started your proposal task.\n</system-reminder>',
      ),
      toolUse(7 * 3600 + 20, 'm2', 'r1', 'Read', { file_path: '/repo/a.ts' }),
      result(7 * 3600 + 21, 'r1'),
      text(7 * 3600 + 30, 'm3', 'Started it.'),
      system(7 * 3600 + 30.1, 'stop_hook_summary'),
      // Days later: a `!` command and an interruption, with no answer.
      notice(6 * day, '<bash-input>glab auth login</bash-input>'),
      notice(6 * day + 60, '[Request interrupted by user]'),
    ]);
    const session = importClaudeCodeTranscript(file);
    const turns = session.steps.filter((s) => s.kind === 'turn');
    expect(turns.map((t) => [t.startMs, t.endMs])).toEqual([
      [ms(0), ms(5.1)],
      [ms(7 * 3600), ms(7 * 3600 + 30.1)],
    ]);
    expect(turns[1]?.flags).toContain('notification');
    const longest = Math.max(
      ...session.steps.filter((s) => s.kind === 'model').map((s) => s.endMs - s.startMs),
    );
    expect(longest).toBeLessThan(60_000);
  });

  it("starts a subagent's model time at the send that was answered, not while it resent the request", () => {
    // A background subagent starts a build in the background, polls for it until the poll is moved
    // to the background, then sends its next request again and again for 22 minutes (API errors,
    // timeouts) while both tasks finish. The answer comes from the last send, on a cold cache.
    const file = writeTranscript(
      'resent',
      [
        prompt(0, 'fix the flaky test in the background'),
        toolUse(0.5, 'm1', 'a1', 'Agent', { subagent_type: 'general-purpose', prompt: 'go' }),
        result(1, 'a1', {
          toolUseResult: { agentId: 'bgagent', agentType: 'general-purpose', isAsync: true },
        }),
        text(2, 'm2', 'Started it.'),
        system(2.1, 'turn_duration'),
        prompt(2000, 'how did it go?'),
        text(2005, 'm3', 'It passed.'),
      ],
      {
        bgagent: [
          { ...prompt(1, 'go'), message: { role: 'user', content: 'go' } },
          request(1.1, 'q1'),
          toolUse(2, 'sm1', 'b1', 'Bash', {
            command: 'xcodebuild test -scheme App > /tmp/run.log 2>&1',
            run_in_background: true,
          }),
          result(2.5, 'b1', {
            content: 'Command running in background with ID: bgbuild.',
            toolUseResult: { backgroundTaskId: 'bgbuild' },
          }),
          request(2.6, 'q2'),
          toolUse(3, 'sm2', 'p1', 'Bash', {
            command: 'until grep -q "exit" /tmp/run.log; do sleep 10; done',
          }),
          result(183, 'p1', {
            content: 'Command was moved to the background (ID: bgpoll) after running for 180s.',
            toolUseResult: { backgroundTaskId: 'bgpoll' },
          }),
          request(183.1, 'q3'),
          request(184, 'q4'),
          request(400, 'q5'),
          request(899, 'q6'),
          request(1500, 'q7'),
          {
            ...toolUse(1530, 'sm3', 'r1', 'Read', { file_path: '/repo/AppTests.swift' }),
            requestRef: 'q7',
          },
          result(1530.5, 'r1'),
          // Written when they reached the agent, timestamped when the tasks ended.
          queuedNotice(600, 'bgbuild', 'completed'),
          queuedNotice(900, 'bgpoll', 'completed'),
          request(1530.6, 'q8'),
          text(1540, 'sm4', 'The test passes now.'),
        ],
      },
    );
    const session = importClaudeCodeTranscript(file);
    const before = session.steps.find((s) => s.kind === 'model' && s.produces?.includes('r1'));
    expect(before).toMatchObject({ startMs: ms(1500), endMs: ms(1530), agentId: 'bgagent' });
    expect(before?.flags).toContain('resent');
    // Sent once: model time as before, from the result to the call.
    expect(
      session.steps.find((s) => s.kind === 'model' && s.produces?.includes('p1')),
    ).toMatchObject({ startMs: ms(2.5), endMs: ms(3) });
    const bg = session.steps.filter((s) => s.kind === 'background');
    expect(bg.map((s) => [s.backgroundId, s.startMs, s.endMs])).toEqual([
      ['bgbuild', ms(2), ms(600)],
      ['bgpoll', ms(3), ms(900)],
    ]);

    // The wait takes the background build's phase while it runs, then the idle time between
    // your turns (the poller is a background process: it doesn't take idle time).
    const { summary } = analyze(session, { files: memoryFiles({}) });
    const phase = (id: string) => summary.phases.find((p) => p.phase === id)?.ms ?? 0;
    expect(phase('tests')).toBe(600_000 - 2_100); // from the end of your turn to the build's end
    expect(phase('exploring')).toBe(30_500); // the answer and its Read, not the 22 minutes before
    expect(phase('waiting')).toBe(1500_000 - 600_000 + (2000_000 - 1540_000));
  });

  it("starts the main agent's model time at the last send when the answer names no request", () => {
    const file = writeTranscript('resent-main', [
      prompt(0, 'look'),
      request(0.1, 'q1'),
      request(30, 'q2'),
      request(400, 'q3'),
      toolUse(405, 'm1', 'r1', 'Read', { file_path: '/repo/a.ts' }),
      result(405.5, 'r1'),
      request(405.6, 'q4'),
      text(410, 'm2'),
    ]);
    const session = importClaudeCodeTranscript(file);
    const models = session.steps.filter((s) => s.kind === 'model');
    expect(models.map((s) => [s.startMs, s.endMs, s.flags])).toEqual([
      [ms(400), ms(405), ['resent']],
      [ms(405.5), ms(410), ['answer']],
    ]);
    // Nothing ran while the request was resent: that stretch of the turn is agent overhead.
    const { summary } = analyze(session, { files: memoryFiles({}) });
    expect(summary.uncoveredMs).toBe(400_000);
  });

  it('ends a background task at the call that stopped it: a stopped task sends no notice', () => {
    const file = writeTranscript('stopped', [
      prompt(0, 'run the tests in the background'),
      toolUse(1, 'm1', 'b1', 'Bash', { command: 'pnpm vitest run', run_in_background: true }),
      result(1.5, 'b1', {
        content: 'Command running in background with ID: bgtests.',
        toolUseResult: { backgroundTaskId: 'bgtests' },
      }),
      toolUse(300, 'm2', 's1', 'TaskStop', { task_id: 'bgtests' }),
      result(300.2, 's1', { content: '{"message":"Successfully stopped task: bgtests"}' }),
      text(305, 'm3', 'Stopped it.'),
    ]);
    const session = importClaudeCodeTranscript(file);
    const bg = session.steps.find((s) => s.kind === 'background');
    expect(bg).toMatchObject({ backgroundId: 'bgtests', startMs: ms(1), endMs: ms(300.2) });
    expect(bg?.flags).toContain('interrupted');
    expect(bg?.ok).toBeUndefined();
  });

  it("reads a background shell's task from its result text when there's no toolUseResult", () => {
    // Some subagent transcripts leave toolUseResult out; the text still names the task.
    const file = writeTranscript('bg-text', [
      prompt(0, 'build it in the background'),
      toolUse(1, 'm1', 'b1', 'Bash', { command: 'pnpm build', run_in_background: true }),
      result(1.5, 'b1', {
        content:
          'Command running in background with ID: bgbuild. Output is being written to: /tmp/t/bgbuild.output',
      }),
      text(2, 'm2', 'Started.'),
      system(2.1, 'turn_duration'),
      notification(120, 'bgbuild', 'completed'),
      // Output that only mentions the phrase doesn't start a task.
      prompt(200, 'what did it print?'),
      toolUse(201, 'm3', 'b2', 'Bash', { command: 'cat notes.txt' }),
      result(201.5, 'b2', { content: 'see: Command running in background with ID: nope' }),
      text(203, 'm4', 'That.'),
    ]);
    const session = importClaudeCodeTranscript(file);
    const bg = session.steps.filter((s) => s.kind === 'background');
    expect(bg).toHaveLength(1);
    expect(bg[0]).toMatchObject({ backgroundId: 'bgbuild', startMs: ms(1), endMs: ms(120) });
  });

  it('runs a Monitor in the background until its kill notice, filling a resent request', () => {
    // The agent watches CI with a Monitor, then its next request is sent again for three minutes.
    // The Monitor's events aren't its end; it's killed after the last turn, when you leave.
    const file = writeTranscript('monitor', [
      prompt(0, 'fix the pipeline'),
      request(0.1, 'q1'),
      toolUse(5, 'm1', 'mon', 'Monitor', {
        command:
          'while true; do gh pr checks 75 --json name,bucket | jq -r ".[].bucket"; sleep 30; done',
        description: 'PR checks',
        timeout_ms: 1_200_000,
      }),
      result(6.1, 'mon', {
        content: 'Monitor started (task bmon1, expires in 20m unless the source ends first).',
        toolUseResult: { taskId: 'bmon1', timeoutMs: 1_200_000, persistent: false },
      }),
      request(6.2, 'q2'),
      monitorEvent(150, 'bmon1', 'Lint Code: pass'),
      request(187, 'q3'),
      {
        ...toolUse(190, 'm2', 'r1', 'Read', { file_path: '/repo/package.json' }),
        requestRef: 'q3',
      },
      result(190.5, 'r1'),
      request(190.6, 'q4'),
      text(195, 'm3', 'Pinned it.'),
      system(195.1, 'turn_duration'),
      notification(260, 'bmon1', 'killed'),
    ]);
    const session = importClaudeCodeTranscript(file);
    const bg = session.steps.find((s) => s.kind === 'background');
    expect(bg).toMatchObject({
      parentId: 'mon',
      tool: 'Monitor',
      backgroundId: 'bmon1',
      startMs: ms(5),
      endMs: ms(260),
      flags: ['background'],
      ok: false,
    });
    expect(
      session.steps.find((s) => s.kind === 'model' && s.produces?.includes('r1')),
    ).toMatchObject({ startMs: ms(187), flags: ['resent'] });

    const { session: classified, summary } = analyze(session, { files: memoryFiles({}) });
    expect(classified.steps.find((s) => s.kind === 'background')).toMatchObject({
      phase: 'running',
      tags: expect.arrayContaining(['polling']),
    });
    const phase = (id: string) => summary.phases.find((p) => p.phase === id)?.ms ?? 0;
    // The resent request's three minutes go to the poller running then, not to Unclassified.
    expect(phase('running')).toBe(187_000);
    expect(phase('unclassified')).toBe(0);
    expect(summary.uncoveredMs).toBe(0);
    // Killed after the last turn: it doesn't stretch the session.
    expect(summary.totalMs).toBe(195_100);
  });

  it("ends a Monitor with no notice at its timeout, or at the transcript's last entry", () => {
    const file = writeTranscript('monitor-timeout', [
      prompt(0, 'watch the log'),
      toolUse(1, 'm1', 'mon1', 'Monitor', {
        command: 'tail -n 0 -F /tmp/app.log | grep --line-buffered ERROR',
        description: 'errors in app.log',
        timeout_ms: 60_000,
      }),
      // Some subagent transcripts have no toolUseResult: the task ID is read from the text.
      result(2, 'mon1', {
        content: 'Monitor started (task bmon2, expires in 1m unless the source ends first).',
      }),
      text(3, 'm2', 'Watching.'),
      system(3.1, 'turn_duration'),
      prompt(600, 'anything?'),
      toolUse(601, 'm3', 'mon2', 'Monitor', { command: 'tail -F /tmp/app.log', description: 'x' }),
      result(602, 'mon2', {
        content: 'Monitor started (task bmon3, expires in 5m unless the source ends first).',
        toolUseResult: { taskId: 'bmon3', timeoutMs: 300_000, persistent: false },
      }),
      toolUse(605, 'm4', 'o1', 'TaskOutput', { task_id: 'bmon3', block: false }),
      result(605.5, 'o1'),
      text(610, 'm5', 'No errors.'),
    ]);
    const session = importClaudeCodeTranscript(file);
    const bg = session.steps.filter((s) => s.kind === 'background');
    expect(bg.map((s) => [s.backgroundId, s.startMs, s.endMs, s.flags])).toEqual([
      ['bmon2', ms(1), ms(62), ['background', 'unfinished']],
      ['bmon3', ms(601), ms(610), ['background', 'unfinished']],
    ]);
    expect(bg[0]?.ok).toBeUndefined();

    const { session: classified, summary } = analyze(session, { files: memoryFiles({}) });
    // Reading its output takes the Monitor's phase, from its command.
    expect(classified.steps.find((s) => s.id === 'o1')).toMatchObject({
      phase: 'exploring',
      tags: ['background-task'],
    });
    const phase = (id: string) => summary.phases.find((p) => p.phase === id)?.ms ?? 0;
    // A log tail is Exploring, but a Monitor is a watcher: while you're away it's your wait.
    expect(phase('waiting')).toBe(600_000 - 3_100);
    expect(phase('exploring')).toBe(3_500); // the read of its output and the model time before it
  });

  it("doesn't let a compaction while you're away stretch the session after its last turn", () => {
    const file = writeTranscript('idle-compaction-end', [
      prompt(0, 'a'),
      text(5, 'm1'),
      system(5.1, 'turn_duration'),
      system(3300, 'compact_boundary', {
        compactMetadata: { trigger: 'auto', durationMs: 35_000, preTokens: 320_000 },
      }),
      compactSummary(3300),
      system(3300.1, 'informational', {
        content: 'Compacted while idle, before the prompt cache expired',
      }),
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session.endMs).toBe(ms(5.1));
    expect(session.steps.some((s) => s.kind === 'compact')).toBe(false);
    const { summary } = analyze(session, { files: memoryFiles({}) });
    expect(summary.totalMs).toBe(5_100);
    expect(summary.phases.find((p) => p.phase === 'unclassified')?.ms).toBe(0);
  });

  it("counts a compaction while you're away between turns as waiting on you", () => {
    const file = writeTranscript('idle-compaction', [
      prompt(0, 'a'),
      text(5, 'm1'),
      system(5.1, 'turn_duration'),
      system(3300, 'compact_boundary', {
        compactMetadata: { trigger: 'auto', durationMs: 35_000, preTokens: 320_000 },
      }),
      compactSummary(3300),
      system(3300.1, 'informational', {
        content: 'Compacted while idle, before the prompt cache expired',
      }),
      // A reminder the model answers on its own: that turn starts at the reminder, not at the
      // compaction's summary.
      {
        ...prompt(3500, '<system-reminder>A file changed.</system-reminder>'),
        origin: undefined,
        isMeta: true,
      },
      text(3502, 'm2', 'Noted.'),
      system(3502.1, 'turn_duration'),
      prompt(4000, 'b'),
      text(4005, 'm3'),
    ]);
    const session = importClaudeCodeTranscript(file);
    expect(session.steps.find((s) => s.kind === 'compact')).toMatchObject({
      parentId: null,
      startMs: ms(3265),
      endMs: ms(3300),
      flags: ['background'],
    });
    expect(session.steps.filter((s) => s.kind === 'turn').map((s) => s.startMs)).toEqual([
      ms(0),
      ms(3500),
      ms(4000),
    ]);
    // One gap, the compaction inside it.
    expect(session.steps.filter((s) => s.kind === 'idle').map((s) => [s.startMs, s.endMs])).toEqual(
      [
        [ms(5.1), ms(3500)],
        [ms(3502.1), ms(4000)],
      ],
    );
    const { session: classified, summary } = analyze(session, { files: memoryFiles({}) });
    expect(classified.steps.find((s) => s.kind === 'compact')).toMatchObject({
      phase: 'waiting',
      tags: ['compaction'],
    });
    const phase = summary.phases.find((p) => p.phase === 'waiting');
    expect(phase?.ms).toBe(3_494_900 + 497_900);
    expect(phase?.gaps).toBe(2);
    expect(summary.phases.find((p) => p.phase === 'unclassified')?.ms).toBe(0);
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

  it('keeps the names of what a browser call did, not its URLs or text', () => {
    const file = writeTranscript('browser', [
      prompt(0, 'check the login page'),
      toolUse(1, 'm1', 'toolu_b1', 'mcp__Claude_Browser__browser_batch', {
        actions: [
          { name: 'navigate', input: { url: 'http://localhost:3000/login' } },
          { name: 'computer', input: { action: 'type', text: 'secret words' } },
        ],
      }),
      result(3, 'toolu_b1'),
      toolUse(4, 'm2', 'toolu_b2', 'mcp__Claude_Browser__computer', { action: 'screenshot' }),
      result(5, 'toolu_b2'),
      text(6, 'm3'),
    ]);
    const session = importClaudeCodeTranscript(file);
    const step = (id: string) => session.steps.find((s) => s.id === id);
    expect(step('toolu_b1')?.actions).toEqual(['navigate', 'computer:type']);
    expect(step('toolu_b2')?.actions).toEqual(['computer:screenshot']);
    expect(JSON.stringify(session.steps)).not.toMatch(/localhost:3000|secret words/);
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

  it("doesn't count a message Claude Code wrote itself as model time", () => {
    // Claude Code writes some assistant messages itself: model "<synthetic>", no tokens. One that
    // lands days after a rejected plan, or after a notice the model never answered, is no model call.
    const synthetic = (t: number, id: string) => ({
      type: 'assistant',
      timestamp: new Date(ms(t)).toISOString(),
      message: {
        id,
        role: 'assistant',
        model: '<synthetic>',
        content: [{ type: 'text', text: 'No response requested.' }],
        usage: { input_tokens: 0, output_tokens: 0 },
      },
    });
    const day = 86_400;
    const file = writeTranscript('s12', [
      prompt(0, 'plan the change'),
      toolUse(5, 'm1', 'p1', 'ExitPlanMode', { plan: 'Do it' }),
      result(60, 'p1', { error: true, content: 'The user rejected the plan.' }),
      synthetic(3 * day, 'x1'),
      prompt(3 * day + 10, 'try again'),
      text(3 * day + 20, 'm2', 'Done.'),
    ]);
    const session = importClaudeCodeTranscript(file);
    const turns = session.steps.filter((s) => s.kind === 'turn');
    expect(turns.map((t) => [t.startMs, t.endMs])).toEqual([
      [ms(0), ms(60)],
      [ms(3 * day + 10), ms(3 * day + 20)],
    ]);
    expect(session.steps.find((s) => s.kind === 'idle')).toMatchObject({
      startMs: ms(60),
      endMs: ms(3 * day + 10),
    });
    const longest = Math.max(
      ...session.steps.filter((s) => s.kind === 'model').map((s) => s.endMs - s.startMs),
    );
    expect(longest).toBeLessThan(60_000);
    const { summary } = analyze(session, { files: memoryFiles({}) });
    const phase = (id: string) => summary.phases.find((p) => p.phase === id)?.ms ?? 0;
    expect(phase('waiting')).toBeGreaterThan(3 * day * 1000 - 60_000);
    expect(phase('planning')).toBeLessThan(30_000);
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
