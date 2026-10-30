import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import type { Session } from '../model/types';
import { importedDir, safeId } from './paths';

type Env = Record<string, string | undefined>;

export const IMPORT_VERSION = 3;

/**
 * What `awf import` keeps of a transcript, so the history survives Claude Code deleting it after 30 days.
 * Same content as the recorder's files: timings, tool names, commands, file paths and browser action
 * names. No prompts or output.
 */
export interface ImportedSession {
  /**
   * 2 adds browser and computer-use actions; 3 starts model time at the send of a resent request
   * and ends background tasks stopped with TaskStop. Older entries still load; `awf import` redoes them.
   */
  version: 1 | 2 | typeof IMPORT_VERSION;
  source: { path: string; mtimeMs: number; size: number };
  session: Session;
}

export function cacheFile(id: string, env: Env = process.env): string {
  return path.join(importedDir(env), `${safeId(id)}.json`);
}

export function readImported(id: string, env: Env = process.env): ImportedSession | undefined {
  const file = cacheFile(id, env);
  if (!existsSync(file)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as ImportedSession;
    return [1, 2, IMPORT_VERSION].includes(parsed.version) && parsed.session ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function writeImported(entry: ImportedSession, env: Env = process.env): void {
  const dir = importedDir(env);
  mkdirSync(dir, { recursive: true });
  const file = cacheFile(entry.session.id, env);
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(entry));
  renameSync(tmp, file);
}

export function listImportedIds(env: Env = process.env): string[] {
  const dir = importedDir(env);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.slice(0, -'.json'.length));
}

/** Drops transcript-only detail before a session is written to disk. */
export function stripDetail(session: Session): Session {
  const { title: _title, ...rest } = session;
  return {
    ...rest,
    steps: session.steps.map((step) => {
      const { detail: _detail, ...kept } = step;
      return kept;
    }),
  };
}
