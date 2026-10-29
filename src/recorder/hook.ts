// The recorder hook. Claude Code runs it (async) for every hook event; it appends one line and exits.
// It must stay small and fast: no rules, no YAML, nothing but parse, pick fields, append.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { eventsDir, safeId } from '../store/paths';
import { toEvent } from './event';

// When Claude Code spawned this process: a better reading of the event time than Date.now() after startup.
const startedAt = Math.round(performance.timeOrigin);

try {
  if (!process.env.AWF_DISABLE) {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    const event = toEvent(input, startedAt);
    if (event) {
      const dir = eventsDir();
      mkdirSync(dir, { recursive: true });
      appendFileSync(path.join(dir, `${safeId(event.sid)}.jsonl`), JSON.stringify(event) + '\n');
    }
  }
} catch {
  // Recording is best effort and must never disturb the session.
}
