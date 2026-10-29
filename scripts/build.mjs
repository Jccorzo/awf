// Builds the CLI (dist/awf.mjs) and the plugin's scripts (plugin/scripts/).
// Usage: node scripts/build.mjs [--quiet] [--cli-only]
import { build } from 'esbuild';
import { chmodSync } from 'node:fs';
import path from 'node:path';
import { cliOptions, hookOptions, root } from './build-options.mjs';

const quiet = process.argv.includes('--quiet');
const cliOnly = process.argv.includes('--cli-only');
const logLevel = quiet ? 'error' : 'info';

async function buildCli(outfile) {
  await build({ ...cliOptions(outfile), logLevel });
  chmodSync(path.join(root, outfile), 0o755);
}

await buildCli('dist/awf.mjs');

if (!cliOnly) {
  // The plugin carries the recorder hook and its own copy of the CLI, so /waterfall works without npm.
  await build({ ...hookOptions('plugin/scripts/record.cjs'), logLevel });
  await buildCli('plugin/scripts/awf.mjs');
}
