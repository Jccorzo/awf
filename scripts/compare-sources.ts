// Compares the recorder and the importer on sessions that have both an events file and a transcript.
// Usage: node scripts/run-ts.mjs scripts/compare-sources.ts <events.jsonl> <transcript.jsonl> [...pairs]
import { importClaudeCodeTranscript } from '../src/importers/claude-code/import';
import type { Session } from '../src/model/types';
import { eventsToSession } from '../src/recorder/steps';
import { readEvents } from '../src/store/events';

function totals(session: Session) {
  const sum = (kind: string) =>
    session.steps.filter((s) => s.kind === kind).reduce((n, s) => n + s.endMs - s.startMs, 0);
  return {
    total: session.endMs - session.startMs,
    model: sum('model'),
    tool: sum('tool'),
    turns: session.steps.filter((s) => s.kind === 'turn').length,
    tools: session.steps.filter((s) => s.kind === 'tool').length,
  };
}

const args = process.argv.slice(2);
for (let i = 0; i + 1 < args.length; i += 2) {
  const eventsFile = args[i] as string;
  const transcriptFile = args[i + 1] as string;
  const recorded = totals(eventsToSession('r', readEvents(eventsFile)));
  const imported = totals(importClaudeCodeTranscript(transcriptFile));
  const diff = Math.abs(recorded.total - imported.total) / Math.max(recorded.total, 1);
  console.log(
    JSON.stringify({
      transcript: transcriptFile.split('/').pop(),
      recorded,
      imported,
      totalDiffPct: +(diff * 100).toFixed(2),
    }),
  );
}
