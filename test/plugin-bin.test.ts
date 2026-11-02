import { execFileSync, spawnSync } from 'node:child_process';
import { accessSync, constants, copyFileSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { root } from '../scripts/build-options.mjs';
import { VERSION } from '../src/version';

const bin = path.join(root, 'plugin/bin/awf');

/** A copy of the plugin's wrapper and CLI under a path with spaces, and a HOME with nothing in it. */
function pluginWithSpaces(): { bin: string; home: string } {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'awf bin '));
  const plugin = path.join(tmp, 'my plugins', 'awf plugin');
  mkdirSync(path.join(plugin, 'bin'), { recursive: true });
  mkdirSync(path.join(plugin, 'scripts'));
  copyFileSync(bin, path.join(plugin, 'bin/awf'));
  copyFileSync(path.join(root, 'plugin/scripts/awf.mjs'), path.join(plugin, 'scripts/awf.mjs'));
  return { bin: path.join(plugin, 'bin/awf'), home: path.join(tmp, 'home') };
}

describe('plugin/bin/awf', () => {
  it('is an executable POSIX sh script', () => {
    expect(() => accessSync(bin, constants.X_OK)).not.toThrow();
    expect(readFileSync(bin, 'utf8').split('\n')[0]).toBe('#!/bin/sh');
  });

  it('prints the version', () => {
    expect(execFileSync(bin, ['--version'], { encoding: 'utf8' }).trim()).toBe(VERSION);
  });

  it('works from a path with spaces', () => {
    const plugin = pluginWithSpaces();
    expect(execFileSync(plugin.bin, ['--version'], { encoding: 'utf8' }).trim()).toBe(VERSION);
  });

  it('passes each argument whole, and the exit code back', () => {
    const plugin = pluginWithSpaces();
    const result = spawnSync(plugin.bin, ['summary', 'no such session'], {
      encoding: 'utf8',
      // Only what node needs: the overrides that win over HOME must not reach real sessions.
      env: { PATH: process.env.PATH, HOME: plugin.home },
    });
    expect(result.stderr).toContain('no session "no such session"');
    expect(result.status).toBe(1);
  });
});
