// esbuild options shared by scripts/build.mjs and the tests that check the committed plugin bundles.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const common = {
  bundle: true,
  platform: 'node',
  legalComments: 'none',
  absWorkingDir: root,
};

const cliBanner = [
  '#!/usr/bin/env node',
  "import { createRequire as __awfCreateRequire } from 'node:module';",
  'const require = __awfCreateRequire(import.meta.url);',
].join('\n');

/** The CLI: one ESM file with every dependency inlined. */
export function cliOptions(outfile) {
  return {
    ...common,
    entryPoints: ['src/cli/bin.ts'],
    outfile,
    format: 'esm',
    target: 'node20',
    banner: { js: cliBanner },
  };
}

/** The recorder hook: CommonJS starts a little faster, and it runs on whatever node is on PATH. */
export function hookOptions(outfile) {
  return {
    ...common,
    entryPoints: ['src/recorder/hook.ts'],
    outfile,
    format: 'cjs',
    target: 'node18',
    banner: {
      js: '// awf recorder hook. Built from src/recorder/hook.ts by scripts/build.mjs; do not edit.',
    },
  };
}
