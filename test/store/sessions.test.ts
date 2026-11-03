import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readClaudeCodeTranscript } from '../../src/importers/claude-code/import';
import type { RecorderEvent } from '../../src/recorder/event';
import { eventsToSession } from '../../src/recorder/steps';
import { readEvents } from '../../src/store/events';
import { writeImported } from '../../src/store/imported';
import {
  eventsRecorderMissed,
  loadSession,
  quickSession,
  type SessionRef,
} from '../../src/store/sessions';
import { ms, prompt, result, text, toolUse, writeTranscript } from '../transcript';

const FIXTURES = path.resolve(__dirname, '../../fixtures/claude-code');
const TEST_FIX = {
  dir: path.join(FIXTURES, 'cc-2.1.312-test-fix'),
  id: '4045beec-4abe-4901-822b-0e34d3c9fa14',
};
const BG_AGENT = {
  dir: path.join(FIXTURES, 'cc-2.1.312-bg-agent'),
  id: '8c4861e7-317a-454e-890d-dc06d3b1c856',
};
const ID = 'session';

function event(e: string, seconds: number, extra: Partial<RecorderEvent> = {}): RecorderEvent {
  return { v: 1, e, t: ms(seconds), sid: ID, ...extra };
}

/** What the hooks write for a turn: each just after its transcript entry, as in the fixtures. */
const hooks = {
  first: [
    event('UserPromptSubmit', 0.013),
    event('PreToolUse', 2.025, { tool: 'Bash', tuid: 'a', cmd: 'pnpm test' }),
    event('PostToolUse', 5.02, { tool: 'Bash', tuid: 'a', ok: true }),
    event('Stop', 8.02),
  ],
  second: [
    event('UserPromptSubmit', 100.013),
    event('PreToolUse', 102.025, { tool: 'Bash', tuid: 'b', cmd: 'pnpm build' }),
    event('PostToolUse', 105.02, { tool: 'Bash', tuid: 'b', ok: true }),
    event('Stop', 108.02),
  ],
  third: [event('UserPromptSubmit', 200.013), event('Stop', 203.02)],
};

/** Three turns: a test run, a build, and an answer with no tool call. */
const turns = [
  prompt(0, 'first'),
  toolUse(2, 'm1', 'a', 'Bash', { command: 'pnpm test' }),
  result(5, 'a'),
  text(8, 'm2'),
  prompt(100, 'second'),
  toolUse(102, 'm3', 'b', 'Bash', { command: 'pnpm build' }),
  result(105, 'b'),
  text(108, 'm4'),
  prompt(200, 'third'),
  text(203, 'm5'),
];
const localOutput = (t: number, words: string) => ({
  type: 'user',
  timestamp: new Date(ms(t)).toISOString(),
  message: { role: 'user', content: `<local-command-stdout>${words}</local-command-stdout>` },
});
const exit = [prompt(300, '<command-name>/exit</command-name>'), localOutput(300, 'Bye')];

const read = (entries: Parameters<typeof writeTranscript>[1]) =>
  readClaudeCodeTranscript(writeTranscript(ID, entries));

/** The seconds of each prompt the transcript would add. */
function missedPrompts(entries: Parameters<typeof writeTranscript>[1], recorded: RecorderEvent[]) {
  return eventsRecorderMissed(read(entries), recorded)
    .filter((e) => e.e === 'UserPromptSubmit')
    .map((e) => (e.t - ms(0)) / 1000);
}

