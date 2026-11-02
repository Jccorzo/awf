// Writes docs/sample-report.html from the made-up session in test/report/synthetic.ts, and its
// light and dark screenshots to docs/images/. Nothing from this machine reaches either: the session
// is invented, and the report gets a made-up home and a fixed time.
// Usage: pnpm report:sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Browser, chromium } from 'playwright-core';
import { analyze } from '../src/analyze/summary';
import { memoryFiles } from '../src/classify/resolve';
import { buildReportData } from '../src/report/data';
import { renderReportHtml } from '../src/report/html';
import { syntheticSession } from '../test/report/synthetic';

/** Six turns fit on one screen with readable bars; twenty turns open mostly as collapsed rows. */
const TURNS = 6;
const VIEWPORT = { width: 1280, height: 860 };

async function launchChromium(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch {
    console.error("Chromium isn't installed. Run: pnpm exec playwright-core install chromium");
    process.exit(1);
  }
}

const browser = await launchChromium();
const file = path.resolve('docs/sample-report.html');
const session = syntheticSession({ turns: TURNS });
const analysis = analyze(session, { files: memoryFiles({}) });
const data = buildReportData(analysis, { home: '/home/dev', now: Date.UTC(2026, 9, 28, 16, 0, 0) });
writeFileSync(file, renderReportHtml(data));
console.log(`${path.relative('.', file)}: ${readFileSync(file).length} bytes`);

mkdirSync('docs/images', { recursive: true });
try {
  for (const colorScheme of ['light', 'dark'] as const) {
    const page = await browser.newPage({
      viewport: VIEWPORT,
      colorScheme,
      timezoneId: 'UTC',
      locale: 'en-GB',
    });
    const url = pathToFileURL(file).href;
    page.on('pageerror', (error) => console.error(`page error: ${error.message}`));
    page.on('request', (request) => {
      if (request.url() !== url) console.error(`request: ${request.url()}`);
    });
    await page.goto(url);
    await page.waitForSelector('body[data-ready="1"]');
    const shot = `docs/images/sample-report-${colorScheme}.png`;
    await page.screenshot({ path: shot });
    console.log(`${shot}: ${readFileSync(shot).length} bytes`);
    await page.close();
  }
} finally {
  await browser.close();
}
