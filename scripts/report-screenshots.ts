// Renders every fixture's report (and a shared copy, and a long synthetic session) with Playwright,
// in light and dark mode at laptop and phone width, into test-results/screenshots/. Prints any
// console error, network request or horizontal scroll it sees.
// Usage: pnpm report:screenshots
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { analyze } from '../src/analyze/summary';
import { detectAgentFile } from '../src/importers/agents';
import { memoryFiles } from '../src/classify/resolve';
import { main } from '../src/cli/main';
import { buildReportData } from '../src/report/data';
import { renderReportHtml } from '../src/report/html';
import { syntheticSession } from '../test/report/synthetic';

const root = process.cwd();
const outDir = path.join(root, 'test-results/screenshots');
const work = mkdtempSync(path.join(os.tmpdir(), 'awf-shots-'));
mkdirSync(outDir, { recursive: true });

const silent = { out: () => {}, err: (text: string) => console.error(text) };
const reports: Array<{ name: string; file: string }> = [];
const fixtures = path.join(root, 'fixtures/claude-code');
for (const name of readdirSync(fixtures).sort()) {
  const transcript = readdirSync(path.join(fixtures, name)).find((f) => f.endsWith('.jsonl'));
  if (!transcript) continue;
  const input = path.join(fixtures, name, transcript);
  for (const share of [false, true]) {
    if (share && name !== 'cc-2.1.312-test-fix') continue;
    const file = path.join(work, `${name}${share ? '-share' : ''}.html`);
    const env = { ...process.env, AWF_HOME: path.join(work, 'home'), HOME: os.homedir() };
    const code = await main(
      ['report', input, '--out', file, ...(share ? ['--share'] : [])],
      silent,
      env,
      root,
    );
    if (code !== 0) throw new Error(`awf report failed for ${name}`);
    reports.push({ name: `${name}${share ? '-share' : ''}`, file });
  }
}
for (const fixture of [
  'codex/codex-0.50-test-fix/rollout-2026-10-28T14-03-12-0199c8a1-7f2e-7b31-9a4d-3c2b1a0f9e8d.jsonl',
  'gemini/gemini-0.11-test-fix/session-2026-10-28T14-03-5f1e2d3c.json',
  'opencode/opencode-0.15-test-fix/storage/session/4b825dc642cb6eb9a060e54bf8d69288fbee4904/ses_5a1b2c3d4e5fXYZabcdefghij.json',
]) {
  const input = path.join(root, 'fixtures', fixture);
  const agent = detectAgentFile(input);
  if (!agent) throw new Error(`not an agent file: ${fixture}`);
  const file = path.join(work, `${agent.agent}.html`);
  const env = { ...process.env, AWF_HOME: path.join(work, 'home'), HOME: os.homedir() };
  if ((await main(['report', input, '--out', file], silent, env, root)) !== 0)
    throw new Error(`awf report failed for ${fixture}`);
  reports.push({ name: path.dirname(fixture).split('/')[1] ?? agent.agent, file });
}
const synthetic = path.join(work, 'synthetic-1h.html');
const analysis = analyze(syntheticSession(), { files: memoryFiles({}) });
writeFileSync(synthetic, renderReportHtml(buildReportData(analysis, { home: os.homedir() })));
reports.push({ name: 'synthetic-1h', file: synthetic });

const browser = await chromium.launch();
const problems: string[] = [];
try {
  for (const report of reports) {
    for (const colorScheme of ['light', 'dark'] as const) {
      for (const [label, width, height] of [
        ['laptop', 1440, 900],
        ['phone', 390, 844],
      ] as const) {
        const page = await browser.newPage({ viewport: { width, height }, colorScheme });
        const url = pathToFileURL(report.file).href;
        page.on('console', (m) => {
          if (m.type() === 'error') problems.push(`${report.name}: console error: ${m.text()}`);
        });
        page.on('pageerror', (e) => problems.push(`${report.name}: page error: ${e.message}`));
        page.on('request', (r) => {
          if (r.url() !== url) problems.push(`${report.name}: network request to ${r.url()}`);
        });
        await page.goto(url);
        await page.waitForSelector('body[data-ready="1"]');
        const scroll = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        if (scroll > 0) problems.push(`${report.name} ${label}: scrolls sideways by ${scroll}px`);
        const base = path.join(outDir, `${report.name}-${colorScheme}-${label}`);
        const full = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.screenshot({
          path: `${base}.png`,
          fullPage: true,
          clip: { x: 0, y: 0, width, height: Math.min(full, 4000) },
        });
        // Open the slowest step's details; on the laptop also hover a bar near the top.
        const slow = page.locator('.why .link').first();
        if (await slow.count()) {
          await slow.click();
          await page.screenshot({ path: `${base}-detail.png` });
        }
        if (label === 'laptop') {
          await page.evaluate(() => window.scrollTo(0, 0));
          const bar = page.locator('.row .track').nth(2);
          if (await bar.count()) {
            await bar.hover();
            await page.screenshot({ path: `${base}-hover.png` });
          }
        }
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
console.log(`Wrote ${reports.length * 10} screenshots to ${path.relative(root, outDir)}/`);
for (const problem of problems) console.log(`problem: ${problem}`);
process.exitCode = problems.length ? 1 : 0;