describe('eventsRecorderMissed', () => {
  it('adds every turn when the recorder only saw a process start and end', () => {
    const recorded = [event('SessionStart', 250), event('SessionEnd', 260)];
    expect(missedPrompts(turns, recorded)).toEqual([0, 100, 200]);
    // Even a second after the last turn: a process starting says nothing about that turn.
    expect(missedPrompts(turns, [event('SessionStart', 204)])).toEqual([0, 100, 200]);
    expect(missedPrompts(turns, [event('SessionEnd', 204)])).toEqual([0, 100, 200]);
  });

  it('adds what the transcript holds before its first turn', () => {
    const compacted = [
      { type: 'system', subtype: 'compact_boundary', timestamp: new Date(ms(-50)).toISOString() },
      ...turns,
    ];
    const missed = eventsRecorderMissed(read(compacted), hooks.third).map((e) => e.e);
    expect(missed.slice(0, 2)).toEqual(['PreCompact', 'PostCompact']);
  });

  it('adds the turns before the recorder started', () => {
    expect(missedPrompts(turns, [event('SessionStart', 150), ...hooks.third])).toEqual([0, 100]);
  });

  it('adds the turns after the recorder stopped', () => {
    expect(missedPrompts(turns, [...hooks.first, event('SessionEnd', 50)])).toEqual([100, 200]);
    // A process that died, or a plugin removed while it ran, leaves no SessionEnd.
    expect(missedPrompts(turns, hooks.first)).toEqual([100, 200]);
  });

  it('adds the turns from while the recorder was off', () => {
    expect(missedPrompts(turns, [...hooks.first, ...hooks.third])).toEqual([100]);
  });

  it('adds nothing to a session recorded whole', () => {
    const recorded = [
      event('SessionStart', -1),
      ...hooks.first,
      ...hooks.second,
      ...hooks.third,
      event('SessionEnd', 210),
    ];
    expect(eventsRecorderMissed(read(turns), recorded)).toEqual([]);
  });

  it("doesn't count a hook that fires ahead of its transcript entry as the turn before", () => {
    const recorded = [event('UserPromptSubmit', 199.995), event('Stop', 203.02)];
    expect(missedPrompts(turns, recorded)).toEqual([0, 100]);
  });

  it('keeps the old turn when the recorder first sees a compaction', () => {
    const recorded = [event('PreCompact', 150), event('PostCompact', 160), ...hooks.third];
    expect(missedPrompts(turns, recorded)).toEqual([0, 100]);
  });

  it('stops at what the recorder saw next, so a compaction is not counted twice', () => {
    const compacted = [
      ...turns.slice(0, 4),
      { type: 'system', subtype: 'compact_boundary', timestamp: new Date(ms(60)).toISOString() },
      ...turns.slice(4),
    ];
    const recorded = [event('PreCompact', 59), event('PostCompact', 61), ...hooks.second];
    const missed = eventsRecorderMissed(read(compacted), recorded).map((e) => e.e);
    expect(missed).toContain('UserPromptSubmit');
    expect(missed).not.toContain('PostCompact');
  });

  it("doesn't take a slash command for a turn the recorder missed", () => {
    const recorded = [...hooks.first, ...hooks.second, ...hooks.third, event('SessionEnd', 300.05)];
    expect(eventsRecorderMissed(read([...turns, ...exit]), recorded)).toEqual([]);
    // Claude Code's own reply, with no model behind it, isn't work either.
    const noReply = text(301, 'm9', 'No response requested.') as {
      message: Record<string, unknown>;
    };
    noReply.message.model = '<synthetic>';
    expect(eventsRecorderMissed(read([...turns, ...exit, noReply]), recorded)).toEqual([]);
  });

  it('leaves a turn that has only its prompt so far to the recorder', () => {
    const recorded = [...hooks.first, event('UserPromptSubmit', 100.013)];
    expect(eventsRecorderMissed(read([...turns.slice(0, 5)]), recorded)).toEqual([]);
  });

  it('keeps a subagent that outlived its turn', () => {
    const file = writeTranscript(ID, turns, {
      helper: [text(50, 'sub1'), text(90, 'sub2')],
    });
    const missed = eventsRecorderMissed(readClaudeCodeTranscript(file), hooks.second);
    expect(missed.filter((e) => e.aid === 'helper').map((e) => e.e)).toContain('SubagentStop');
  });

  it.each([
    ['a test run that failed', TEST_FIX],
    ['two prompts and a background subagent', BG_AGENT],
  ])('adds nothing to a fixture recorded whole: %s', (_name, { dir, id }) => {
    const transcript = readClaudeCodeTranscript(path.join(dir, `${id}.jsonl`));
    const recorded = readEvents(path.join(dir, 'events', `${id}.jsonl`));
    expect(eventsRecorderMissed(transcript, recorded)).toEqual([]);
  });
});

