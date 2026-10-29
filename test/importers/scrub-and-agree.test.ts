import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { importClaudeCodeTranscript } from '../../src/importers/claude-code/import';
import { makeScrubber } from '../../src/importers/claude-code/scrub';
import { eventsToSession } from '../../src/recorder/steps';
import { readEvents } from '../../src/store/events';
import { notification, prompt, result, text, toolUse, writeTranscript } from '../transcript';

const FIXTURES = path.resolve(__dirname, '../../fixtures/claude-code');

describe('scrubber', () => {
  const entries = [
    prompt(0, 'my secret roadmap: acquire Initech'),
    toolUse(1, 'm1', 't1', 'Bash', {
      command:
        "export API_KEY=sk-live-0123456789abcdefghij && cat > /Users/jane/x.ts <<'EOF'\nconst secretCode = 1;\nEOF\npnpm test",
      description: 'write and test',
    }),
    result(5, 't1', {
      error: true,
      content: 'Exit code 1\nexpected secretCode to be 2',
      toolUseResult: 'Error: Exit code 1\nexpected secretCode to be 2',
    }),
    toolUse(6, 'm2', 'e1', 'Edit', {
      file_path: '/Users/jane/x.ts',
      old_string: 'secretCode = 1',
      new_string: 'secretCode = 2',
    }),
    result(6.2, 'e1', {
      toolUseResult: {
        filePath: '/Users/jane/x.ts',
        oldString: 'secretCode = 1',
        originalFile: 'const secretCode = 1;',
      },
    }),
    toolUse(7, 'm3', 'b1', 'Bash', { command: 'pnpm dev', run_in_background: true }),
    result(7.1, 'b1', {
      content: 'Command running in background with ID: bgA1. Output is being written to: /tmp/o',
      toolUseResult: { backgroundTaskId: 'bgA1' },
    }),
    text(8, 'm4', 'I fixed the secretCode for Initech'),
    notification(20, 'bgA1', 'completed'),
  ];
  const raw = writeTranscript('scrub-me', entries);
  const scrubber = makeScrubber({ home: '/Users/jane' });
  const scrubbedLines = readFileSync(raw, 'utf8').split('\n').map(scrubber.line);
  const scrubbed = raw.replace(/\.jsonl$/, '.scrubbed.jsonl');
  writeFileSync(scrubbed, scrubbedLines.join('\n'));
  const all = scrubbedLines.join('\n');

  it('removes prompts, code, output and secrets', () => {
    for (const leak of ['Initech', 'roadmap', 'secretCode', 'sk-live', 'jane', 'write and test']) {
      expect(all).not.toContain(leak);
    }
  });

  it('keeps commands, paths, exit codes and task IDs', () => {
    expect(all).toContain('pnpm test');
    expect(all).toContain('/Users/user/x.ts');
    expect(all).toContain('Exit code 1');
    expect(all).toContain('bgA1');
    expect(all).toContain('‹1 line›');
  });

  it('gives the importer the same steps as the raw transcript', () => {
    const before = importClaudeCodeTranscript(raw);
    const after = importClaudeCodeTranscript(scrubbed);
    const shape = (s: typeof before) =>
      s.steps.map((x) => [x.kind, x.tool, x.startMs, x.endMs, x.ok, x.exitCode, x.flags.join(',')]);
    expect(shape(after)).toEqual(shape(before));
  });
});

describe('recorder and importer agree', () => {
  const pairs = readdirSync(FIXTURES)
    .map((name) => path.join(FIXTURES, name))
    .filter((dir) => existsSync(path.join(dir, 'events')));

  it('has at least one fixture recorded by both', () => {
    expect(pairs.length).toBeGreaterThan(0);
  });

  it.each(pairs.map((dir) => [path.basename(dir), dir]))(
    'on %s, total time within 5%%',
    (_name, dir) => {
      const eventsFile = readdirSync(path.join(dir, 'events'))[0] as string;
      const id = eventsFile.replace(/\.jsonl$/, '');
      const recorded = eventsToSession(id, readEvents(path.join(dir, 'events', eventsFile)));
      const imported = importClaudeCodeTranscript(path.join(dir, `${id}.jsonl`));
      const a = recorded.endMs - recorded.startMs;
      const b = imported.endMs - imported.startMs;
      expect(Math.abs(a - b) / a).toBeLessThan(0.05);
      expect(
        imported.steps
          .filter((s) => s.kind === 'tool')
          .map((s) => s.id)
          .sort(),
      ).toEqual(
        recorded.steps
          .filter((s) => s.kind === 'tool')
          .map((s) => s.id)
          .sort(),
      );
    },
  );
});
