import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readClaudeCodeTranscript } from '../../src/importers/claude-code/import';
import type { RecorderEvent } from '../../src/recorder/event';
import { readEvents } from '../../src/store/events';
import { eventsBeforeRecorder, loadSession } from '../../src/store/sessions';

const FIXTURES = path.resolve(__dirname, '../../fixtures/claude-code');
const TEST_FIX = {
  dir: path.join(FIXTURES, 'cc-2.1.312-test-fix'),
  id: '4045beec-4abe-4901-822b-0e34d3c9fa14',
};
const BG_AGENT = {
  dir: path.join(FIXTURES, 'cc-2.1.312-bg-agent'),
  id: '8c4861e7-317a-454e-890d-dc06d3b1c856',
};

function event(e: string, t: number, extra: Partial<RecorderEvent> = {}): RecorderEvent {
  return { v: 1, e, t, sid: 's', ...extra };
}

describe('eventsBeforeRecorder', () => {
  const old = [
    event('UserPromptSubmit', 100),
    event('PreToolUse', 110, { tuid: 'a' }),
    event('PostToolUse', 120, { tuid: 'a' }),
    event('Stop', 130),
  ];
  const later = [event('UserPromptSubmit', 500), event('Stop', 590)];

  it('keeps everything when the recorder only saw a process start and end', () => {
    const transcript = [...old, ...later];
    expect(eventsBeforeRecorder(transcript, [event('SessionStart', 400)])).toEqual(transcript);
    expect(
      eventsBeforeRecorder(transcript, [event('SessionStart', 400), event('SessionEnd', 450)]),
    ).toEqual(transcript);
  });

  it('stops at the prompt of the turn the recorder first saw', () => {
    // Hooks start just after the transcript's entry: 13 to 20 ms later in the fixtures.
    const recorded = [event('SessionStart', 400), event('UserPromptSubmit', 513)];
    expect(eventsBeforeRecorder([...old, ...later], recorded)).toEqual(old);
  });

  it('keeps the last old turn when a hook fires ahead of its transcript entry', () => {
    expect(eventsBeforeRecorder([...old, ...later], [event('UserPromptSubmit', 495)])).toEqual(old);
  });

  it('keeps the last old turn when the recorder first sees a compaction', () => {
    expect(eventsBeforeRecorder([...old, ...later], [event('PreCompact', 400)])).toEqual(old);
  });

  it('keeps a subagent that outlived its turn', () => {
    const agent = [
      event('SubagentStart', 125, { aid: 'x' }),
      event('SubagentStop', 300, { aid: 'x' }),
    ];
    expect(
      eventsBeforeRecorder([...old, ...later, ...agent], [event('UserPromptSubmit', 513)]),
    ).toEqual([...old, ...agent]);
  });

  it('adds nothing to a session recorded from its first turn', () => {
    const recorded = [event('SessionStart', 90), event('UserPromptSubmit', 113)];
    expect(eventsBeforeRecorder(old, recorded)).toEqual([]);
  });

  it('adds nothing while the first turn has only its prompt in the transcript', () => {
    // A transcript that ends there reads as a turn that ended at once: still the recorder's.
    const transcript = [event('UserPromptSubmit', 100), event('Stop', 100)];
    expect(eventsBeforeRecorder(transcript, [event('UserPromptSubmit', 113)])).toEqual([]);
  });

  it('leaves turns after the recorder stopped out, such as /exit', () => {
    const recorded = [event('UserPromptSubmit', 113), event('Stop', 135)];
    expect(eventsBeforeRecorder([...old, ...later], recorded)).toEqual([]);
  });

  it.each([
    ['a test run that failed', TEST_FIX],
    ['two prompts and a background subagent', BG_AGENT],
  ])('adds nothing to a fixture recorded whole: %s', (_name, { dir, id }) => {
    const { events } = readClaudeCodeTranscript(path.join(dir, `${id}.jsonl`));
    const recorded = readEvents(path.join(dir, 'events', `${id}.jsonl`));
    expect(eventsBeforeRecorder(events, recorded)).toEqual([]);
  });
});

describe('loadSession with a session older than the plugin', () => {
  const transcript = path.join(TEST_FIX.dir, `${TEST_FIX.id}.jsonl`);
  const old = readClaudeCodeTranscript(transcript).session;
  const end = old.endMs;
  const resumed = [
    event('SessionStart', end + 60_000, { src: 'resume' }),
    event('UserPromptSubmit', end + 65_000),
    event('PreToolUse', end + 70_000, { tool: 'Bash', tuid: 'new-call', cmd: 'ls' }),
    event('PostToolUse', end + 71_000, { tool: 'Bash', tuid: 'new-call', ok: true }),
    event('Stop', end + 75_000),
  ];

  function load(events: RecorderEvent[]) {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'awf-merge-'));
    const file = path.join(dir, 'events.jsonl');
    writeFileSync(file, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
    return loadSession(
      {
        id: TEST_FIX.id,
        transcript: {
          id: TEST_FIX.id,
          path: transcript,
          mtimeMs: 0,
          size: 0,
          project: '-tmp-demo',
        },
        events: { id: TEST_FIX.id, path: file, mtimeMs: 0, size: 0 },
      },
      { env: {} },
    );
  }

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
    const turns = session.steps.filter((s) => s.kind === 'turn');
    const idle = session.steps.filter((s) => s.kind === 'idle').at(-1);
    expect(turns).toHaveLength(old.steps.filter((s) => s.kind === 'turn').length + 1);
    expect(idle).toMatchObject({ startMs: turns.at(-2)?.endMs, endMs: end + 65_000 });
  });
});
