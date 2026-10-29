// The Codex CLI, Gemini CLI and OpenCode importers, on one hand-made session each: the same task
// (a failing test, a look at the code, one edit, the test passing) in each agent's own log format.
import { cpSync, mkdirSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/analyze/summary';
import { memoryFiles } from '../../src/classify/resolve';
import { main } from '../../src/cli/main';
import { detectAgentFile, listAgentSessions } from '../../src/importers/agents';
import { importCodexRollout } from '../../src/importers/codex/import';
import { importGeminiChat } from '../../src/importers/gemini/import';
import { importOpenCodeSession } from '../../src/importers/opencode/import';
import type { Session } from '../../src/model/types';
import { captureIo } from '../helpers';

const FIXTURES = path.resolve(__dirname, '../../fixtures');
const CODEX = path.join(
  FIXTURES,
  'codex/codex-0.50-test-fix/rollout-2026-10-28T14-03-12-0199c8a1-7f2e-7b31-9a4d-3c2b1a0f9e8d.jsonl',
);
const GEMINI = path.join(
  FIXTURES,
  'gemini/gemini-0.11-test-fix/session-2026-10-28T14-03-5f1e2d3c.json',
);
const OPENCODE_STORAGE = path.join(FIXTURES, 'opencode/opencode-0.15-test-fix/storage');
const OPENCODE = path.join(
  OPENCODE_STORAGE,
  'session/4b825dc642cb6eb9a060e54bf8d69288fbee4904/ses_5a1b2c3d4e5fXYZabcdefghij.json',
);

const tools = (s: Session) =>
  s.steps
    .filter((step) => step.kind === 'tool')
    .map((step) => [step.tool, step.command ?? step.files?.join(' ') ?? '', step.ok]);

function expectTheTask(session: Session) {
  const { summary } = analyze(session, { files: memoryFiles({}) });
  const line = (phase: string) => summary.phases.find((p) => p.phase === phase);
  expect(line('tests')).toMatchObject({ runs: 2, failed: 1 });
  expect(line('rework')).toMatchObject({ edits: 1, failures: 1 });
  expect(summary.rework[0]?.passedAtMs).toBeDefined();
  expect(summary.phases.reduce((n, p) => n + p.ms, 0)).toBe(summary.totalMs);
  return summary;
}

describe('Codex CLI', () => {
  it('reads a rollout: calls, exit codes, tokens and the turn', () => {
    const session = importCodexRollout(CODEX, { detail: true });
    expect(session).toMatchObject({
      id: '0199c8a1-7f2e-7b31-9a4d-3c2b1a0f9e8d',
      agent: 'codex',
      cwd: '/Users/user/demo',
      agentVersion: '0.50.0',
      title: 'The sum test fails. Fix it.',
    });
    expect(tools(session)).toEqual([
      ['Bash', 'npm test', false],
      ['Bash', "sed -n '1,40p' sum.js", true],
      ['Edit', 'sum.js', true],
      ['Bash', 'npm test', true],
    ]);
    const failed = session.steps.find((s) => s.tool === 'Bash' && s.ok === false);
    expect(failed).toMatchObject({ exitCode: 1, runMs: 1700 });
    expect(failed?.detail?.output).toContain('fail 1');
    const models = session.steps.filter((s) => s.kind === 'model');
    expect(models.every((m) => m.model === 'gpt-5-codex' && m.tokens)).toBe(true);
    expect(session.steps.filter((s) => s.kind === 'turn')).toHaveLength(1);
    expect(session.diagnostics?.unknownEntries).toEqual({});
    expectTheTask(session);
  });
});

describe('Gemini CLI', () => {
  it("reads a chat file, finding the project folder from Gemini's hash of it", () => {
    const session = importGeminiChat(GEMINI, { detail: true });
    expect(session).toMatchObject({
      id: '5f1e2d3c-8b7a-4c69-a5d4-e3f2a1b0c9d8',
      agent: 'gemini',
      cwd: '/Users/user/demo',
      title: 'The sum test fails. Fix it.',
    });
    expect(tools(session)).toEqual([
      ['Bash', 'npm test', false],
      ['Read', '/Users/user/demo/sum.js', true],
      ['Edit', '/Users/user/demo/sum.js', true],
      ['Bash', 'npm test', true],
    ]);
    expect(session.steps.find((s) => s.ok === false)?.exitCode).toBe(1);
    // The last reply has no tool call: it is answer time, up to when it was logged.
    expect(session.endMs).toBe(Date.parse('2026-10-28T14:03:42.300Z'));
    const summary = expectTheTask(session);
    expect(summary.phases.find((p) => p.phase === 'planning')?.ms).toBeGreaterThan(0);
  });
});

describe('OpenCode', () => {
  it('reads a session from its storage, with its subagent nested under the task call', () => {
    const session = importOpenCodeSession(OPENCODE, { detail: true });
    expect(session).toMatchObject({
      id: 'ses_5a1b2c3d4e5fXYZabcdefghij',
      agent: 'opencode',
      cwd: '/Users/user/demo',
      agentVersion: '0.15.0',
      title: 'Fix the failing sum test',
    });
    expect(tools(session)).toEqual([
      ['Bash', 'npm test', false],
      ['Agent', '', true],
      ['Grep', '', true],
      ['Read', '/Users/user/demo/sum.js', true],
      ['Edit', '/Users/user/demo/sum.js', true],
      ['Bash', 'npm test', true],
    ]);
    const call = session.steps.find((s) => s.tool === 'Agent');
    const sub = session.steps.find((s) => s.kind === 'subagent');
    expect(sub).toMatchObject({ parentId: call?.id, agentType: 'explore' });
    const inside = session.steps.filter((s) => s.parentId === sub?.id && s.kind === 'tool');
    expect(inside.map((s) => s.tool)).toEqual(['Grep', 'Read']);
    expectTheTask(session);
  });
});

describe('finding sessions', () => {
  const home = mkdtempSync(path.join(os.tmpdir(), 'awf-agents-'));
  const codexDay = path.join(home, 'codex', 'sessions', '2026', '10', '28');
  const geminiChats = path.join(home, 'gemini', 'tmp', 'abc', 'chats');
  mkdirSync(codexDay, { recursive: true });
  mkdirSync(geminiChats, { recursive: true });
  cpSync(CODEX, path.join(codexDay, path.basename(CODEX)));
  cpSync(GEMINI, path.join(geminiChats, path.basename(GEMINI)));
  const env = {
    HOME: home,
    AWF_HOME: path.join(home, '.awf'),
    AWF_CLAUDE_PROJECTS: path.join(home, 'none'),
    CODEX_HOME: path.join(home, 'codex'),
    AWF_GEMINI_DIR: path.join(home, 'gemini'),
    AWF_OPENCODE_STORAGE: OPENCODE_STORAGE,
  };

  it("lists each agent's sessions, leaving OpenCode subagent sessions to their parent", () => {
    const found = listAgentSessions(env).map((f) => [f.agent, f.id]);
    expect(found.sort()).toEqual([
      ['codex', '0199c8a1-7f2e-7b31-9a4d-3c2b1a0f9e8d'],
      ['gemini', '5f1e2d3c-8b7a-4c69-a5d4-e3f2a1b0c9d8'],
      ['opencode', 'ses_5a1b2c3d4e5fXYZabcdefghij'],
    ]);
  });

  it('knows which agent wrote a file it is given', () => {
    expect(detectAgentFile(CODEX)?.agent).toBe('codex');
    expect(detectAgentFile(GEMINI)?.agent).toBe('gemini');
    expect(detectAgentFile(OPENCODE)?.agent).toBe('opencode');
  });

  it('imports them, lists them, and reports on them by ID', async () => {
    const run = async (...argv: string[]) => {
      const io = captureIo();
      const code = await main(argv, io, env, home, Date.parse('2026-10-29T12:00:00Z'));
      return { code, out: io.stdout.join('\n') };
    };
    const imported = await run('import', '--json');
    expect(JSON.parse(imported.out)).toMatchObject({
      transcripts: 3,
      imported: 3,
      agents: { codex: 1, gemini: 1, opencode: 1 },
      errors: [],
    });
    const sessions = JSON.parse((await run('sessions', '--json')).out) as Array<{ id: string }>;
    expect(sessions.map((s) => s.id).sort()).toEqual([
      '0199c8a1-7f2e-7b31-9a4d-3c2b1a0f9e8d',
      '5f1e2d3c-8b7a-4c69-a5d4-e3f2a1b0c9d8',
      'ses_5a1b2c3d4e5fXYZabcdefghij',
    ]);
    const report = JSON.parse((await run('report', '0199c8a1', '--json')).out);
    expect(report.session.agent).toBe('codex');
    expect(report.counts).toMatchObject({ failures: 1, reworkLoops: 1 });
    const only = JSON.parse((await run('import', '--agent', 'gemini', '--dry-run', '--json')).out);
    expect(only.agents).toEqual({ gemini: 1 });
  });
});
