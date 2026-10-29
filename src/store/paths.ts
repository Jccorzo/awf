import os from 'node:os';
import path from 'node:path';

type Env = Record<string, string | undefined>;

/** awf's own data: `$AWF_HOME`, or `~/.awf`. awf writes nowhere else. */
export function awfHome(env: Env = process.env): string {
  return env.AWF_HOME || path.join(os.homedir(), '.awf');
}

export function eventsDir(env: Env = process.env): string {
  return path.join(awfHome(env), 'events');
}

export function importedDir(env: Env = process.env): string {
  return path.join(awfHome(env), 'imported');
}

/** Claude Code's transcripts, read-only: `$CLAUDE_CONFIG_DIR/projects` or `~/.claude/projects`. */
export function claudeProjectsDir(env: Env = process.env): string {
  if (env.AWF_CLAUDE_PROJECTS) return env.AWF_CLAUDE_PROJECTS;
  return path.join(env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'projects');
}

/** A session ID made safe for a file name. */
export function safeId(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 128);
}
