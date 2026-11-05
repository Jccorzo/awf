// The data a dashboard embeds: one row per session, with its time by phase and the project it
// belongs to. No commands, files, prompts or output.
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Summary } from '../analyze/summary';
import { PHASES, type PhaseId } from '../classify/phases';
import type { Session } from '../model/types';

export interface DashProject {
  /** What the page calls it: the folder's name, with its parent's when two share a name. */
  name: string;
  /** The repository's folder (or the session's, outside one), relative to your home. */
  path: string;
}

export interface DashSession {
  id: string;
  startMs: number;
  endMs: number;
  /** Index into `projects`. */
  project: number;
  /** Where the session started, relative to your home. */
  folder: string;
  agent: string;
  agentVersion?: string;
  /** Milliseconds in each phase, in the order of `phases`. */
  ms: number[];
  turnsMs: number;
  modelCalls: number;
  toolCalls: number;
  subagents: number;
  failures: number;
  reworkLoops: number;
}

export interface DashData {
  v: 1;
  version: string;
  generatedAt: number;
  phases: Array<{ id: PhaseId; label: string }>;
  projects: DashProject[];
  sessions: DashSession[];
}

export interface DashOptions {
  home: string;
  now: number;
  version: string;
  /** Whether a folder is a repository's root; by default, whether it holds `.git`. */
  isRepo?: (dir: string) => boolean;
}

const TEMP = /^\/(private\/)?(tmp|var\/folders)(\/|$)/;
const TEMP_PATH = '/tmp';

function homeRelative(file: string, home: string): string {
  return home && (file === home || file.startsWith(home + '/'))
    ? '~' + file.slice(home.length)
    : file;
}

/**
 * The project a session belongs to: the repository its folder is in, found by walking up to your
 * home. Outside a repository it's the folder itself, and every temporary folder is one project.
 */
export function projectRoot(
  cwd: string | undefined,
  home: string,
  isRepo: (dir: string) => boolean,
): string {
  if (!cwd) return '';
  for (let dir = cwd; ;) {
    if (isRepo(dir)) return dir;
    const parent = path.dirname(dir);
    if (dir === home || parent === dir) break;
    dir = parent;
  }
  return TEMP.test(cwd) ? TEMP_PATH : cwd;
}

function projectNames(paths: string[]): string[] {
  const base = (p: string) =>
    p === '~' ? '~' : p === TEMP_PATH ? 'temporary folders' : path.basename(p);
  const count = new Map<string, number>();
  for (const p of paths) count.set(base(p), (count.get(base(p)) ?? 0) + 1);
  return paths.map((p) => {
    if (!p) return 'unknown folder';
    const name = base(p);
    if ((count.get(name) ?? 0) < 2) return name;
    return `${path.basename(path.dirname(p))}/${name}`;
  });
}

export function buildDashData(
  analyzed: Array<{ session: Session; summary: Summary }>,
  options: DashOptions,
): DashData {
  const isRepo = options.isRepo ?? ((dir: string) => existsSync(path.join(dir, '.git')));
  const roots = new Map<string, string>();
  const rootOf = (cwd: string | undefined) => {
    const key = cwd ?? '';
    let root = roots.get(key);
    if (root === undefined) roots.set(key, (root = projectRoot(cwd, options.home, isRepo)));
    return root;
  };
  const projectPaths: string[] = [];
  const projectIndex = new Map<string, number>();
  const sessions: DashSession[] = [];
  for (const { session, summary } of [...analyzed].sort(
    (a, b) => a.summary.startMs - b.summary.startMs,
  )) {
    const cwd = summary.cwd ?? session.cwd;
    const root = rootOf(cwd);
    const shown = root === TEMP_PATH ? TEMP_PATH : root ? homeRelative(root, options.home) : '';
    let index = projectIndex.get(shown);
    if (index === undefined) {
      index = projectPaths.push(shown) - 1;
      projectIndex.set(shown, index);
    }
    const byPhase = new Map(summary.phases.map((p) => [p.phase, p.ms]));
    const row: DashSession = {
      id: summary.id,
      startMs: summary.startMs,
      endMs: summary.endMs,
      project: index,
      folder: cwd ? homeRelative(cwd, options.home) : '',
      agent: session.agent,
      ms: PHASES.map((p) => Math.round(byPhase.get(p.id) ?? 0)),
      turnsMs: summary.turnsMs,
      modelCalls: summary.modelCalls,
      toolCalls: summary.toolCalls,
      subagents: summary.subagents,
      failures: summary.failures,
      reworkLoops: summary.rework.filter((w) => w.edits > 0).length,
    };
    if (summary.agentVersion) row.agentVersion = summary.agentVersion;
    sessions.push(row);
  }
  const names = projectNames(projectPaths);
  return {
    v: 1,
    version: options.version,
    generatedAt: options.now,
    phases: PHASES.map((p) => ({ id: p.id, label: p.label })),
    projects: projectPaths.map((p, i) => ({ name: names[i] ?? p, path: p })),
    sessions,
  };
}
