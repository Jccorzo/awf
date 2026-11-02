import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { cliOptions, hookOptions, root } from '../../scripts/build-options.mjs';

const tmp = mkdtempSync(path.join(os.tmpdir(), 'awf-hook-'));
const hookFile = path.join(tmp, 'record.cjs');
const preload = path.join(root, 'test/setup/no-network.cjs');

function runHook(
  input: unknown,
  home: string,
): { ms: number; status: number | null; stdout: string } {
  const started = performance.now();
  const result = spawnSync(process.execPath, [hookFile], {
    input: JSON.stringify(input),
    env: { ...process.env, AWF_HOME: home, NODE_OPTIONS: `--require ${preload}` },
    encoding: 'utf8',
  });
  return { ms: performance.now() - started, status: result.status, stdout: result.stdout };
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

  it('adds no visible delay: median run under 50 ms', () => {
    const home = mkdtempSync(path.join(tmp, 'home-'));
    const input = {
      session_id: 'timing',
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_use_id: 'toolu_t',
      tool_input: { command: 'pnpm lint && pnpm test' },
    };
    runHook(input, home); // warm the file cache
    const times = Array.from({ length: 15 }, () => runHook(input, home).ms).sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)] ?? Infinity;
    writeFileSync(path.join(tmp, 'timings.json'), JSON.stringify(times));
    expect(median).toBeLessThan(50);
  });

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
