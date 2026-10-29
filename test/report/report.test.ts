import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/analyze/summary';
import { memoryFiles } from '../../src/classify/resolve';
import { main } from '../../src/cli/main';
import { importClaudeCodeTranscript } from '../../src/importers/claude-code/import';
import type { Session } from '../../src/model/types';
import { buildReportData, type ReportData } from '../../src/report/data';
import { renderReportHtml, scriptJson } from '../../src/report/html';
import { captureIo } from '../helpers';
import { syntheticSession } from './synthetic';

const FIXTURES = path.resolve(__dirname, '../../fixtures/claude-code');
const TEST_FIX = path.join(
  FIXTURES,
  'cc-2.1.312-test-fix/4045beec-4abe-4901-822b-0e34d3c9fa14.jsonl',
);

function fixtures(): Array<[string, string]> {
  return readdirSync(FIXTURES).map((name) => {
    const file = readdirSync(path.join(FIXTURES, name)).find((f) => f.endsWith('.jsonl')) as string;
    return [name, path.join(FIXTURES, name, file)];
  });
}

const report = (session: Session, share = false) =>
  buildReportData(analyze(session, { files: memoryFiles({}) }), {
    share,
    home: '/Users/user',
    now: 0,
  });

/** The page without the embedded session data: what the browser runs and loads. */
const pageOnly = (html: string) =>
  html.replace(/<script type="application\/json" id="awf-data">[\s\S]*?<\/script>/, '');

const embedded = (html: string): ReportData => {
  const json = /<script type="application\/json" id="awf-data">([\s\S]*?)<\/script>/.exec(
    html,
  )?.[1];
  return JSON.parse(json ?? 'null') as ReportData;
};

describe('report data', () => {
  it.each(fixtures())(
    '%s: parents come first, phases add up, the timeline covers the session',
    (_, file) => {
      const data = report(importClaudeCodeTranscript(file));
      for (const step of data.steps) {
        expect(step.i).toBe(data.steps.indexOf(step));
        if (step.p >= 0) {
          expect(step.p).toBeLessThan(step.i);
          expect(step.depth).toBe((data.steps[step.p]?.depth ?? 0) + 1);
        }
      }
      expect(data.phases.reduce((n, p) => n + p.ms, 0)).toBe(data.session.totalMs);
      let cursor = 0;
      for (const [s, e] of data.timeline) {
        expect(s).toBe(cursor);
        expect(e).toBeGreaterThan(s);
        cursor = e;
      }
      expect(cursor).toBe(data.session.totalMs);
      // The unclassified hint splits the unclassified time; it never adds up to more.
      const unclassifiedMs = data.phases.find((p) => p.id === 'unclassified')?.ms ?? 0;
      expect(
        data.unclassified.reduce((n, u) => n + u.ms, 0) + data.unclassifiedModelMs,
      ).toBeLessThanOrEqual(unclassifiedMs);
      // Timeline stretches add up to the same phase totals as the summary.
      for (const phase of data.phases) {
        const ms = data.timeline
          .filter(([, , p]) => p === phase.id)
          .reduce((n, [s, e]) => n + e - s, 0);
        expect(ms, phase.id).toBe(phase.ms);
      }
    },
  );

  it('marks the slowest steps among the ones that held the agent up', () => {
    const data = report(syntheticSession());
    expect(data.slowest).toHaveLength(3);
    for (const i of data.slowest) {
      const step = data.steps[i];
      expect(step?.container).toBe(false);
      expect(step?.kind).not.toBe('background');
      expect(step?.flags).not.toContain('background');
    }
    const span = (i: number) => (data.steps[i]?.e ?? 0) - (data.steps[i]?.s ?? 0);
    expect(span(data.slowest[0] as number)).toBeGreaterThanOrEqual(span(data.slowest[2] as number));
  });

  it('names the programs behind unclassified time, and counts the model time apart', () => {
    const start = 0;
    const session: Session = {
      id: 'u',
      agent: 'claude-code',
      sources: ['transcript'],
      startMs: start,
      endMs: 10_000,
      steps: [
        { id: 't', parentId: null, kind: 'turn', startMs: 0, endMs: 10_000, flags: [] },
        {
          id: 'm',
          parentId: 't',
          kind: 'model',
          startMs: 0,
          endMs: 6_000,
          flags: [],
          produces: ['b'],
        },
        {
          id: 'b',
          parentId: 't',
          kind: 'tool',
          tool: 'Bash',
          command: 'cd app && ./tools/frobnicate --all',
          startMs: 6_000,
          endMs: 10_000,
          flags: [],
          ok: true,
        },
      ],
    };
    expect(report(session).unclassified).toEqual([{ name: 'frobnicate', ms: 4_000 }]);
    expect(report(session).unclassifiedModelMs).toBe(6_000);
  });

  it('shortens connectors named by a UUID', () => {
    const session: Session = {
      id: 'c',
      agent: 'claude-code',
      sources: ['transcript'],
      startMs: 0,
      endMs: 1_000,
      steps: [
        {
          id: 'x',
          parentId: null,
          kind: 'tool',
          tool: 'mcp__00000000-0000-5000-8000-000000000001__read',
          startMs: 0,
          endMs: 1_000,
          flags: [],
        },
      ],
    };
    expect(report(session).steps[0]?.label).toBe('00000000… · read');
    expect(report(session, true).steps[0]?.label).toBe('00000000…');
  });

  it('keeps commands, files, output, the task and the folder out of a shared report', () => {
    const full = report(importClaudeCodeTranscript(TEST_FIX, { detail: true }));
    expect(full.steps.some((s) => s.text?.includes('npm test'))).toBe(true);
    expect(full.steps.some((s) => s.output)).toBe(true);

    const shared = report(importClaudeCodeTranscript(TEST_FIX, { detail: true }), true);
    const json = JSON.stringify(shared);
    for (const secret of ['npm test 2>&1', 'sum.js', 'scratchpad', 'demo'])
      expect(json).not.toContain(secret);
    expect(shared.session.title).toBeUndefined();
    expect(shared.session.cwd).toBeUndefined();
    for (const step of shared.steps) {
      expect(step.output).toBeUndefined();
      expect(step.files).toBeUndefined();
      expect(step.description).toBeUndefined();
      if (step.text) expect(step.text).toMatch(/^→ /);
    }
    expect(shared.rework[0]?.check).toBe('tests:npm');
    expect(shared.steps.some((s) => s.tool === 'Bash')).toBe(true);
  });
});

