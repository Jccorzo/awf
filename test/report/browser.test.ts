// Opens reports in headless Chromium: they draw in under two seconds, make no network requests,
// log no errors, and their filters and keyboard navigation work. Skipped, with a note, when
// Playwright's Chromium isn't installed (pnpm exec playwright-core install chromium).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Browser, chromium, type Page } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { root } from '../../scripts/build-options.mjs';
import { analyze } from '../../src/analyze/summary';
import { memoryFiles } from '../../src/classify/resolve';
import { importAgentFile, detectAgentFile } from '../../src/importers/agents';
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

if (!installed) {
  // Not console.warn: Vitest's minimal reporter, its default under a coding agent, hides that.
  process.stderr.write(
    "Skipping the browser tests: Chromium isn't installed. Run: pnpm exec playwright-core install chromium\n",
  );
}

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

describe('pnpm report:screenshots', () => {
  it("says how to install Chromium when it isn't there, and draws nothing", () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/run-ts.mjs', 'scripts/report-screenshots.ts'],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: mkdtempSync(path.join(dir, 'none-')) },
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe(
      "Chromium isn't installed. Run: pnpm exec playwright-core install chromium",
    );
    expect(result.stdout).toBe('');
  });
});

describe.skipIf(!installed)('report in a browser', () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await chromium.launch();
  }, 60_000); // Starting Chromium takes under a second, or over ten with a busy disk.
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

  /** How fast a page can draw, from its first draw: a busy machine only adds time, so retry. */
  async function fastestDraw(url: string, firstMs: number) {
    let fastest = firstMs;
    for (let tries = 1; tries < 3 && fastest >= 2000; tries++) {
      const again = await open(url, 'dark');
      fastest = Math.min(fastest, again.ms);
      await again.page.close();
    }
    return fastest;
  }

  it('draws a one-hour session in under two seconds, offline and without errors', async () => {
    const session = syntheticSession();
    expect(session.steps.length).toBeGreaterThan(1000);
    const url = write('hour', session);
    const { page, requests, errors, ms } = await open(url, 'dark');
    expect(await fastestDraw(url, ms)).toBeLessThan(2000);
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
    // Long sessions start with turns folded; expanding all shows every step.
    const folded = await rows(page);
    await page.getByRole('button', { name: 'Expand all' }).click();
    expect(await rows(page)).toBeGreaterThan(folded);
    expect(await rows(page)).toBe(session.steps.length);
    await page.close();
  }, 60_000);

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

  it.each([
    'codex/codex-0.50-test-fix/rollout-2026-10-28T14-03-12-0199c8a1-7f2e-7b31-9a4d-3c2b1a0f9e8d.jsonl',
    'gemini/gemini-0.11-test-fix/session-2026-10-28T14-03-5f1e2d3c.json',
    'opencode/opencode-0.15-test-fix/storage/session/4b825dc642cb6eb9a060e54bf8d69288fbee4904/ses_5a1b2c3d4e5fXYZabcdefghij.json',
  ])('draws a session from another agent: %s', async (fixture) => {
    const file = detectAgentFile(path.resolve(__dirname, '../../fixtures', fixture));
    if (!file) throw new Error(`not an agent file: ${fixture}`);
    const { page, errors, requests } = await open(
      write(file.agent, importAgentFile(file, { detail: true })),
    );
    expect(errors).toEqual([]);
    expect(requests).toEqual([]);
    const agentName = { codex: 'Codex CLI', gemini: 'Gemini CLI', opencode: 'OpenCode' }[
      file.agent
    ];
    expect(await page.locator('.meta').textContent()).toContain(agentName);
    expect(await page.locator('.rows .fail').count()).toBe(1);
    expect(await page.locator('.chip', { hasText: 'Rework' }).count()).toBe(1);
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
