import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { Classifier } from '../src/classify/classify';
import { memoryFiles } from '../src/classify/resolve';
import { defaultRules } from '../src/classify/rules';
import { bashStats } from '../src/cli/commands/stats';
import { main } from '../src/cli/main';
import type { Step } from '../src/model/types';
import { captureIo } from './helpers';

const FIXTURE = path.resolve(__dirname, '../fixtures/claude-code/cc-2.1.312-test-fix');
const ID = '4045beec-4abe-4901-822b-0e34d3c9fa14';
const home = mkdtempSync(path.join(os.tmpdir(), 'awf-analysis-'));
const projects = mkdtempSync(path.join(os.tmpdir(), 'awf-analysis-projects-'));
const env = { AWF_HOME: home, AWF_CLAUDE_PROJECTS: projects, HOME: '/Users/user' };
const now = Date.parse('2026-10-29T12:00:00Z');

async function run(...argv: string[]) {
  const io = captureIo();
  const code = await main(argv, io, env, '/', now);
  return { code, out: io.stdout.join('\n'), err: io.stderr.join('\n') };
}

beforeAll(() => {
  const dir = path.join(projects, '-tmp-demo');
  mkdirSync(dir, { recursive: true });
  cpSync(path.join(FIXTURE, `${ID}.jsonl`), path.join(dir, `${ID}.jsonl`));
});

describe('analysis commands', () => {
  it('imports, then lists, classifies and counts the session', async () => {
    const imported = await run('import', '--json');
    expect(imported.code).toBe(0);
    expect(JSON.parse(imported.out)).toMatchObject({ transcripts: 1, imported: 1, errors: [] });

    const sessions = await run('sessions', '--json');
    expect(JSON.parse(sessions.out)[0]).toMatchObject({
      id: ID,
      turns: 1,
      toolCalls: 5,
      sources: ['transcript'],
    });

    const classified = await run('classify', ID.slice(0, 6));
    expect(classified.out).toMatch(/Running tests\s+Bash: npm test\s+\[FAILED/);

    const stats = JSON.parse((await run('stats', '--json')).out);
    expect(stats).toMatchObject({ sessions: 1, bashCalls: 3 });
    expect(stats.byPhase.map((p: { phase: string }) => p.phase)).toEqual(['tests', 'exploring']);
  });

  it('keeps commands, files and output out of --share', async () => {
    const shared = (await run('classify', ID, '--json', '--share')).out;
    expect(shared).not.toContain('npm test');
    expect(shared).not.toContain('sum.js');
    expect(shared).not.toContain('scratchpad');
    expect(JSON.parse(shared).steps.some((s: { tool?: string }) => s.tool === 'Bash')).toBe(true);
  });

  it('samples commands as a CSV and checks labels against the rules', async () => {
    const csv = (await run('sample', '--n', '5', '--csv')).out;
    expect(csv.split('\n')[0]).toBe('command,cwd,awf_phase,your_phase');
    const labels = path.join(home, 'labels.csv');
    writeFileSync(
      labels,
      'command,cwd,awf_phase,your_phase\n"pnpm exec vitest run",/r,tests,tests\nls,/r,exploring,writing-code\n',
    );
    const report = JSON.parse((await run('accuracy', labels, '--json')).out);
    expect(report).toMatchObject({ labelled: 2, agree: 1 });
    expect(report.misses).toEqual([{ command: 'ls', yours: 'writing-code', awf: 'exploring' }]);
  });

  it('explains an unknown session', async () => {
    const missing = await run('classify', 'nope');
    expect(missing.code).toBe(1);
    expect(missing.err).toContain('no session "nope"');
  });
});

describe('stats by program', () => {
  const classifier = new Classifier(defaultRules(), memoryFiles({}));
  const bash = (id: string, command: string, seconds: number): Step => ({
    id,
    parentId: null,
    kind: 'tool',
    tool: 'Bash',
    command,
    startMs: 0,
    endMs: seconds * 1000,
    flags: [],
  });
  const classified = classifier.session({
    id: 's',
    agent: 'claude-code',
    sources: ['transcript'],
    cwd: '/repo',
    startMs: 0,
    endMs: 600_000,
    steps: [
      bash('a', 'T=$(gh auth token --user me); GH_TOKEN=$T xcodebuild test -scheme App', 300),
      bash('b', "python3 - <<'EOF'\nprint(1)\nEOF\nxcodebuild test -scheme App | tail -5", 200),
      bash('c', 'cat > notes.txt <<EOF\nx\nEOF\ncargo fmt && cargo test', 100),
      bash('d', 'node --test test/', 50),
      bash('e', 'until gh run view 1 --json status | grep -q done; do sleep 30; done', 40),
      bash('f', 'python3 gen.py && frobnicate --all', 30),
    ],
  });

  it('names a phase by the part of each command that decided it', () => {
    const tests = bashStats([classified], 10, 'tests').topUnclassified;
    expect(tests).toEqual([
      { program: 'xcodebuild test', ms: 500_000, calls: 2 },
      { program: 'cargo test', ms: 100_000, calls: 1 },
      { program: 'node --test', ms: 50_000, calls: 1 },
    ]);
    expect(bashStats([classified], 10, 'running').topUnclassified).toEqual([
      { program: '(polling: sleep in a loop, or a long sleep)', ms: 40_000, calls: 1 },
    ]);
  });

  it('names unclassified time by the program no rule matched', () => {
    expect(bashStats([classified], 10).topUnclassified).toEqual([
      { program: 'frobnicate', ms: 30_000, calls: 1 },
    ]);
  });
});
