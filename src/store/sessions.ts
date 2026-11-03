import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  type AgentFile,
  detectAgentFile,
  importAgentFile,
  listAgentSessions,
} from '../importers/agents';
import { readClaudeCodeTranscript, type TranscriptRead } from '../importers/claude-code/import';
import { listTranscripts, type TranscriptFile } from '../importers/claude-code/locate';
import type { Session, Step } from '../model/types';
import type { RecorderEvent } from '../recorder/event';
import { eventsToSession } from '../recorder/steps';
import { type EventsFile, listEventFiles, readEvents } from './events';
import { listImportedIds, readImported } from './imported';

type Env = Record<string, string | undefined>;

/** Everything awf knows about one session ID. */
export interface SessionRef {
  id: string;
  events?: EventsFile;
  transcript?: TranscriptFile;
  /** A Codex, Gemini or OpenCode session file. */
  external?: AgentFile;
  imported?: boolean;
}

export function sessionIndex(env: Env = process.env): Map<string, SessionRef> {
  const index = new Map<string, SessionRef>();
  const entry = (id: string) => {
    let ref = index.get(id);
    if (!ref) index.set(id, (ref = { id }));
    return ref;
  };
  for (const file of listEventFiles(env)) entry(file.id).events = file;
  for (const id of listImportedIds(env)) entry(id).imported = true;
  for (const file of listTranscripts(env)) entry(file.id).transcript = file;
  for (const file of listAgentSessions(env)) entry(file.id).external = file;
  return index;
}

function latestMs(ref: SessionRef): number {
  return Math.max(
    ref.events?.mtimeMs ?? 0,
    ref.transcript?.mtimeMs ?? 0,
    ref.external?.mtimeMs ?? 0,
  );
}

/**
 * Finds a session from what the user typed: a full ID, a unique ID prefix, `last` (the most recently
 * active session, optionally only those in `project`), or the path of a transcript or events file.
 */
export function resolveSession(
  input: string,
  env: Env = process.env,
  project?: string,
): SessionRef {
  const external = existsSync(input) ? detectAgentFile(input) : undefined;
  if (external) return { id: external.id, external };
  if (input.endsWith('.jsonl') && existsSync(input)) {
    const stat = statSync(input);
    const id = path.basename(input, '.jsonl');
    const file = { id, path: path.resolve(input), mtimeMs: stat.mtimeMs, size: stat.size };
    if (path.basename(path.dirname(input)) === 'events') return { id, events: file };
    return { id, transcript: { ...file, project: path.basename(path.dirname(input)) } };
  }
  const index = sessionIndex(env);
  if (input === 'last' || input === 'latest' || input === 'current') {
    const candidates = [...index.values()].filter((ref) => !project || refProject(ref) === project);
    const last = candidates.sort((a, b) => latestMs(b) - latestMs(a))[0];
    if (!last) {
      throw new Error(
        'no sessions found. Run "awf import" to read past sessions, or install the plugin to record new ones.',
      );
    }
    return last;
  }
  const exact = index.get(input);
  if (exact) return exact;
  const matches = [...index.values()].filter((ref) => ref.id.startsWith(input));
  if (matches.length === 1 && matches[0]) return matches[0];
  if (matches.length > 1) {
    throw new Error(`"${input}" matches ${matches.length} sessions; type more of the ID`);
  }
  throw new Error(`no session "${input}". Run "awf sessions" to list them, or "awf import" first.`);
}

/**
 * The files in a session's `subagents/` folder, next to its transcript: how many, their total size
 * and their latest change. Undefined when there's no such folder.
 */
export function subagentFiles(
  transcript: string,
): { count: number; size: number; mtimeMs: number } | undefined {
  const dir = path.join(path.dirname(transcript), path.basename(transcript, '.jsonl'), 'subagents');
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return undefined;
  }
  let size = 0;
  let mtimeMs = 0;
  for (const name of names) {
    const stat = statSync(path.join(dir, name), { throwIfNoEntry: false });
    if (!stat) continue;
    size += stat.size;
    mtimeMs = Math.max(mtimeMs, stat.mtimeMs);
  }
  return { count: names.length, size, mtimeMs };
}

/** A Claude Code session with recent activity. */
export interface ActiveTranscript extends TranscriptFile {
  /** The latest change to the transcript or to one of its subagents' transcripts. */
  activityMs: number;
  /** The latest change to one of its subagents' transcripts. */
  subagentsMs?: number;
}

/**
 * Claude Code sessions whose transcript, or a subagent's transcript, changed at or after `sinceMs`,
 * most recent activity first. The other agents' sessions aren't included.
 */
