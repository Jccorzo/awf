import path from 'node:path';
import { type ClassifiedSession, Classifier } from '../classify/classify';
import { diskFiles, type Files } from '../classify/resolve';
import { defaultRules, repoRules } from '../classify/rules';
import type { Session } from '../model/types';
import { parseSince } from '../model/time';
import { loadSession, projectKey, quickSessions, resolveSession } from '../store/sessions';
import type { Ctx, Options } from './main';

/** One session, from its ID, prefix, `last` or a file path, with transcript details when asked. */
export function loadOne(
  ctx: Ctx,
  ref: string | undefined,
  options: Options,
  detail: boolean,
): Session {
  if (!ref)
    throw new Error('which session? Give an ID (or its first characters), "last", or a file path.');
  const project =
    typeof options.project === 'string'
      ? projectKey(path.resolve(ctx.cwd, options.project))
      : undefined;
  return loadSession(resolveSession(ref, ctx.env, project), { detail, env: ctx.env });
}

/**
 * Classifies with the rules of each repo a command runs in, falling back to the session's
 * project; files are read and rules compiled once across sessions.
 */
export function classifier(files: Files = diskFiles()) {
  const cache = new Map<string, Classifier>();
  const rulesAt = repoRules(files);
  return (session: Session): ClassifiedSession => {
    const key = session.cwd ?? '';
    let c = cache.get(key);
    if (!c) {
      const rules = (session.cwd ? rulesAt(session.cwd) : undefined) ?? defaultRules();
      cache.set(key, (c = new Classifier(rules, files, rulesAt)));
    }
    return c.session(session);
  };
}

/** Every session with timings, cheaply: see `quickSessions`. */
export function loadMany(ctx: Ctx, options: Options): Session[] {
  const since = typeof options.since === 'string' ? ctx.now - parseSince(options.since) : -Infinity;
  const project =
    typeof options.project === 'string' ? path.resolve(ctx.cwd, options.project) : undefined;
  const sessions: Session[] = [];
  for (const { session } of quickSessions(ctx.env)) {
    if (session.startMs < since) continue;
    if (
      project &&
      !(session.cwd && (session.cwd === project || session.cwd.startsWith(project + path.sep)))
    )
      continue;
    sessions.push(session);
  }
  return sessions.sort((a, b) => a.startMs - b.startMs);
}
