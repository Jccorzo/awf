import { readFileSync } from 'node:fs';
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
