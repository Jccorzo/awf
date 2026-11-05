// Opens a dashboard in headless Chromium: it draws offline without errors, and its filters change
// what it shows. Skipped when Playwright's Chromium isn't installed, like the report's browser test.
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Browser, chromium } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { analyze } from '../../src/analyze/summary';
import { memoryFiles } from '../../src/classify/resolve';
import { buildDashData } from '../../src/dash/data';
import { renderDashHtml } from '../../src/dash/html';
import { importClaudeCodeTranscript } from '../../src/importers/claude-code/import';
import type { Session } from '../../src/model/types';

const installed = (() => {
  try {
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
})();

const TEST_FIX = path.resolve(
  __dirname,
  '../../fixtures/claude-code/cc-2.1.312-test-fix/4045beec-4abe-4901-822b-0e34d3c9fa14.jsonl',
);
const HOME = '/Users/user';

function sessionAt(cwd: string, days: number, id: string): Session {
  const base = importClaudeCodeTranscript(TEST_FIX);
  const shift = days * 86_400_000;
  return {
    ...base,
    id,
    cwd,
    startMs: base.startMs + shift,
    endMs: base.endMs + shift,
    steps: base.steps.map((s) => ({ ...s, startMs: s.startMs + shift, endMs: s.endMs + shift })),
  };
}

function writeDash(sessions: Session[]): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'awf-dash-'));
  const data = buildDashData(
    sessions.map((session) => ({
      session,
      summary: analyze(session, { files: memoryFiles({}) }).summary,
    })),
    { home: HOME, now: Date.parse('2026-11-05T12:00:00Z'), version: '0.1.0', isRepo: () => false },
  );
  const file = path.join(dir, 'dash.html');
  writeFileSync(file, renderDashHtml(data));
  return pathToFileURL(file).href;
}

describe.skipIf(!installed)('dashboard in a browser', () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await chromium.launch();
  }, 60_000);
  afterAll(async () => {
    await browser?.close();
  });

  const url = writeDash([
    sessionAt(`${HOME}/code/shop`, 0, 'aaaaaaaa-1'),
    sessionAt(`${HOME}/code/shop`, 3, 'bbbbbbbb-2'),
    sessionAt(`${HOME}/code/api`, 9, 'cccccccc-3'),
  ]);

  async function open(width = 1360, colorScheme: 'light' | 'dark' = 'light') {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', (r) => {
      if (r.url() !== url) requests.push(r.url());
    });
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForSelector('body[data-ready="1"]');
    return { page, requests, errors };
  }

  it('draws every session offline, without errors, leaving out waiting at first', async () => {
    const { page, requests, errors } = await open(1360, 'dark');
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
    expect(await page.locator('#sessions tbody tr').count()).toBe(3);
    expect(await page.locator('#projects .prow').count()).toBe(2);
    expect(await page.locator('#over-time .col').count()).toBeGreaterThan(1);
    const waiting = page.locator('.chip', { hasText: 'Waiting on you' });
    expect(await waiting.getAttribute('aria-pressed')).toBe('false');
    expect(await page.locator('.take').textContent()).toMatch(/over 3 sessions/);
    await page.close();
  }, 30_000);

  it('picks phases, a project and a period, and sorts and searches the table', async () => {
    const { page, errors } = await open();
    await page.getByRole('button', { name: 'Only waiting on you' }).click();
    expect(await page.locator('#phases .brow').count()).toBe(1);
    expect(await page.locator('#phases .brow').textContent()).toContain('Waiting on you');
    await page.getByRole('button', { name: 'None' }).click();
    expect(await page.locator('.take').textContent()).toContain('Pick at least one phase');
    expect(await page.locator('#phases .brow').count()).toBe(0);
    await page.locator('.chip', { hasText: 'Running tests' }).click();
    expect(await page.locator('#phases .brow').count()).toBe(1);

    await page.locator('#projects .prow', { hasText: 'api' }).click();
    expect(await page.locator('#sessions tbody tr').count()).toBe(1);
    expect(await page.locator('#f-project').inputValue()).not.toBe('-1');
    await page.getByRole('button', { name: 'Show every project' }).click();
    expect(await page.locator('#sessions tbody tr').count()).toBe(3);

    // The last 7 days end on the newest session's day (day 9): days 3 to 9.
    await page.locator('#f-range').selectOption('7');
    expect(await page.locator('#sessions tbody tr').count()).toBe(2);
    await page.locator('#f-range').selectOption('all');

    await page.getByRole('button', { name: 'Session', exact: true }).click();
    expect(await page.locator('#sessions tbody tr td:first-child').allTextContents()).toEqual([
      'aaaaaaaa',
      'bbbbbbbb',
      'cccccccc',
    ]);
    await page.getByRole('searchbox').fill('cccc');
    expect(await page.locator('#sessions tbody tr').count()).toBe(1);

    await page.getByRole('button', { name: 'Reset filters' }).click();
    expect(
      await page.locator('.chip', { hasText: 'Waiting on you' }).getAttribute('aria-pressed'),
    ).toBe('false');
    expect(errors).toEqual([]);
    await page.close();
  }, 30_000);

  it('fits a phone screen without sideways scrolling', async () => {
    const { page } = await open(390);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    await page.close();
  }, 30_000);
});
