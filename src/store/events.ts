import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Session } from '../model/types';
import type { RecorderEvent } from '../recorder/event';
import { eventsToSession } from '../recorder/steps';
import { eventsDir } from './paths';

type Env = Record<string, string | undefined>;

export interface EventsFile {
  id: string;
  path: string;
  mtimeMs: number;
  size: number;
}

export function listEventFiles(env: Env = process.env): EventsFile[] {
  const dir = eventsDir(env);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.jsonl'))
    .map((name) => {
      const file = path.join(dir, name);
      const stat = statSync(file);
      return {
        id: name.slice(0, -'.jsonl'.length),
        path: file,
        mtimeMs: stat.mtimeMs,
        size: stat.size,
      };
    });
}

/** Reads an events file, skipping lines that aren't valid events (a crash mid-write leaves half a line). */
export function readEvents(file: string): RecorderEvent[] {
  const events: RecorderEvent[] = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line) as RecorderEvent;
      if (event && typeof event.e === 'string' && typeof event.t === 'number') events.push(event);
    } catch {
      // skip
    }
  }
  return events;
}

export function loadRecordedSession(file: EventsFile): Session {
  return eventsToSession(file.id, readEvents(file.path));
}
