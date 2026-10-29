import { defineConfig } from 'vitest/config';
import { buildReportAssets } from './scripts/build-options.mjs';

const REPORT_ASSETS = '\0virtual:report-assets';

export default defineConfig({
  plugins: [
    {
      // The same report client the build inlines (scripts/build-options.mjs).
      name: 'report-assets',
      resolveId: (id) => (id === 'virtual:report-assets' ? REPORT_ASSETS : undefined),
      async load(id) {
        if (id !== REPORT_ASSETS) return undefined;
        const assets = await buildReportAssets();
        return Object.entries(assets)
          .map(([name, text]) => `export const ${name} = ${JSON.stringify(text)};`)
          .join('\n');
      },
    },
  ],
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup/no-network.ts'],
    testTimeout: 20_000,
  },
});
