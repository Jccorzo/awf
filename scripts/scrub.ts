// Writes scrubbed copies of the raw transcripts in fixtures/raw/ to fixtures/claude-code/.
// Usage: pnpm scrub [fixtures/raw] [--out fixtures/claude-code]
//
// fixtures/raw/<name>/<session-id>.jsonl (+ <session-id>/subagents/*.jsonl, + events/<session-id>.jsonl)
// becomes fixtures/claude-code/<name>/ with the same layout. Raw files never leave fixtures/raw/.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeScrubber } from '../src/importers/claude-code/scrub';

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const out = outIndex >= 0 ? (args[outIndex + 1] as string) : 'fixtures/claude-code';
const isOutValue = (i: number) => outIndex >= 0 && i === outIndex + 1;
const rawRoot = args.find((a, i) => !a.startsWith('--') && !isOutValue(i)) ?? 'fixtures/raw';
const scrubber = makeScrubber({ home: os.homedir() });

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    return statSync(file).isDirectory() ? walk(file) : file.endsWith('.jsonl') ? [file] : [];
  });
}

let written = 0;
for (const name of readdirSync(rawRoot)) {
  const source = path.join(rawRoot, name);
  if (!statSync(source).isDirectory()) continue;
  for (const file of walk(source)) {
    const relative = path.relative(source, file);
    const target = path.join(out, name, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    const lines = readFileSync(file, 'utf8').split('\n');
    const isEvents = relative.split(path.sep)[0] === 'events';
    const scrubbed = lines.map(isEvents ? scrubber.event : scrubber.line);
    writeFileSync(target, scrubbed.join('\n'));
    written++;
  }
}
console.log(
  `Wrote ${written} scrubbed files to ${out}${existsSync(out) ? '' : ' (nothing found)'}.`,
);
