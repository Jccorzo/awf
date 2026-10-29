// Gemini CLI sessions: ~/.gemini/tmp/<project hash>/chats/session-*.json, read-only. One JSON file
// per session with its messages; a model message lists the tool calls it made, each stamped when
// it finished. See docs/other-agents.md for how the timings are estimated.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Session, TokenUsage } from '../../model/types';
import { type Call, type ImportOptions, type Json, num, obj, SessionLog, str } from '../common';

const FILE_ARGS = ['absolute_path', 'file_path', 'path', 'dir_path', 'directory'];

function files(args: Json): string[] {
  const out = FILE_ARGS.map((key) => str(args[key])).filter((f): f is string => !!f);
  if (Array.isArray(args.paths)) for (const p of args.paths) if (typeof p === 'string') out.push(p);
  return out;
}

/** The call in Claude Code's terms. */
function toCall(id: string, name: string, args: Json): Call {
  const withFiles = (tool: string): Call => {
    const list = files(args);
    return { id, tool, ...(list.length ? { files: list } : {}) };
  };
  const description = str(args.description);
  switch (name) {
    case 'run_shell_command': {
      const command = str(args.command);
      const dir = str(args.directory) ?? str(args.dir_path);
      return {
        id,
        tool: 'Bash',
        ...(command ? { command: dir ? `cd ${dir} && ${command}` : command } : {}),
        ...(description ? { description } : {}),
      };
    }
    case 'read_file':
    case 'read_many_files':
      return withFiles('Read');
    case 'write_file':
      return withFiles('Write');
    case 'replace':
    case 'edit':
      return withFiles('Edit');
    case 'glob':
    case 'list_directory':
      return { id, tool: 'Glob' };
    case 'search_file_content':
    case 'grep':
      return { id, tool: 'Grep' };
    case 'web_fetch':
      return { id, tool: 'WebFetch' };
    case 'google_web_search':
      return { id, tool: 'WebSearch' };
    case 'write_todos':
      return { id, tool: 'TodoWrite' };
    default:
      return { id, tool: name.includes('__') ? `mcp__${name}` : name };
  }
}

/** The text a tool returned, and a shell command's exit code. */
function outcome(call: Json): { text: string; code?: number } {
  const parts = Array.isArray(call.result) ? call.result : [];
  let text = '';
  for (const part of parts) {
    const response = obj(obj(obj(part)?.functionResponse)?.response);
    const value = response?.output ?? response?.error ?? response?.content;
    if (typeof value === 'string') text += value;
  }
  if (!text && typeof call.resultDisplay === 'string') text = call.resultDisplay;
  const exit = /^Exit Code: (-?\d+)/m.exec(text);
  return { text, ...(exit?.[1] ? { code: Number(exit[1]) } : {}) };
}

function tokens(usage: Json): TokenUsage {
  const input = num(usage.input) ?? 0;
  const cached = num(usage.cached) ?? 0;
  return {
    input: Math.max(0, input - cached),
    output: (num(usage.output) ?? 0) + (num(usage.thoughts) ?? 0),
    cacheRead: cached,
    cacheWrite: 0,
  };
}

/**
 * Gemini names a project by the SHA-256 of its folder. The folders the session's tools touched,
 * and their parents, are the candidates; the one with the right hash is the session's folder.
 */
function projectFolder(hash: string | undefined, messages: Json[]): string | undefined {
  if (!hash) return undefined;
  const candidates = new Set<string>();
  for (const message of messages) {
    for (const call of Array.isArray(message.toolCalls) ? message.toolCalls : []) {
      for (const file of files(obj(obj(call)?.args) ?? {})) {
        if (!path.isAbsolute(file)) continue;
        for (let dir = file; dir !== path.dirname(dir); dir = path.dirname(dir))
          candidates.add(dir);
      }
    }
  }
  for (const dir of candidates) {
    if (createHash('sha256').update(dir).digest('hex') === hash) return dir;
  }
  return undefined;
}

export function geminiSessionId(file: string): string {
  try {
    const head = readFileSync(file, 'utf8').slice(0, 600);
    const match = /"sessionId"\s*:\s*"([^"]+)"/.exec(head);
    if (match?.[1]) return match[1];
  } catch {
    // Unreadable: fall back to the file name.
  }
  return path.basename(file, '.json');
}

export function importGeminiChat(file: string, options: ImportOptions = {}): Session {
  const chat = obj(JSON.parse(readFileSync(file, 'utf8'))) ?? {};
  const id = str(chat.sessionId) ?? path.basename(file, '.json');
  const log = new SessionLog(id, 'gemini', options);
  const messages = (Array.isArray(chat.messages) ? chat.messages : []).map((m) => obj(m) ?? {});
  const folder = projectFolder(str(chat.projectHash), messages);
  if (folder) log.cwd = folder;
  let counter = 0;
  for (const message of messages) {
    const ms = Date.parse(str(message.timestamp) ?? '');
    if (!Number.isFinite(ms)) {
      log.unknown('untimed message');
      continue;
    }
    const type = str(message.type) ?? '';
    if (type === 'user') {
      const content = message.content;
      const text = typeof content === 'string' ? content : JSON.stringify(content ?? '');
      log.prompt(ms, text);
      continue;
    }
    if (type !== 'gemini') {
      if (!['info', 'error', 'warning'].includes(type)) log.unknown(`message:${type}`);
      continue;
    }
    const usage = obj(message.tokens);
    if (usage) log.usage(ms, tokens(usage), str(message.model));
    log.active(ms);
    // The reply is logged when it's complete, and its calls start then and may run together;
    // each call is stamped when it ended.
    const calls = (Array.isArray(message.toolCalls) ? message.toolCalls : []).map(
      (c) => obj(c) ?? {},
    );
    for (const call of calls) {
      const callId = str(call.id) ?? `call:${++counter}`;
      const ended = Date.parse(str(call.timestamp) ?? '');
      const end = Number.isFinite(ended) ? Math.max(ms, ended) : ms;
      log.start(ms, toCall(callId, str(call.name) ?? 'tool', obj(call.args) ?? {}));
      const { text, code } = outcome(call);
      const status = str(call.status) ?? '';
      const ok = status === 'success' && (code === undefined || code === 0);
      log.end(end, callId, {
        ok,
        ...(code !== undefined ? { code } : {}),
        ...(status === 'cancelled' ? { interrupted: true } : {}),
        output: text,
      });
    }
  }
  return log.build(file);
}
