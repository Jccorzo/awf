import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/analyze/summary';
import { PHASES } from '../../src/classify/phases';
import { memoryFiles } from '../../src/classify/resolve';
import { buildDashData, projectRoot } from '../../src/dash/data';
import { renderDashHtml } from '../../src/dash/html';
import { importClaudeCodeTranscript } from '../../src/importers/claude-code/import';
import type { Session } from '../../src/model/types';

const TEST_FIX = path.resolve(
  __dirname,
  '../../fixtures/claude-code/cc-2.1.312-test-fix/4045beec-4abe-4901-822b-0e34d3c9fa14.jsonl',
);
const HOME = '/Users/user';
const REPOS = new Set([`${HOME}/code/shop`, `${HOME}/work/api`, `${HOME}/code/api`]);
const isRepo = (dir: string) => REPOS.has(dir);

/** The fixture session, moved to another folder and day. */
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
const analyzed = (sessions: Session[]) =>
  sessions.map((session) => ({
    session,
    summary: analyze(session, { files: memoryFiles({}) }).summary,
  }));

describe('projectRoot', () => {
  it('walks up to the repository, and stops at your home', () => {
    expect(projectRoot(`${HOME}/code/shop/web/src`, HOME, isRepo)).toBe(`${HOME}/code/shop`);
    expect(projectRoot(`${HOME}/notes/today`, HOME, isRepo)).toBe(`${HOME}/notes/today`);
    expect(projectRoot(HOME, HOME, isRepo)).toBe(HOME);
  });

  it('counts every temporary folder as one project', () => {
    expect(projectRoot('/private/tmp/claude-1/x', HOME, isRepo)).toBe('/tmp');
    expect(projectRoot('/tmp/demo', HOME, isRepo)).toBe('/tmp');
    expect(projectRoot('/var/folders/ab/T/run', HOME, isRepo)).toBe('/tmp');
    expect(projectRoot(undefined, HOME, isRepo)).toBe('');
  });
});

describe('buildDashData', () => {
  const data = buildDashData(
    analyzed([
      sessionAt(`${HOME}/code/api/server`, 2, 'c'),
      sessionAt(`${HOME}/code/shop/web`, 0, 'a'),
      sessionAt(`${HOME}/work/api`, 1, 'b'),
      sessionAt('/private/tmp/scratch', 3, 'd'),
    ]),
    { home: HOME, now: Date.parse('2026-11-05T12:00:00Z'), version: '9.9.9', isRepo },
  );

  it('lists sessions oldest first, with their time in every phase', () => {
    expect(data.sessions.map((s) => s.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(data.phases.map((p) => p.id)).toEqual(PHASES.map((p) => p.id));
    const one = analyze(sessionAt(`${HOME}/code/shop/web`, 0, 'a'), { files: memoryFiles({}) });
    const first = data.sessions[0];
    expect(first?.ms).toEqual(
      PHASES.map((p) => Math.round(one.summary.phases.find((l) => l.phase === p.id)?.ms ?? 0)),
    );
    expect(first?.ms.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    expect(first).toMatchObject({ folder: '~/code/shop/web', agent: 'claude-code', toolCalls: 5 });
    expect(data).toMatchObject({ v: 1, version: '9.9.9' });
  });

  it("groups sessions by repository, naming two with one name by their parents' too", () => {
    const names = data.sessions.map((s) => data.projects[s.project]);
    expect(names).toEqual([
      { name: 'shop', path: '~/code/shop' },
      { name: 'work/api', path: '~/work/api' },
      { name: 'code/api', path: '~/code/api' },
      { name: 'temporary folders', path: '/tmp' },
    ]);
  });

  it('keeps commands, files and output out of the page', () => {
    const html = renderDashHtml(data);
    expect(html).toContain('id="awf-dash"');
    expect(html).not.toContain('npm test');
    expect(html).not.toContain('sum.js');
    expect(html).not.toMatch(/<script[^>]+src=/);
  });
});