/** A session in the shape `resolveSession` gives. */
function sessionRef(
  file: string | undefined,
  events: RecorderEvent[],
  mtimeMs = 0,
  id = ID,
): SessionRef {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'awf-merge-'));
  const eventsFile = path.join(dir, 'events.jsonl');
  writeFileSync(eventsFile, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  const ref: SessionRef = { id, events: { id, path: eventsFile, mtimeMs: 0, size: 0 } };
  if (file) ref.transcript = { id, path: file, mtimeMs, size: 0, project: '-tmp-demo' };
  return ref;
}

describe('loadSession with a session older than the plugin', () => {
  const transcript = path.join(TEST_FIX.dir, `${TEST_FIX.id}.jsonl`);
  const old = readClaudeCodeTranscript(transcript).session;
  const end = old.endMs;
  const raw = (e: string, t: number, extra: Partial<RecorderEvent> = {}): RecorderEvent => ({
    v: 1,
    e,
    t,
    sid: TEST_FIX.id,
    ...extra,
  });
  const resumed = [
    raw('SessionStart', end + 60_000, { src: 'resume' }),
    raw('UserPromptSubmit', end + 65_000),
    raw('PreToolUse', end + 70_000, { tool: 'Bash', tuid: 'new-call', cmd: 'ls' }),
    raw('PostToolUse', end + 71_000, { tool: 'Bash', tuid: 'new-call', ok: true }),
    raw('Stop', end + 75_000),
  ];
  const load = (events: RecorderEvent[]) =>
    loadSession(sessionRef(transcript, events, 0, TEST_FIX.id), { env: {} });

  it('reads the transcript while the recorder has only seen it start', () => {
    const session = load(resumed.slice(0, 1));
    expect(session.sources).toEqual(['recorder', 'transcript']);
    expect(session.steps.map((s) => s.id)).toEqual(old.steps.map((s) => s.id));
    expect(session.endMs).toBe(old.endMs);
  });

  it('joins the turns before the recorder to the ones it recorded', () => {
    const session = load(resumed);
    const tools = session.steps.filter((s) => s.kind === 'tool');
    const oldTools = old.steps.filter((s) => s.kind === 'tool');
    expect(tools.map((s) => s.id)).toEqual([...oldTools.map((s) => s.id), 'new-call']);
    expect(new Set(session.steps.map((s) => s.id)).size).toBe(session.steps.length);
    expect(session.startMs).toBe(old.startMs);
    expect(session.endMs).toBe(end + 75_000);

    // What the transcript knows still reaches the old steps.
    expect(tools.filter((s) => s.ok === false)).toHaveLength(1);
    expect(session.steps.find((s) => s.kind === 'model')?.model).toBeDefined();

    // Between them you were away: from the old last turn to the new prompt.
    const sessionTurns = session.steps.filter((s) => s.kind === 'turn');
    const idle = session.steps.filter((s) => s.kind === 'idle').at(-1);
    expect(sessionTurns).toHaveLength(old.steps.filter((s) => s.kind === 'turn').length + 1);
    expect(idle).toMatchObject({ startMs: sessionTurns.at(-2)?.endMs, endMs: end + 65_000 });
  });
});

