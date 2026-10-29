import { cpSync, mkdirSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseRange } from '../src/cli/commands/compare';
import { main } from '../src/cli/main';
import { captureIo } from './helpers';

const FIXTURES = path.resolve(__dirname, '../fixtures/claude-code');
const TEST_FIX = '4045beec-4abe-4901-822b-0e34d3c9fa14';
const BG_AGENT = '8c4861e7-317a-454e-890d-dc06d3b1c856';
const home = mkdtempSync(path.join(os.tmpdir(), 'awf-compare-'));
const projects = path.join(home, 'projects');
const env = { AWF_HOME: path.join(home, '.awf'), AWF_CLAUDE_PROJECTS: projects, HOME: home };
const now = Date.parse('2026-10-29T12:00:00Z');

async function run(...argv: string[]) {
  const io = captureIo();
  const code = await main(argv, io, env, '/', now);
  return { code, out: io.stdout.join('\n'), err: io.stderr.join('\n') };
}

beforeAll(async () => {
  const dir = path.join(projects, '-tmp-demo');
  mkdirSync(dir, { recursive: true });
  cpSync(
    path.join(FIXTURES, 'cc-2.1.312-test-fix', `${TEST_FIX}.jsonl`),
    path.join(dir, `${TEST_FIX}.jsonl`),
  );
  cpSync(
    path.join(FIXTURES, 'cc-2.1.312-bg-agent', `${BG_AGENT}.jsonl`),
    path.join(dir, `${BG_AGENT}.jsonl`),
  );
  await run('import');
});

describe('awf compare', () => {
  it('reads ranges: days, ages and spans of either', () => {
    const day = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();
    expect(parseRange('2026-10-01..2026-10-15', now)).toEqual({
      from: day(2026, 10, 1),
      to: day(2026, 10, 16),
    });
    expect(parseRange('2026-10-20', now)).toEqual({
      from: day(2026, 10, 20),
      to: day(2026, 10, 21),
    });
    expect(parseRange('7d', now)).toEqual({ from: now - 7 * 86_400_000, to: now });
    expect(parseRange('14d..7d', now)).toEqual({
      from: now - 14 * 86_400_000,
      to: now - 7 * 86_400_000,
    });
    expect(parseRange('4045beec', now)).toBeUndefined();
    expect(parseRange('last', now)).toBeUndefined();
  });

  it('compares two sessions phase by phase', async () => {
    const result = await run('compare', TEST_FIX.slice(0, 8), BG_AGENT.slice(0, 8), '--json');
    expect(result.code).toBe(0);
    const { before, after, changes } = JSON.parse(result.out);
    expect(before).toMatchObject({ sessions: 1, failures: 1, reworkLoops: 1 });
    expect(after).toMatchObject({ sessions: 1 });
    const tests = changes.find((c: { phase: string }) => c.phase === 'tests');
    const testsMs = (side: { phases: Array<{ phase: string; ms: number }> }) =>
      side.phases.find((p) => p.phase === 'tests')?.ms ?? 0;
    expect(tests.ms).toBe(testsMs(after) - testsMs(before));
    const text = (await run('compare', TEST_FIX.slice(0, 8), BG_AGENT.slice(0, 8))).out;
    expect(text).toMatch(/^Before: 4045beec/);
    expect(text).toMatch(/Running tests\s+\S+/);
    expect(text).toMatch(/Failed checks\s+1\s+1/);
  });

  it('sums every session in a range', async () => {
    // The fixtures' local day, wherever the tests run.
    const sessions = JSON.parse((await run('sessions', '--json')).out) as Array<{
      startMs: number;
    }>;
    const start = new Date(sessions[0]?.startMs ?? 0);
    const two = (n: number) => String(n).padStart(2, '0');
    const localDay = `${start.getFullYear()}-${two(start.getMonth() + 1)}-${two(start.getDate())}`;
    const result = await run('compare', localDay, '2d', '--json');
    const { before } = JSON.parse(result.out);
    expect(before.sessions).toBe(2);
    expect(before.phases.reduce((n: number, p: { ms: number }) => n + p.ms, 0)).toBe(
      before.totalMs,
    );
    expect((await run('compare', '2026-10-01..2026-10-02', '1d')).err).toContain(
      'no sessions in 2026-10-01..2026-10-02',
    );
    expect((await run('compare', 'last')).err).toContain('two sides');
  });
});
