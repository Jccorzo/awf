import { describe, expect, it } from 'vitest';
import { toEvent } from '../../src/recorder/event';

const base = {
  session_id: 'sess-1',
  transcript_path: '/home/u/.claude/projects/p/sess-1.jsonl',
  cwd: '/home/u/repo',
  permission_mode: 'default',
};

describe('toEvent', () => {
  it('records a Bash call with the secret masked', () => {
    const event = toEvent(
      {
        ...base,
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_use_id: 'toolu_1',
        tool_input: { command: 'API_TOKEN=abc123 pnpm test', description: 'Run tests' },
      },
      1000,
    );
    expect(event).toMatchObject({
      e: 'PreToolUse',
      t: 1000,
      sid: 'sess-1',
      tool: 'Bash',
      tuid: 'toolu_1',
    });
    expect(event?.cmd).toBe('API_TOKEN=‹masked› pnpm test');
    expect(event?.ih).toMatch(/^[0-9a-f]{8}$/);
    expect(JSON.stringify(event)).not.toContain('Run tests');
  });

  it('never stores the prompt', () => {
    const event = toEvent(
      {
        ...base,
        hook_event_name: 'UserPromptSubmit',
        prompt: 'my secret plan for world domination',
      },
      5,
    );
    expect(event).toMatchObject({ e: 'UserPromptSubmit', cwd: '/home/u/repo', pm: 'default' });
    expect(JSON.stringify(event)).not.toContain('world domination');
  });

  it('never stores tool output, only the IDs it needs', () => {
    const event = toEvent(
      {
        ...base,
        hook_event_name: 'PostToolUse',
        tool_name: 'Agent',
        tool_use_id: 'toolu_2',
        tool_input: { prompt: 'look around', subagent_type: 'Explore' },
        tool_response: { agentId: 'a-77', content: 'FOUND THE PASSWORD FILE', totalTokens: 9 },
        duration_ms: 4321.6,
      },
      10,
    );
    expect(event).toMatchObject({ ok: true, dur: 4322, child: 'a-77' });
    expect(JSON.stringify(event)).not.toContain('PASSWORD');
    expect(JSON.stringify(event)).not.toContain('look around');
  });

  it('reads the exit code of a failed call and nothing else of the error', () => {
    const event = toEvent(
      {
        ...base,
        hook_event_name: 'PostToolUseFailure',
        tool_name: 'Bash',
        tool_use_id: 'toolu_3',
        tool_input: { command: 'pnpm test' },
        error: 'Exit code 1\nFAIL src/a.test.ts > secret detail',
        duration_ms: 900,
      },
      20,
    );
    expect(event).toMatchObject({ ok: false, code: 1, dur: 900 });
    expect(JSON.stringify(event)).not.toContain('secret detail');
  });

  it('pairs PermissionRequest by input hash', () => {
    const input = { command: 'rm -rf build', description: 'clean' };
    const pre = toEvent(
      {
        ...base,
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_use_id: 't',
        tool_input: input,
      },
      1,
    );
    const ask = toEvent(
      { ...base, hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: input },
      2,
    );
    expect(ask?.ih).toBe(pre?.ih);
    expect(ask?.cmd).toBeUndefined();
  });

  it('records batch IDs, subagent IDs and background shells', () => {
    expect(
      toEvent(
        {
          ...base,
          hook_event_name: 'PostToolBatch',
          tool_calls: [
            { tool_name: 'Read', tool_use_id: 'a', tool_response: 'file text' },
            { tool_name: 'Read', tool_use_id: 'b', tool_response: 'file text' },
          ],
        },
        1,
      ),
    ).toMatchObject({ ids: ['a', 'b'] });
    expect(
      toEvent(
        { ...base, hook_event_name: 'SubagentStart', agent_id: 'sub-1', agent_type: 'Explore' },
        1,
      ),
    ).toMatchObject({ aid: 'sub-1', at: 'Explore' });
    expect(
      toEvent(
        {
          ...base,
          hook_event_name: 'PreToolUse',
          tool_name: 'Bash',
          tool_use_id: 'bg',
          tool_input: { command: 'pnpm dev', run_in_background: true },
        },
        1,
      ),
    ).toMatchObject({ bg: true, cmd: 'pnpm dev' });
  });

  it('ignores input without an event name or session', () => {
    expect(toEvent({ hook_event_name: 'Stop' }, 1)).toBeNull();
    expect(toEvent({ session_id: 'x' }, 1)).toBeNull();
  });
});