describe('loadSession with the plugin off for part of a session', () => {
  const file = writeTranscript(ID, [...turns, ...exit]);
  const load = (events: RecorderEvent[]) => loadSession(sessionRef(file, events), { env: {} });
  const toolIds = (events: RecorderEvent[]) =>
    load(events)
      .steps.filter((s) => s.kind === 'tool')
      .map((s) => s.id);

  it('adds the turns after the recorder stopped, without the /exit that ended them', () => {
    const session = load([...hooks.first, event('SessionEnd', 50)]);
    expect(toolIds([...hooks.first, event('SessionEnd', 50)])).toEqual(['a', 'b']);
    expect(session.steps.filter((s) => s.kind === 'turn')).toHaveLength(3);
    expect(session.endMs).toBe(ms(203));
  });

  it('adds the turns from while it was off, in order, with the waits around them', () => {
    const session = load([...hooks.first, ...hooks.third]);
    expect(toolIds([...hooks.first, ...hooks.third])).toEqual(['a', 'b']);
    expect(
      session.steps
        .filter((s) => s.kind === 'turn')
        .map((s) => Math.round((s.startMs - ms(0)) / 1000)),
    ).toEqual([0, 100, 200]);
    expect(session.steps.filter((s) => s.kind === 'idle')).toHaveLength(2);
  });

  it('adds no waiting time to a session that ended with /exit', () => {
    const session = load([
      ...hooks.first,
      ...hooks.second,
      ...hooks.third,
      event('SessionEnd', 300.05),
    ]);
    expect(session.steps.filter((s) => s.kind === 'turn')).toHaveLength(3);
    expect(session.endMs).toBe(ms(203.02));
  });
});

describe('quickSession', () => {
  const fresh = event('SessionStart', -1, { src: 'startup' });
  const whole = [fresh, ...hooks.first, ...hooks.second, ...hooks.third];

  it("doesn't read the transcript of a session recorded from its start", () => {
    // A real transcript: reading it would show in the sources.
    const ref = sessionRef(writeTranscript(ID, turns), whole, ms(203.02));
    expect(quickSession(ref, {})).toMatchObject({ sources: ['recorder'] });
  });

  it('reads the transcript of a session the recorder joined late', () => {
    const file = writeTranscript(ID, turns);
    const ref = sessionRef(
      file,
      [event('SessionStart', 150, { src: 'resume' }), ...hooks.third],
      ms(203.02),
    );
    const session = quickSession(ref, {});
    expect(session?.sources).toEqual(['recorder', 'transcript']);
    expect(session?.steps.filter((s) => s.kind === 'turn')).toHaveLength(3);
  });

  it('reads the transcript when it changed after the recorder stopped', () => {
    const file = writeTranscript(ID, turns);
    const ref = sessionRef(file, [fresh, ...hooks.first], ms(203));
    expect(quickSession(ref, {})?.steps.filter((s) => s.kind === 'tool')).toHaveLength(2);
  });

  it("falls back on awf import's copy when the transcript is gone, if it holds more", () => {
    const home = mkdtempSync(path.join(os.tmpdir(), 'awf-home-'));
    const env = { AWF_HOME: home };
    const full = read(turns).session;
    writeImported(
      {
        version: 5,
        source: { path: '/gone.jsonl', mtimeMs: 0, size: 0 },
        session: { ...full, id: ID },
      },
      env,
    );
    const resumed = [event('SessionStart', 150, { src: 'resume' }), ...hooks.third];
    expect(quickSession(sessionRef(undefined, resumed), env)).toMatchObject({
      sources: ['import-cache'],
      startMs: full.startMs,
    });
  });

  it("keeps the recorder's copy when awf import's holds no more", () => {
    const env = { AWF_HOME: mkdtempSync(path.join(os.tmpdir(), 'awf-home-')) };
    const session = eventsToSession(ID, hooks.first);
    const source = { path: '/gone.jsonl', mtimeMs: 0, size: 0 };
    writeImported({ version: 5, source, session }, env);
    expect(quickSession(sessionRef(undefined, hooks.first), env)?.sources).toEqual(['recorder']);
  });
});