export function activeTranscripts(env: Env, sinceMs: number): ActiveTranscript[] {
  const active: ActiveTranscript[] = [];
  for (const file of listTranscripts(env)) {
    const subagents = subagentFiles(file.path);
    const activityMs = Math.max(file.mtimeMs, subagents?.mtimeMs ?? 0);
    if (activityMs < sinceMs) continue;
    active.push(
      subagents ? { ...file, activityMs, subagentsMs: subagents.mtimeMs } : { ...file, activityMs },
    );
  }
  return active.sort((a, b) => b.activityMs - a.activityMs);
}

/** The project folder name Claude Code would use for a path. */
export function projectKey(dir: string): string {
  return path.resolve(dir).replace(/[^A-Za-z0-9]/g, '-');
}

function refProject(ref: SessionRef): string | undefined {
  return ref.transcript?.project;
}

export interface LoadOptions {
  /** Read the transcript's prompts, descriptions and output for the full report. */
  detail?: boolean;
  env?: Env;
}

/**
 * Loads a session, merging what each source knows. The recorder's timings win; the transcript adds
 * details the hooks don't store (output, tokens, background completions), and fills in what the
 * recorder never saw: whole sessions, and the turns it missed.
 */
export function loadSession(ref: SessionRef, options: LoadOptions = {}): Session {
  const env = options.env ?? process.env;
  const events = ref.events ? readEvents(ref.events.path) : undefined;
  const recorded = events ? eventsToSession(ref.id, events) : undefined;
  const transcriptPath = ref.transcript?.path ?? existing(recorded?.transcriptPath);
  let transcript: TranscriptRead | undefined;
  if (transcriptPath) {
    try {
      transcript = readClaudeCodeTranscript(transcriptPath, { detail: options.detail ?? false });
    } catch {
      transcript = undefined;
    }
  }
  if (events && recorded && transcript) {
    const missed = eventsRecorderMissed(transcript, events);
    const whole = missed.length > 0 ? eventsToSession(ref.id, [...missed, ...events]) : recorded;
    return mergeSessions(whole, transcript.session);
  }
  if (recorded) return fullerImport(recorded, env);
  if (transcript) return transcript.session;
  if (ref.external && existsSync(ref.external.path)) {
    try {
      return importAgentFile(ref.external, { detail: options.detail ?? false });
    } catch {
      // Unreadable now: the import cache may still have it.
    }
  }
  const imported = readImported(ref.id, env);
  if (imported) return { ...imported.session, sources: ['import-cache'] };
  throw new Error(`session ${ref.id} has no readable data`);
}

function existing(file: string | undefined): string | undefined {
  return file && existsSync(file) ? file : undefined;
}

/** With the transcript gone, `awf import`'s copy may hold turns the recorder missed. */
function fullerImport(recorded: Session, env: Env): Session {
  const imported = readImported(recorded.id, env);
  if (!imported || imported.session.steps.length <= recorded.steps.length) return recorded;
  return { ...imported.session, sources: ['import-cache'] };
}

/** They say a process started or ended, not that the recorder saw the session work. */
const PROCESS_EVENTS = new Set(['SessionStart', 'SessionEnd']);
/** How long after a turn's last transcript entry its hooks can still start. */
const HOOK_GRACE_MS = 5000;
/** How a session starts when nothing came before it. */
const FRESH_STARTS = new Set(['startup', 'clear']);

/**
 * The transcript's events for the turns the recorder missed: a session older than the plugin, or
 * one carried on with the plugin off. A turn is missed when the agent worked in it and the recorder
 * wrote nothing from its prompt until just after its end. Slash commands that never reach the model
 * don't count: `/exit` is a prompt in the transcript with no hook behind it, and reading it would
 * add waiting time.
 */
export function eventsRecorderMissed(
  { session, events }: TranscriptRead,
  recorded: RecorderEvent[],
): RecorderEvent[] {
  const work = recorded
    .filter((event) => !PROCESS_EVENTS.has(event.e))
    .map((event) => event.t)
    .sort((a, b) => a - b);
  const turns = session.steps.filter((step) => step.kind === 'turn');
  const worked = new Set(
    session.steps.filter((step) => step.kind === 'tool' || step.model).map((s) => s.parentId),
  );
  // What came before the first turn, then each missed turn, up to the next turn or recorder event.
  const first = Math.min(turns[0]?.startMs ?? Infinity, work[0] ?? Infinity);
  const spans: Array<[number, number]> = [[-Infinity, first]];
  let next = 0;
  turns.forEach((turn, i) => {
    while ((work[next] ?? Infinity) < turn.startMs) next++;
    const seen = work[next] ?? Infinity;
    if (!worked.has(turn.id) || seen <= turn.endMs + HOOK_GRACE_MS) return;
    const end = Math.min(seen, turns[i + 1]?.startMs ?? Infinity);
    const last = spans.at(-1) as [number, number];
    if (last[1] === turn.startMs) last[1] = end;
    else spans.push([turn.startMs, end]);
  });
  return events.filter((event) => spans.some(([from, to]) => event.t >= from && event.t < to));
}

