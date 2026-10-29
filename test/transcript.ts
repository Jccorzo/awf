// Builds synthetic Claude Code transcripts for edge-case tests.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type Entry = Record<string, unknown>;

const base = Date.parse('2026-10-28T10:00:00.000Z');
export const at = (seconds: number) => new Date(base + seconds * 1000).toISOString();
export const ms = (seconds: number) => base + seconds * 1000;

export function prompt(t: number, text: string, kind = 'human'): Entry {
  return {
    type: 'user',
    timestamp: at(t),
    origin: { kind },
    message: { role: 'user', content: text },
    version: '2.1.312',
    cwd: '/repo',
  };
}

export function toolUse(
  t: number,
  message: string,
  id: string,
  name: string,
  input: Entry = {},
): Entry {
  return {
    type: 'assistant',
    timestamp: at(t),
    message: {
      id: message,
      role: 'assistant',
      model: 'claude-opus-5-5',
      content: [{ type: 'tool_use', id, name, input }],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        cache_read_input_tokens: 300,
        cache_creation_input_tokens: 40,
      },
    },
  };
}

export function text(t: number, message: string, words = 'done'): Entry {
  return {
    type: 'assistant',
    timestamp: at(t),
    message: {
      id: message,
      role: 'assistant',
      model: 'claude-opus-5-5',
      content: [{ type: 'text', text: words }],
    },
  };
}

export function result(
  t: number,
  id: string,
  options: { error?: boolean; content?: string; toolUseResult?: unknown; permission?: Entry } = {},
): Entry {
  const entry: Entry = {
    type: 'user',
    timestamp: at(t),
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: id,
          content: options.content ?? 'ok',
          is_error: options.error ?? false,
        },
      ],
    },
  };
  if (options.toolUseResult !== undefined) entry.toolUseResult = options.toolUseResult;
  if (options.permission) entry.permissionDecision = options.permission;
  return entry;
}

export function system(t: number, subtype: string, extra: Entry = {}): Entry {
  return { type: 'system', subtype, timestamp: at(t), ...extra };
}

export function notification(t: number, taskId: string, status: string): Entry {
  return {
    type: 'queue-operation',
    operation: 'enqueue',
    timestamp: at(t),
    content: `<task-notification><task-id>${taskId}</task-id><status>${status}</status><summary>Background command finished</summary></task-notification>`,
  };
}

/** Writes a transcript (and optional subagent transcripts) in Claude Code's layout; returns its path. */
export function writeTranscript(
  id: string,
  entries: Array<Entry | string>,
  subagents: Record<string, Entry[]> = {},
): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'awf-transcript-'));
  const file = path.join(dir, `${id}.jsonl`);
  writeFileSync(
    file,
    entries.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n') + '\n',
  );
  for (const [agentId, lines] of Object.entries(subagents)) {
    const subDir = path.join(dir, id, 'subagents');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(
      path.join(subDir, `agent-${agentId}.jsonl`),
      lines.map((e) => JSON.stringify({ ...e, isSidechain: true, agentId })).join('\n'),
    );
  }
  return file;
}
