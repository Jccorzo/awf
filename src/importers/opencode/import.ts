// OpenCode sessions: ~/.local/share/opencode/storage/, read-only. A session is session/<project>/<id>.json,
// its messages message/<session>/<id>.json, and their parts part/<message>/<id>.json. Tool parts
// carry their own start and end times. See docs/other-agents.md.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Session, TokenUsage } from '../../model/types';
import { type Call, type ImportOptions, type Json, num, obj, SessionLog, str } from '../common';

function readJson(file: string): Json {
  try {
    return obj(JSON.parse(readFileSync(file, 'utf8'))) ?? {};
  } catch {
    return {};
  }
}

function readDir(dir: string): Json[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(dir, name)));
}

/** The storage folder a session file lives in: .../storage/session/<project>/<id>.json. */
export function storageRoot(sessionFile: string): string {
  return path.resolve(path.dirname(sessionFile), '..', '..');
}

const time = (value: unknown, key: string) => num(obj(value)?.[key]);

/** The call in Claude Code's terms. */
function toCall(id: string, tool: string, input: Json, agentId?: string): Call {
  const file = str(input.filePath) ?? str(input.file_path) ?? str(input.path);
  const base = { id, ...(agentId ? { agentId } : {}) };
  const description = str(input.description);
  switch (tool) {
    case 'bash': {
      const command = str(input.command);
      return {
        ...base,
        tool: 'Bash',
        ...(command ? { command } : {}),
        ...(description ? { description } : {}),
      };
    }
    case 'read':
      return { ...base, tool: 'Read', ...(file ? { files: [file] } : {}) };
    case 'write':
      return { ...base, tool: 'Write', ...(file ? { files: [file] } : {}) };
    case 'edit':
    case 'multiedit':
    case 'patch':
      return { ...base, tool: 'Edit', ...(file ? { files: [file] } : {}) };
    case 'grep':
      return { ...base, tool: 'Grep' };
    case 'glob':
    case 'list':
      return { ...base, tool: 'Glob' };
    case 'webfetch':
      return { ...base, tool: 'WebFetch' };
    case 'todowrite':
    case 'todoread':
      return { ...base, tool: 'TodoWrite' };
    case 'task': {
      const sub = str(input.subagent_type);
      return {
        ...base,
        tool: 'Agent',
        ...(sub ? { sub } : {}),
        ...(description ? { description } : {}),
      };
    }
    default:
      return {
        ...base,
        tool:
          tool.includes('_') && !tool.startsWith('mcp__')
            ? `mcp__${tool.replace('_', '__')}`
            : tool,
      };
  }
}

function tokens(usage: Json): TokenUsage {
  const cache = obj(usage.cache) ?? {};
  return {
    input: num(usage.input) ?? 0,
    output: (num(usage.output) ?? 0) + (num(usage.reasoning) ?? 0),
    cacheRead: num(cache.read) ?? 0,
    cacheWrite: num(cache.write) ?? 0,
  };
}

/** Reads one session's messages and parts into the log; subagent sessions nest under their task call. */
function readSession(
  log: SessionLog,
  root: string,
  sessionId: string,
  agentId: string | undefined,
  seen: Set<string>,
): void {
  if (seen.has(sessionId)) return;
  seen.add(sessionId);
  const messages = readDir(path.join(root, 'message', sessionId)).sort(
    (a, b) => (time(a.time, 'created') ?? 0) - (time(b.time, 'created') ?? 0),
  );
  for (const message of messages) {
    const messageId = str(message.id);
    const created = time(message.time, 'created');
    if (!messageId || created === undefined) continue;
    const parts = readDir(path.join(root, 'part', messageId));
    if (str(message.role) === 'user') {
      if (agentId) continue; // The task's prompt, not yours.
      const text = parts
        .map((p) => (str(p.type) === 'text' && !p.synthetic ? (str(p.text) ?? '') : ''))
        .join('\n');
      log.prompt(created, text);
      continue;
    }
    const usage = obj(message.tokens);
    const completed = time(message.time, 'completed');
    if (usage) log.usage(completed ?? created, tokens(usage), str(message.modelID), agentId);
    for (const part of parts) {
      if (str(part.type) !== 'tool') continue;
      const state = obj(part.state) ?? {};
      const callId = str(part.callID) ?? str(part.id);
      const start = time(state.time, 'start');
      if (!callId || start === undefined) continue;
      const end = time(state.time, 'end') ?? completed ?? start;
      const tool = str(part.tool) ?? 'tool';
      const input = obj(state.input) ?? {};
      log.start(start, toCall(callId, tool, input, agentId));
      const metadata = obj(state.metadata) ?? {};
      if (tool === 'task') {
        const child = str(metadata.sessionId);
        if (child) {
          const type = str(input.subagent_type);
          log.subagentStart(start, child, type);
          readSession(log, root, child, child, seen);
          log.subagentStop(end, child, type);
        }
      }
      const status = str(state.status) ?? '';
      const exit = num(metadata.exit);
      const output = str(state.output) ?? str(state.error) ?? '';
      log.end(end, callId, {
        ok: status === 'completed' && (exit === undefined || exit === 0),
        ...(exit !== undefined ? { code: exit } : {}),
        ...(status === 'error' && /abort|interrupt/i.test(str(state.error) ?? '')
          ? { interrupted: true }
          : {}),
        ...(agentId ? { agentId } : {}),
        output,
      });
    }
    if (
      !agentId &&
      completed !== undefined &&
      str(message.finish) &&
      str(message.finish) !== 'tool-calls'
    ) {
      log.stop(completed);
    }
  }
}

export function importOpenCodeSession(file: string, options: ImportOptions = {}): Session {
  const info = readJson(file);
  const id = str(info.id) ?? path.basename(file, '.json');
  const log = new SessionLog(id, 'opencode', options);
  log.cwd = str(info.directory);
  log.version = str(info.version);
  if (options.detail && str(info.title)) log.title = str(info.title);
  readSession(log, storageRoot(file), id, undefined, new Set());
  return log.build(file);
}