/**
 * Whether the recorder may have missed turns, told without reading the transcript. A transcript can
 * change with no work in it (docs/transcript-format.md), which only costs a read.
 */
function mayHaveMissed(events: RecorderEvent[], transcript: TranscriptFile | undefined): boolean {
  const [first] = events;
  if (first?.e !== 'SessionStart' || !FRESH_STARTS.has(first.src ?? '')) return true;
  const last = events.at(-1) as RecorderEvent;
  return !!transcript && transcript.mtimeMs > last.t + HOOK_GRACE_MS;
}

/**
 * A session's timings for commands that read many: the recorder's events alone or the import cache,
 * and the transcript only when the recorder may have missed turns.
 */
export function quickSession(ref: SessionRef, env: Env): Session | undefined {
  if (!ref.events) return ref.imported ? readImported(ref.id, env)?.session : undefined;
  const events = readEvents(ref.events.path);
  if (mayHaveMissed(events, ref.transcript)) return loadSession(ref, { env });
  const recorded = eventsToSession(ref.id, events);
  if (!recorded.cwd && ref.imported) {
    const cwd = readImported(ref.id, env)?.session.cwd;
    if (cwd) recorded.cwd = cwd;
  }
  return recorded;
}

export function mergeSessions(recorded: Session, transcript: Session): Session {
  const fromTranscript = new Map(transcript.steps.map((s) => [s.id, s]));
  const producerOf = new Map<string, Step>();
  for (const step of transcript.steps) {
    if (step.kind === 'model') for (const id of step.produces ?? []) producerOf.set(id, step);
  }
  const steps = recorded.steps.map((step) => {
    const merged: Step = { ...step };
    const twin = fromTranscript.get(step.id);
    if (twin) {
      if (twin.detail) merged.detail = twin.detail;
      if (merged.exitCode === undefined && twin.exitCode !== undefined)
        merged.exitCode = twin.exitCode;
      if (merged.ok === undefined && twin.ok !== undefined) merged.ok = twin.ok;
      if (!merged.command && twin.command) merged.command = twin.command;
      if (!merged.actions && twin.actions) merged.actions = twin.actions;
      if (!merged.backgroundId && twin.backgroundId) merged.backgroundId = twin.backgroundId;
    }
    if (step.kind === 'model') {
      const produced = step.produces?.[0];
      const source = produced
        ? producerOf.get(produced)
        : transcript.steps.find(
            (t) =>
              t.kind === 'model' &&
              !t.produces &&
              t.agentId === step.agentId &&
              t.startMs < step.endMs &&
              t.endMs > step.startMs,
          );
      if (source?.model) merged.model = source.model;
      if (source?.tokens) merged.tokens = source.tokens;
      // The hooks don't see a request being resent; the transcript does. Model time starts at the
      // send that was answered.
      if (
        source?.flags.includes('resent') &&
        source.startMs > merged.startMs &&
        source.startMs < merged.endMs
      ) {
        merged.startMs = source.startMs;
        merged.flags = [...merged.flags, 'resent'];
      }
    }
    return merged;
  });
  const ids = new Set(steps.map((s) => s.id));
  for (const step of transcript.steps) {
    if (
      step.kind === 'background' &&
      step.parentId &&
      ids.has(step.parentId) &&
      !ids.has(step.id)
    ) {
      steps.push(step);
    }
  }
  const session: Session = {
    ...recorded,
    sources: ['recorder', 'transcript'],
    steps,
    endMs: Math.max(recorded.endMs, ...steps.map((s) => s.endMs)),
  };
  if (transcript.title) session.title = transcript.title;
  if (transcript.agentVersion) session.agentVersion = transcript.agentVersion;
  if (transcript.diagnostics) session.diagnostics = transcript.diagnostics;
  if (!session.cwd && transcript.cwd) session.cwd = transcript.cwd;
  session.transcriptPath = transcript.transcriptPath ?? recorded.transcriptPath;
  return session;
}
