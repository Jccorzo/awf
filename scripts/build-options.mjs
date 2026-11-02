// esbuild options shared by scripts/build.mjs and the tests that check the committed plugin bundles.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** `import text from './file.yaml?raw'`, as Vite (and so Vitest) does. */
export const rawPlugin = {
  name: 'raw',
  setup(build) {
    // esbuild prints this path in a comment in the committed bundle, so it can't depend on where
    // the repo is: it's relative to the root, with forward slashes on every platform.
    build.onResolve({ filter: /\?raw$/ }, (args) => {
      const file = path.resolve(args.resolveDir, args.path.slice(0, -'?raw'.length));
      return { path: path.relative(root, file).split(path.sep).join('/'), namespace: 'raw' };
    });
    build.onLoad({ filter: /.*/, namespace: 'raw' }, async (args) => ({
      contents: (await import('node:fs')).readFileSync(path.join(root, args.path), 'utf8'),
      loader: 'text',
    }));
  },
};

/**
 * The report viewer, bundled for the browser and minified, and its stylesheet: the strings
 * src/report/html.ts inlines into every report.
 */
export async function buildReportAssets() {
  const { build } = await import('esbuild');
  const shared = {
    bundle: true,
    minify: true,
    write: false,
    absWorkingDir: root,
    legalComments: 'none',
  };
  const [js, css] = await Promise.all([
    build({
      ...shared,
      entryPoints: ['src/report/client/main.ts'],
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
    }),
    build({ ...shared, entryPoints: ['src/report/client/styles.css'] }),
  ]);
  // Inline <script> and <style> end at the first closing tag, wherever it is.
  const guard = (text, tag) => text.replace(new RegExp(`</(${tag})`, 'gi'), '<\\/$1');
  return {
    CLIENT_JS: guard(js.outputFiles[0].text.trim(), 'script'),
    CLIENT_CSS: guard(css.outputFiles[0].text.trim(), 'style'),
  };
}

/** `import { CLIENT_JS, CLIENT_CSS } from 'virtual:report-assets'`. */
export const reportAssetsPlugin = {
  name: 'report-assets',
  setup(build) {
    build.onResolve({ filter: /^virtual:report-assets$/ }, () => ({
      path: 'report-assets',
      namespace: 'report-assets',
    }));
    build.onLoad({ filter: /.*/, namespace: 'report-assets' }, async () => {
      const assets = await buildReportAssets();
      return {
        contents: Object.entries(assets)
          .map(([name, text]) => `export const ${name} = ${JSON.stringify(text)};`)
          .join('\n'),
        loader: 'js',
      };
    });
  },
};

const common = {
  bundle: true,
  plugins: [rawPlugin, reportAssetsPlugin],
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
