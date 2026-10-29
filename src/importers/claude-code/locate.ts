import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { claudeProjectsDir } from '../../store/paths';

type Env = Record<string, string | undefined>;

export interface TranscriptFile {
  id: string;
  path: string;
  /** Claude Code's folder name for the project: its path with "/" replaced by "-". */
  project: string;
  mtimeMs: number;
  size: number;
}

/**
 * Main session transcripts: `<projects>/<project>/<session-id>.jsonl`. Subagent transcripts in
 * `<session-id>/subagents/` are read together with their session, and workflow journals are skipped.
 */
export function listTranscripts(env: Env = process.env, sinceMs = -Infinity): TranscriptFile[] {
  const root = claudeProjectsDir(env);
  if (!existsSync(root)) return [];
  const files: TranscriptFile[] = [];
  for (const project of readdirSync(root)) {
    const dir = path.join(root, project);
    let names: string[];
    try {
      if (!statSync(dir).isDirectory()) continue;
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith('.jsonl')) continue;
      const file = path.join(dir, name);
      try {
        const stat = statSync(file);
        if (!stat.isFile() || stat.mtimeMs < sinceMs) continue;
        files.push({
          id: name.slice(0, -'.jsonl'.length),
          path: file,
          project,
          mtimeMs: stat.mtimeMs,
          size: stat.size,
        });
      } catch {
        // vanished while listing
      }
    }
  }
  return files;
}
