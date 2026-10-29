// Opens reports in headless Chromium: they draw in under two seconds, make no network requests,
// log no errors, and their filters and keyboard navigation work. Skipped when Playwright's
// Chromium isn't installed (npx playwright install chromium).
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Browser, chromium, type Page } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { analyze } from '../../src/analyze/summary';
import { memoryFiles } from '../../src/classify/resolve';
import { importClaudeCodeTranscript } from '../../src/importers/claude-code/import';
import type { Session } from '../../src/model/types';
import { buildReportData } from '../../src/report/data';
import { renderReportHtml } from '../../src/report/html';
import { syntheticSession } from './synthetic';

const installed = (() => {
  try {
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
})();

const dir = mkdtempSync(path.join(os.tmpdir(), 'awf-browser-'));
const TEST_FIX = path.resolve(
  __dirname,
  '../../fixtures/claude-code/cc-2.1.312-test-fix/4045beec-4abe-4901-822b-0e34d3c9fa14.jsonl',
);

function write(name: string, session: Session): string {
  const file = path.join(dir, `${name}.html`);
  const data = buildReportData(analyze(session, { files: memoryFiles({}) }), {
    home: '/Users/user',
  });
  writeFileSync(file, renderReportHtml(data));
  return pathToFileURL(file).href;
}

describe.skipIf(!installed)('report in a browser', () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await chromium.launch();
  });
  afterAll(async () => {
    await browser?.close();
  });

  async function open(url: string, colorScheme: 'light' | 'dark' = 'light') {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme });
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', (r) => {
      if (r.url() !== url) requests.push(r.url());
    });
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));
    const started = Date.now();
    await page.goto(url);
    await page.waitForSelector('body[data-ready="1"]');
    return { page, requests, errors, ms: Date.now() - started };
  }

  const rows = (page: Page) => page.locator('.rows .row').count();

  it('draws a one-hour session in under two seconds, offline and without errors', async () => {
    const session = syntheticSession();
    expect(session.steps.length).toBeGreaterThan(1000);
    const { page, requests, errors, ms } = await open(write('hour', session), 'dark');
    expect(ms).toBeLessThan(2000);
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
    // Long sessions start with turns folded; expanding all shows every step.
    const folded = await rows(page);
    await page.getByRole('button', { name: 'Expand all' }).click();
    expect(await rows(page)).toBeGreaterThan(folded);
    expect(await rows(page)).toBe(session.steps.length);
    await page.close();
  });

  it('filters by phase, by failure and by text, and opens a step on Enter', async () => {
    const { page, errors } = await open(write('test-fix', importClaudeCodeTranscript(TEST_FIX)));
    const all = await rows(page);

    await page.locator('.chip', { hasText: 'Rework' }).click();
    expect(await page.locator('.chip', { hasText: 'Rework' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    const reworkRows = await rows(page);
    expect(reworkRows).toBeLessThan(all);
    await expect.poll(() => page.locator('.rows .row .kind').allTextContents()).toContain('Edit');
    await page.locator('.chip', { hasText: 'Rework' }).click();

    await page.getByLabel('Failed only').check();
    expect(await page.locator('.rows .fail').count()).toBe(1);
    await page.getByLabel('Failed only').uncheck();

    await page.getByLabel('Search steps').fill('sum.js');
    await expect
      .poll(() => page.locator('.rows .row .text').allTextContents())
      .toEqual(['sum.js', 'sum.js']);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    expect(await rows(page)).toBe(all);

    // Keyboard: Tab into the list, move down, open the details with Enter, close with Escape.
    await page.locator('.rows .pick').first().focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect.poll(() => page.locator('.more').count()).toBe(1);
    expect(await page.locator('.more').textContent()).toContain('Running tests');
    await page.keyboard.press('Escape');
    await expect.poll(() => page.locator('.more').count()).toBe(0);

    // A slowest-step link reveals and opens that step.
    await page.locator('.why .link').first().click();
    expect(await page.locator('.row.sel .badge').textContent()).toBe('slowest');
    expect(errors).toEqual([]);
    await page.close();
  });

  it('fits a phone screen without sideways scrolling', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await page.goto(write('phone', syntheticSession()));
    await page.waitForSelector('body[data-ready="1"]');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await page.close();
  });
});