describe('report html', () => {
  it('is one self-contained file: no external scripts, styles, images or fonts', () => {
    const html = renderReportHtml(report(importClaudeCodeTranscript(TEST_FIX)));
    const page = pageOnly(html);
    expect(page).toMatch(/^<!doctype html>/);
    expect(page).toContain("default-src 'none'");
    expect(page).not.toMatch(/<script[^>]+src=/i);
    expect(page).not.toMatch(/<link[^>]+rel=["']?stylesheet/i);
    expect(page).not.toMatch(/@import|url\(\s*["']?(https?:)?\/\//i);
    expect(page).not.toMatch(/(src|href)\s*=\s*["']?(https?:)?\/\//i);
    expect(page).not.toMatch(/https?:\/\//);
    expect(page.match(/<script/g)).toHaveLength(1);
    expect(html.match(/<\/script>/g)).toHaveLength(2);
  });

  it('keeps text from the session from closing the script or injecting markup', () => {
    const session = syntheticSession({ turns: 1 });
    const evil = 'echo "</script><script>alert(1)</script><!-- \u2028 & done"';
    const bash = session.steps.find((s) => s.tool === 'Bash');
    if (!bash) throw new Error('no Bash step');
    bash.command = evil;
    session.title = '<img src=x onerror=alert(1)> title';
    const html = renderReportHtml(report(session));
    expect(html).not.toContain('<script>alert(1)');
    expect(html).not.toContain('<img src=x');
    expect(html.match(/<\/script>/g)).toHaveLength(2);
    const data = embedded(html);
    expect(data.steps.some((s) => s.text === evil)).toBe(true);
    expect(data.session.title).toBe(session.title);
    expect(html).toContain('<title>awf · &#60;img src=x onerror=alert(1)&#62; title</title>');
  });

  it('escapes the characters that end a script or a line inside it', () => {
    expect(scriptJson({ a: '</script>', b: '<!--', c: '\u2028\u2029', d: '&' })).toBe(
      '{"a":"\\u003c/script\\u003e","b":"\\u003c!--","c":"\\u2028\\u2029","d":"\\u0026"}',
    );
  });
});

describe('awf report', () => {
  const home = mkdtempSync(path.join(os.tmpdir(), 'awf-report-'));
  const env = { AWF_HOME: home, AWF_CLAUDE_PROJECTS: path.join(home, 'none'), HOME: '/Users/user' };

  async function run(...argv: string[]) {
    const io = captureIo();
    const code = await main(argv, io, env, home, 0);
    return { code, out: io.stdout.join('\n'), err: io.stderr.join('\n') };
  }

  it('writes the report to ~/.awf/reports by default, or to --out', async () => {
    const byDefault = await run('report', TEST_FIX);
    expect(byDefault.code).toBe(0);
    const file = path.join(home, 'reports', '4045beec-4abe-4901-822b-0e34d3c9fa14.html');
    expect(existsSync(file)).toBe(true);
    expect(byDefault.out).toContain(`file://${file}`);
    expect(readFileSync(file, 'utf8')).toContain('npm test');

    const out = path.join(home, 'shared.html');
    const shared = await run('report', TEST_FIX, '--share', '--out', out);
    expect(shared.code).toBe(0);
    expect(shared.out).toContain('shareable');
    const html = readFileSync(out, 'utf8');
    expect(html).not.toContain('npm test 2>&1');
    expect(html).not.toContain('sum.js');
  });

  it('prints the report data with --json', async () => {
    const result = await run('report', TEST_FIX, '--json');
    expect(result.code).toBe(0);
    expect(JSON.parse(result.out)).toMatchObject({
      v: 1,
      share: false,
      counts: { reworkLoops: 1 },
    });
  });

  it('asks which session when none is given', async () => {
    const result = await run('report');
    expect(result.code).toBe(1);
    expect(result.err).toContain('which session?');
  });
});
