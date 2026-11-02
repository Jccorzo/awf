// What a release depends on: one version everywhere, the published name and command.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { root } from '../scripts/build-options.mjs';
import { VERSION } from '../src/version';

const json = (file: string) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));

describe('the release', () => {
  it('has one version: a GitHub-installed plugin only updates when plugin.json changes', () => {
    const pkg = json('package.json').version;
    const plugin = json('plugin/.claude-plugin/plugin.json').version;
    expect({ plugin, source: VERSION }, 'bump all three together').toEqual({
      plugin: pkg,
      source: pkg,
    });
  });

  it('publishes as agent-waterfall and installs the awf command', () => {
    const pkg = json('package.json');
    expect(pkg.name).toBe('agent-waterfall');
    expect(pkg.bin).toEqual({ awf: 'dist/awf.mjs' });
  });

  it('builds before packing, so a tarball always carries dist/', () => {
    expect(json('package.json').scripts.prepack).toContain('scripts/build.mjs');
  });

  it('points the package and both plugin manifests at the repository', () => {
    const repo = 'https://github.com/Jccorzo/awf';
    expect(json('package.json').repository.url).toBe(`git+${repo}.git`);
    expect(json('plugin/.claude-plugin/plugin.json').repository).toBe(repo);
    expect(json('.claude-plugin/marketplace.json').plugins[0].repository).toBe(repo);
  });
});
