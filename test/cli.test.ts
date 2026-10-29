import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { main } from '../src/cli/main';
import { VERSION } from '../src/version';
import { captureIo } from './helpers';

describe('cli', () => {
  it('prints the package version', async () => {
    const io = captureIo();
    expect(await main(['--version'], io)).toBe(0);
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(io.stdout).toEqual([pkg.version]);
    expect(VERSION).toBe(pkg.version);
  });

  it('rejects unknown commands', async () => {
    const io = captureIo();
    expect(await main(['frobnicate'], io)).toBe(2);
    expect(io.stderr[0]).toContain('unknown command');
  });
});

describe('awf purge', () => {
  it('lists what it would delete, deletes only with --yes, and refuses folders that hold other files', async () => {
    const home = mkdtempSync(path.join(os.tmpdir(), 'awf-purge-'));
    const dir = path.join(home, '.awf');
    mkdirSync(path.join(dir, 'events'), { recursive: true });
    writeFileSync(path.join(dir, 'events', 's.jsonl'), '{}\n');
    const env = { AWF_HOME: dir, HOME: home };

    let io = captureIo();
    expect(await main(['purge'], io, env)).toBe(0);
    expect(io.stdout.join('\n')).toContain('Would delete ~/.awf');
    expect(existsSync(dir)).toBe(true);

    writeFileSync(path.join(dir, 'notes.txt'), 'mine');
    io = captureIo();
    expect(await main(['purge', '--yes'], io, env)).toBe(1);
    expect(io.stderr.join('\n')).toContain('notes.txt');
    expect(existsSync(dir)).toBe(true);

    rmSync(path.join(dir, 'notes.txt'));
    io = captureIo();
    expect(await main(['purge', '--yes'], io, env)).toBe(0);
    expect(existsSync(dir)).toBe(false);
  });
});
