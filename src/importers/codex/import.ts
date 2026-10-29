// Codex CLI sessions: ~/.codex/sessions/YYYY/MM/DD/rollout-<time>-<id>.jsonl, read-only. Every line
// is {timestamp, type, payload}; the timestamps give the timings. See docs/other-agents.md.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Session, TokenUsage } from '../../model/types';
import {
  type Call,
  commandFromArgv,
  type ImportOptions,
  type Json,
  num,
  obj,
  SessionLog,
  str,
} from '../common';

const UUID = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

/** User messages Codex adds itself: instructions and environment context, not prompts. */
const INJECTED = /^\s*<(user_instructions|environment_context|user_shell_command|turn_aborted)>/;

export function codexSessionId(file: string): string {
  return UUID.exec(path.basename(file))?.[1] ?? path.basename(file, '.jsonl');
}

function parseArgs(text: unknown): Json {
  if (typeof text !== 'string') return obj(text) ?? {};
  try {
    return obj(JSON.parse(text)) ?? {};
  } catch {
    return {};
  }
}

/** Files an apply_patch touches: `*** Update File: src/a.ts`, Add, Delete. */
function patchFiles(patch: string): { files: string[]; adds: boolean } {
  const files: string[] = [];
  let adds = false;
  for (const match of patch.matchAll(/^\*\*\* (Update|Add|Delete) File: (.+)$/gm)) {
    if (match[1] === 'Add') adds = true;
    if (match[2]) files.push(match[2].trim());
  }
  return { files, adds };
}

/** The call in Claude Code's terms. */
function toCall(
  id: string,
  name: string,
  args: Json,
  cwd: string | undefined,
  input?: string,
): Call {
  const inDir = (command: string, workdir: string | undefined) =>
    workdir && cwd && path.resolve(cwd, workdir) !== path.resolve(cwd)
      ? `cd ${workdir} && ${command}`
      : command;
  switch (name) {
    case 'shell':
    case 'container.exec':
    case 'local_shell': {
      const command = commandFromArgv(args.command);
      return {
        id,
        tool: 'Bash',
        ...(command ? { command: inDir(command, str(args.workdir)) } : {}),
      };
    }
    case 'exec_command': {
      const command = str(args.cmd) ?? commandFromArgv(args.command);
      return {
        id,
        tool: 'Bash',
        ...(command ? { command: inDir(command, str(args.workdir)) } : {}),
      };
    }
    case 'apply_patch': {
      const patch = input ?? str(args.input) ?? str(args.patch) ?? '';
      const { files, adds } = patchFiles(patch);
      return {
        id,
        tool: adds && files.length === 1 ? 'Write' : 'Edit',
        ...(files.length ? { files } : {}),
      };
    }
    case 'update_plan':
      return { id, tool: 'TodoWrite' };
    case 'view_image': {
      const file = str(args.path);
      return { id, tool: 'Read', ...(file ? { files: [file] } : {}) };
    }
    default:
      // MCP tools are named server__tool.
      return { id, tool: name.includes('__') ? `mcp__${name}` : name };
  }
}

/** Shell output is JSON with metadata, or text with "Exit code:" and "Wall time:" lines. */
function result(output: unknown): { ok: boolean; code?: number; durMs?: number; text: string } {
  let text = typeof output === 'string' ? output : JSON.stringify(output ?? '');
  let code: number | undefined;
  let seconds: number | undefined;
  const parsed =
    typeof output === 'string' && output.startsWith('{') ? parseArgs(output) : obj(output);
  if (parsed && ('output' in parsed || 'metadata' in parsed)) {
    const meta = obj(parsed.metadata) ?? {};
    code = num(meta.exit_code);
    seconds = num(meta.duration_seconds);
    text = str(parsed.output) ?? '';
  } else {
    const exit = /^Exit code: (-?\d+)/m.exec(text);
    if (exit?.[1]) code = Number(exit[1]);
    const wall = /^Wall time: ([\d.]+) seconds/m.exec(text);
    if (wall?.[1]) seconds = Number(wall[1]);
  }
  const failedPatch = /^(apply_patch verification failed|Failed to apply patch|error:)/im.test(
    text,
  );
  return {
    ok: code !== undefined ? code === 0 : !failedPatch,
    ...(code !== undefined ? { code } : {}),
    ...(seconds !== undefined ? { durMs: seconds * 1000 } : {}),
    text,
  };
}

function tokens(usage: Json): TokenUsage {
  const input = num(usage.input_tokens) ?? 0;
  const cached = num(usage.cached_input_tokens) ?? 0;
  return {
    input: Math.max(0, input - cached),
    output: num(usage.output_tokens) ?? 0,
    cacheRead: cached,
    cacheWrite: 0,
  };
}

