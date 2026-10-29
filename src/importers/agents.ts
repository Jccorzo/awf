// Sessions of agents other than Claude Code, found in their own folders and read, never changed.
// Codex CLI: $CODEX_HOME/sessions. Gemini CLI: ~/.gemini/tmp. OpenCode: ~/.local/share/opencode/storage.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AgentName, Session } from '../model/types';
import { codexSessionId, importCodexRollout } from './codex/import';
import type { ImportOptions } from './common';
import { geminiSessionId, importGeminiChat } from './gemini/import';
import { importOpenCodeSession } from './opencode/import';

type Env = Record<string, string | undefined>;
export type OtherAgent = Exclude<AgentName, 'claude-code'>;

export interface AgentFile {
  agent: OtherAgent;
  id: string;
  path: string;
  mtimeMs: number;
  size: number;
}

export const AGENT_NAMES: Record<AgentName, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex CLI',
  gemini: 'Gemini CLI',
  opencode: 'OpenCode',
};

export function agentDirs(env: Env = process.env): Record<OtherAgent, string> {
  const home = env.HOME || os.homedir();
  return {
    codex: path.join(env.CODEX_HOME || path.join(home, '.codex'), 'sessions'),
    gemini: path.join(env.AWF_GEMINI_DIR || path.join(home, '.gemini'), 'tmp'),
    opencode:
      env.AWF_OPENCODE_STORAGE ||
      path.join(env.XDG_DATA_HOME || path.join(home, '.local', 'share'), 'opencode', 'storage'),
  };
}

function stat(file: string): { mtimeMs: number; size: number } | undefined {
  try {
    const s = statSync(file);
    return s.isFile() ? { mtimeMs: s.mtimeMs, size: s.size } : undefined;
  } catch {
    return undefined;
  }
}

function isDir(file: string): boolean {
  try {
    return statSync(file).isDirectory();
  } catch {
    return false;
  }
}

function list(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

/** Every session file of the other agents, changed since `sinceMs`. */
export function listAgentSessions(env: Env = process.env, sinceMs = -Infinity): AgentFile[] {
  const dirs = agentDirs(env);
  const out: AgentFile[] = [];
  const add = (agent: OtherAgent, file: string, id: string) => {
    const s = stat(file);
    if (s && s.mtimeMs >= sinceMs) out.push({ agent, id, path: file, ...s });
  };
  // Codex: sessions/YYYY/MM/DD/rollout-*.jsonl
  const walk = (dir: string, depth: number) => {
    for (const name of list(dir)) {
      const full = path.join(dir, name);
      if (/^rollout-.*\.jsonl$/.test(name)) add('codex', full, codexSessionId(full));
      else if (depth < 4 && isDir(full)) walk(full, depth + 1);
    }
  };
  if (existsSync(dirs.codex)) walk(dirs.codex, 0);
  // Gemini: tmp/<project hash>/chats/session-*.json
  for (const project of list(dirs.gemini)) {
    const chats = path.join(dirs.gemini, project, 'chats');
    for (const name of list(chats)) {
      if (!/^session-.*\.json$/.test(name)) continue;
      const full = path.join(chats, name);
      add('gemini', full, geminiSessionId(full));
    }
  }
  // OpenCode: storage/session/<project>/<id>.json; subagent sessions are read with their parent.
  const sessions = path.join(dirs.opencode, 'session');
  for (const project of list(sessions)) {
    for (const name of list(path.join(sessions, project))) {
      if (!name.endsWith('.json')) continue;
      const full = path.join(sessions, project, name);
      if (isChildSession(full)) continue;
      add('opencode', full, name.slice(0, -'.json'.length));
    }
  }
  return out;
}

function isChildSession(file: string): boolean {
  try {
    return /"parentID"\s*:\s*"/.test(readFileSync(file, 'utf8').slice(0, 2000));
  } catch {
    return false;
  }
}

/** Which agent wrote a file the user named, if it's one of theirs. */
export function detectAgentFile(file: string): AgentFile | undefined {
  const s = stat(file);
  if (!s) return undefined;
  const full = path.resolve(file);
  let head: string;
  try {
    head = readFileSync(full, 'utf8').slice(0, 4000);
  } catch {
    return undefined;
  }
  if (full.endsWith('.jsonl') && /"type"\s*:\s*"session_meta"/.test(head.split('\n')[0] ?? ''))
    return { agent: 'codex', id: codexSessionId(full), path: full, ...s };
  if (full.endsWith('.json') && /"sessionId"/.test(head) && /"messages"/.test(head))
    return { agent: 'gemini', id: geminiSessionId(full), path: full, ...s };
  if (full.endsWith('.json') && /[/\\]storage[/\\]session[/\\]/.test(full))
    return { agent: 'opencode', id: path.basename(full, '.json'), path: full, ...s };
  return undefined;
}

export function importAgentFile(file: AgentFile, options: ImportOptions = {}): Session {
  switch (file.agent) {
    case 'codex':
      return importCodexRollout(file.path, options);
    case 'gemini':
      return importGeminiChat(file.path, options);
    case 'opencode':
      return importOpenCodeSession(file.path, options);
  }
}
