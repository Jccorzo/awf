// Runs a TypeScript script from scripts/ with its src/ imports: bundles it with esbuild, then imports it.
// Usage: node scripts/run-ts.mjs scripts/scrub.ts [args...]
import { build } from 'esbuild';
import { mkdirSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { rawPlugin, reportAssetsPlugin, root } from './build-options.mjs';

const [entry, ...args] = process.argv.slice(2);
if (!entry) {
  console.error('usage: node scripts/run-ts.mjs <script.ts> [args...]');
  process.exit(2);
}
// Inside the repo, so packages left external (playwright-core) resolve from node_modules.
const cache = path.join(root, 'node_modules/.cache');
mkdirSync(cache, { recursive: true });
const outfile = path.join(mkdtempSync(path.join(cache, 'awf-run-')), 'script.mjs');
await build({
  entryPoints: [path.resolve(entry)],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  absWorkingDir: root,
  plugins: [rawPlugin, reportAssetsPlugin],
  external: ['playwright-core'],
  logLevel: 'error',
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
});
process.argv = [process.argv[0], outfile, ...args];
await import(pathToFileURL(outfile).href);