export function importCodexRollout(file: string, options: ImportOptions = {}): Session {
  const lines = readFileSync(file, 'utf8').split('\n');
  let id = codexSessionId(file);
  let log: SessionLog | undefined;
  const promptsFromEvents = lines.some((l) => l.includes('"type":"user_message"'));
  let model: string | undefined;
  let badLines = 0;
  const open = new Set<string>();

  for (const line of lines) {
    if (!line.trim()) continue;
    let entry: Json | undefined;
    try {
      entry = obj(JSON.parse(line));
    } catch {
      badLines++;
      continue;
    }
    if (!entry) continue;
    const type = str(entry.type) ?? '';
    const payload = obj(entry.payload) ?? {};
    const ms = Date.parse(str(entry.timestamp) ?? '');
    if (type === 'session_meta') {
      id = str(payload.id) ?? id;
      log ??= new SessionLog(id, 'codex', options);
      log.cwd = str(payload.cwd) ?? log.cwd;
      log.version = str(payload.cli_version) ?? log.version;
      continue;
    }
    log ??= new SessionLog(id, 'codex', options);
    if (!Number.isFinite(ms)) {
      // Rollouts from before Codex wrapped lines with timestamps carry no timings.
      log.unknown(`untimed:${str(entry.type) ?? 'line'}`);
      continue;
    }
    if (type === 'turn_context') {
      log.cwd ??= str(payload.cwd);
      model = str(payload.model) ?? model;
      continue;
    }
    if (type === 'event_msg') {
      const kind = str(payload.type) ?? '';
      if (kind === 'user_message') {
        const text = str(payload.message) ?? '';
        if (!INJECTED.test(text)) log.prompt(ms, text);
      } else if (kind === 'token_count') {
        const usage = obj(obj(payload.info)?.last_token_usage);
        if (usage) log.usage(ms, tokens(usage), model);
      } else if (kind === 'task_complete' || kind === 'turn_complete') {
        log.stop(ms);
      } else if (kind === 'turn_aborted') {
        for (const callId of open) log.end(ms, callId, { ok: false, interrupted: true });
        open.clear();
        log.stop(ms);
      } else if (
        ![
          'agent_message',
          'agent_reasoning',
          'agent_reasoning_raw_content',
          'entered_review_mode',
          'exited_review_mode',
        ].includes(kind)
      ) {
        log.unknown(`event_msg:${kind}`);
      }
      continue;
    }
    if (type !== 'response_item') {
      if (type !== 'compacted') log.unknown(type);
      continue;
    }
    const item = str(payload.type) ?? '';
    switch (item) {
      case 'message': {
        if (str(payload.role) !== 'user' || promptsFromEvents) break;
        const content = Array.isArray(payload.content) ? payload.content : [];
        const text = content.map((c) => str(obj(c)?.text) ?? '').join('\n');
        if (text && !INJECTED.test(text)) log.prompt(ms, text);
        break;
      }
      case 'function_call':
      case 'custom_tool_call': {
        const callId = str(payload.call_id) ?? str(payload.id);
        const name = str(payload.name) ?? 'tool';
        if (!callId) break;
        const args = item === 'function_call' ? parseArgs(payload.arguments) : {};
        log.start(ms, toCall(callId, name, args, log.cwd, str(payload.input)));
        open.add(callId);
        break;
      }
      case 'local_shell_call': {
        const callId = str(payload.call_id) ?? str(payload.id);
        if (!callId) break;
        const action = obj(payload.action) ?? {};
        log.start(
          ms,
          toCall(
            callId,
            'local_shell',
            { command: action.command, workdir: action.working_directory },
            log.cwd,
          ),
        );
        open.add(callId);
        break;
      }
      case 'function_call_output':
      case 'custom_tool_call_output':
      case 'local_shell_call_output': {
        const callId = str(payload.call_id);
        if (!callId || !open.has(callId)) break;
        open.delete(callId);
        const r = result(payload.output);
        log.end(ms, callId, {
          ok: r.ok,
          ...(r.code !== undefined ? { code: r.code } : {}),
          ...(r.durMs !== undefined ? { durMs: r.durMs } : {}),
          output: r.text,
        });
        break;
      }
      case 'web_search_call': {
        const callId = str(payload.id) ?? `search:${ms}`;
        log.start(ms, { id: callId, tool: 'WebSearch' });
        log.end(ms, callId, { ok: str(payload.status) !== 'failed' });
        break;
      }
      case 'reasoning':
        break;
      default:
        log.unknown(`response_item:${item}`);
    }
  }
  log ??= new SessionLog(id, 'codex', options);
  // A call still open at the end never finished (the session was closed or crashed).
  for (const callId of open) log.end(log.latest, callId, { ok: false, interrupted: true });
  log.diagnostics.badLines = badLines;
  return log.build(file);
}
