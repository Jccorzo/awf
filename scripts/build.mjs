// Builds the CLI (dist/awf.mjs) and the plugin's scripts (plugin/scripts/).
// Usage: node scripts/build.mjs [--quiet] [--cli-only]
import { build } from 'esbuild';
import { chmodSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quiet = process.argv.includes('--quiet');
const cliOnly = process.argv.includes('--cli-only');

const common = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  logLevel: quiet ? 'error' : 'info',
  legalComments: 'none',
  absWorkingDir: root,
};

const cliBanner = [
  '#!/usr/bin/env node',
  "import { createRequire as __awfCreateRequire } from 'node:module';",
  'const require = __awfCreateRequire(import.meta.url);',
].join('\n');

async function buildCli(outfile) {
  await build({
    ...common,
    entryPoints: ['src/cli/bin.ts'],
    outfile,
    format: 'esm',
    banner: { js: cliBanner },
  });
  chmodSync(path.join(root, outfile), 0o755);
}

await buildCli('dist/awf.mjs');

if (!cliOnly) {
  // The plugin carries its own copy of the CLI so /waterfall works without a global install.
  await buildCli('plugin/scripts/awf.mjs');
}
