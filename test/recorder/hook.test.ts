import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { cliOptions, hookOptions, root } from '../../scripts/build-options.mjs';

const tmp = mkdtempSync(path.join(os.tmpdir(), 'awf-hook-'));
const hookFile = path.join(tmp, 'record.cjs');
const preload = path.join(root, 'test/setup/no-network.cjs');
const reportCpu = path.join(root, 'test/setup/report-cpu.cjs');

/** What any hook has to do, and nothing else: read its input and append it to a file. */
const BARE_HOOK = `
const { appendFileSync, mkdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
const input = readFileSync(0, 'utf8');
const dir = path.join(process.env.AWF_HOME, 'events');
mkdirSync(dir, { recursive: true });
appendFileSync(path.join(dir, 'bare.jsonl'), input + '\\n');
`;

function runHook(input: unknown, home: string): { status: number | null; stdout: string } {
  const result = spawnSync(process.execPath, [hookFile], {
    input: JSON.stringify(input),
    env: { ...process.env, AWF_HOME: home, NODE_OPTIONS: `--require ${preload}` },
    encoding: 'utf8',
  });
  return { status: result.status, stdout: result.stdout };
}

/** The CPU time of one run of a script, in ms. */
function cpuMs(input: unknown, home: string, file: string): number {
  const report = path.join(tmp, 'cpu');
  rmSync(report, { force: true });
  spawnSync(process.execPath, [file], {
    input: JSON.stringify(input),
    env: {
      ...process.env,
      AWF_HOME: home,
      AWF_TEST_CPU_FILE: report,
      NODE_OPTIONS: `--require ${preload} --require ${reportCpu}`,
    },
  });
  return Number(readFileSync(report, 'utf8'));
}

beforeAll(async () => {
  await build({ ...hookOptions(hookFile), logLevel: 'silent' });
});

describe('recorder hook', () => {
  it('appends one line per event to the session file and prints nothing', () => {
    const home = mkdtempSync(path.join(tmp, 'home-'));
    const pre = {
      session_id: 'abc-123',
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_use_id: 'toolu_1',
      tool_input: { command: 'pnpm test' },
    };
    const before = Date.now();
    expect(runHook(pre, home)).toMatchObject({ status: 0, stdout: '' });
    expect(
      runHook(
        { ...pre, hook_event_name: 'PostToolUse', tool_response: { stdout: 'ALL OUTPUT' } },
        home,
      ).status,
    ).toBe(0);
    const lines = readFileSync(path.join(home, 'events', 'abc-123.jsonl'), 'utf8')
      .trim()
      .split('\n');
    expect(lines).toHaveLength(2);
    const first = JSON.parse(lines[0] ?? '{}');
    expect(first).toMatchObject({ e: 'PreToolUse', cmd: 'pnpm test', tuid: 'toolu_1' });
    // The timestamp is the moment the process started, before the hook read its input.
    expect(first.t).toBeGreaterThanOrEqual(before - 5);
    expect(first.t).toBeLessThan(before + 1000);
    expect(lines.join('\n')).not.toContain('ALL OUTPUT');
  });

  it('exits 0 and writes nothing on bad input', () => {
    const home = mkdtempSync(path.join(tmp, 'home-'));
    const result = spawnSync(process.execPath, [hookFile], {
      input: 'not json',
      env: { ...process.env, AWF_HOME: home },
    });
    expect(result.status).toBe(0);
    expect(result.stdout.toString()).toBe('');
  });

  // What the hook costs is its own work, about 3 ms on top of node starting and the append. A run's
  // duration can't show that: 23 ms alone, over 500 ms on a busy machine, where one wait for the CPU
  // or the disk outweighs the budget. CPU time leaves the waiting out, so compare that with a bare
  // script doing the same reads and writes, by the fastest run of each. 15 ms on top of a 35 ms start
  // is the 50 ms budget. Time the hook spends asleep doesn't show here, so it must never sleep.
  it('adds no visible delay: under 15 ms of CPU on top of starting node and appending', () => {
    const home = mkdtempSync(path.join(tmp, 'home-'));
    const bare = path.join(tmp, 'bare-hook.cjs');
    writeFileSync(bare, BARE_HOOK);
    const input = {
      session_id: 'timing',
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_use_id: 'toolu_t',
      tool_input: { command: 'pnpm lint && pnpm test' },
    };
    const hook: number[] = [];
    const control: number[] = [];
    for (let i = 0; i < 15; i++) {
      control.push(cpuMs(input, home, bare));
      hook.push(cpuMs(input, home, hookFile));
    }
    const [fastestHook, fastestBare] = [Math.min(...hook), Math.min(...control)];
    expect(
      fastestHook - fastestBare,
      `fastest hook ${fastestHook} ms of CPU, fastest bare script ${fastestBare} ms`,
    ).toBeLessThan(15);
  }, 60_000); // Thirty runs, each up to a second on a busy machine.

  it('matches the committed plugin bundle', async () => {
    const fresh = await build({
      ...hookOptions('plugin/scripts/record.cjs'),
      write: false,
      logLevel: 'silent',
    });
    const committed = readFileSync(path.join(root, 'plugin/scripts/record.cjs'), 'utf8');
    expect(committed, 'run pnpm build and commit plugin/scripts/record.cjs').toBe(
      fresh.outputFiles?.[0]?.text,
    );
  });
});

describe('plugin CLI', () => {
  it('matches the committed plugin bundle', async () => {
    const fresh = await build({
      ...cliOptions('plugin/scripts/awf.mjs'),
      write: false,
      logLevel: 'silent',
    });
    const committed = readFileSync(path.join(root, 'plugin/scripts/awf.mjs'), 'utf8');
    // Not toBe: on a mismatch that would print both bundles and bury the message.
    expect(
      committed === fresh.outputFiles?.[0]?.text,
      'src/ changed but plugin/scripts/awf.mjs did not: run pnpm build and commit plugin/scripts/awf.mjs',
    ).toBe(true);
  });

  it("doesn't carry the path of the clone it was built in", () => {
    const committed = readFileSync(path.join(root, 'plugin/scripts/awf.mjs'), 'utf8');
    expect(committed).toContain('// raw:src/classify/default-rules.yaml\n');
    expect(committed).not.toContain(root);
  });
});
