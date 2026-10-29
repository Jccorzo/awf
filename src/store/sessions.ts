import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { importClaudeCodeTranscript } from '../importers/claude-code/import';
import { listTranscripts, type TranscriptFile } from '../importers/claude-code/locate';
import type { Session, Step } from '../model/types';
import { eventsToSession } from '../recorder/steps';
import { type EventsFile, listEventFiles, readEvents } from './events';
import { listImportedIds, readImported } from './imported';

type Env = Record<string, string | undefined>;

/** Everything awf knows about one session ID. */
export interface SessionRef {
  id: string;
  events?: EventsFile;
  transcript?: TranscriptFile;
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
  return index;
}

function latestMs(ref: SessionRef): number {
  return Math.max(ref.events?.mtimeMs ?? 0, ref.transcript?.mtimeMs ?? 0);
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
    if (!last) throw new Error('no sessions found');
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
 * details the hooks don't store (output, tokens, background completions), and fills in sessions the
 * recorder never saw.
 */
export function loadSession(ref: SessionRef, options: LoadOptions = {}): Session {
  const env = options.env ?? process.env;
  const recorded = ref.events ? eventsToSession(ref.id, readEvents(ref.events.path)) : undefined;
  const transcriptPath = ref.transcript?.path ?? existing(recorded?.transcriptPath);
  let transcript: Session | undefined;
  if (transcriptPath) {
    try {
      transcript = importClaudeCodeTranscript(transcriptPath, { detail: options.detail ?? false });
    } catch {
      transcript = undefined;
    }
  }
  if (recorded && transcript) return mergeSessions(recorded, transcript);
  if (recorded) return recorded;
  if (transcript) return transcript;
  const imported = readImported(ref.id, env);
  if (imported) return { ...imported.session, sources: ['import-cache'] };
  throw new Error(`session ${ref.id} has no readable data`);
}

function existing(file: string | undefined): string | undefined {
  return file && existsSync(file) ? file : undefined;
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
