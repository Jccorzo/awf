import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { main } from '../src/cli/main';
import {
  colorMode,
  renderStatus,
  shortDuration,
  type StatusParts,
} from '../src/cli/commands/statusline';
import { captureIo } from './helpers';

const FIXTURE = path.resolve(__dirname, '../fixtures/claude-code/cc-2.1.312-test-fix');
const ID = '4045beec-4abe-4901-822b-0e34d3c9fa14';
const now = Date.parse('2026-10-29T12:00:00Z');

/** A fresh awf home and a copy of the fixture's transcript in Claude Code's layout. */
function setup() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'awf-statusline-'));
  const home = path.join(root, '.awf');
  const projectDir = path.join(root, 'projects', '-tmp-demo');
  mkdirSync(projectDir, { recursive: true });
  const transcript = path.join(projectDir, `${ID}.jsonl`);
  cpSync(path.join(FIXTURE, `${ID}.jsonl`), transcript);
  const payload = JSON.stringify({
    session_id: ID,
    transcript_path: transcript,
    cwd: '/tmp/demo',
    model: { id: 'claude-opus-5-5', display_name: 'Opus' },
  });
  return { root, home, transcript, payload, cacheDir: path.join(home, 'cache', 'statusline') };
}

async function statusline(
  input: string | undefined,
  env: Record<string, string | undefined>,
  ...args: string[]
) {
  const io = { ...captureIo(), input: () => input };
  const code = await main(['statusline', ...args], io, env, '/', now);
  return { code, out: io.stdout, err: io.stderr };
}

describe('awf statusline', () => {
  it("prints the top phases, failed runs and rework from Claude Code's JSON", async () => {
    const { home, payload } = setup();
    const run = await statusline(payload, { AWF_HOME: home, NO_COLOR: '1' });
    expect(run.code).toBe(0);
    // Tests first, then the top phases; shares are of the working time. Rework (1.8s) isn't
    // among the phases shown, so it comes as a time at the end.
    expect(run.out).toEqual(['tests 20% · plan 35% · explore 27% · 1 failed · rework 2s']);
  });

  it('pins other phases with --pin, or none', async () => {
    const { home, payload } = setup();
    const env = { AWF_HOME: home, NO_COLOR: '1' };
    expect((await statusline(payload, env, '--pin', 'none')).out).toEqual([
      'plan 35% · explore 27% · tests 20% · 1 failed · rework 2s',
    ]);
    // Short names work too, a pinned phase with no time shows 0%, and unknown names are skipped.
    expect((await statusline(payload, env, '--pin', 'build,tests,nope')).out).toEqual([
      'build 0% · tests 20% · plan 35% · 1 failed · rework 2s',
    ]);
    expect((await statusline(payload, env, '--pin', 'explore')).out).toEqual([
      'explore 27% · plan 35% · tests 20% · 1 failed · rework 2s',
    ]);
  });

  it("doesn't repeat rework at the end when it is one of the top three", async () => {
    const { home, payload } = setup();
    const bgAgent = path.resolve(__dirname, '../fixtures/claude-code/cc-2.1.312-bg-agent');
    const id = '8c4861e7-317a-454e-890d-dc06d3b1c856';
    const run = await statusline(
      JSON.stringify({
        ...JSON.parse(payload),
        session_id: id,
        transcript_path: path.join(bgAgent, `${id}.jsonl`),
      }),
      { AWF_HOME: home, NO_COLOR: '1' },
    );
    expect(run.out).toEqual(['tests 11% · plan 67% · rework 11% · 1 failed']);
  });

  it('colours phase names like the report, in 24-bit or 256 colours', async () => {
    const { home, payload } = setup();
    const truecolor = await statusline(payload, { AWF_HOME: home, COLORTERM: 'truecolor' });
    expect(truecolor.out[0]).toContain('\x1b[38;2;201;133;0mtests\x1b[39m 20%');
    expect(truecolor.out[0]).toContain('\x1b[38;2;208;59;59m1 failed\x1b[39m');
    const xterm = await statusline(payload, { AWF_HOME: home });
    // #c98500 is xterm's 172 (215, 135, 0).
    expect(xterm.out[0]).toContain('\x1b[38;5;172mtests\x1b[39m 20%');
    expect(colorMode({ NO_COLOR: '1', COLORTERM: 'truecolor' })).toBe('none');
  });

  it('merges the recorder events when they exist', async () => {
    const { home, payload } = setup();
    const plain = JSON.parse((await statusline(payload, { AWF_HOME: home }, '--json')).out[0]!);
    expect(plain.sources).toEqual(['transcript']);
    mkdirSync(path.join(home, 'events'), { recursive: true });
    cpSync(path.join(FIXTURE, 'events', `${ID}.jsonl`), path.join(home, 'events', `${ID}.jsonl`));
    const merged = JSON.parse((await statusline(payload, { AWF_HOME: home }, '--json')).out[0]!);
    expect(merged.sources).toEqual(['recorder', 'transcript']);
    expect(merged).toMatchObject({ id: ID, failed: 1, line: expect.stringContaining('tests') });
    expect(merged.phases[0]).toMatchObject({ phase: 'tests', name: 'tests', pinned: true });
    expect(merged.phases[1]).toMatchObject({ phase: 'planning', name: 'plan' });
  });

  it('caches the line until the transcript or the events change', async () => {
    const { home, payload, transcript, cacheDir } = setup();
    const env = { AWF_HOME: home, NO_COLOR: '1' };
    const first = (await statusline(payload, env)).out;
    const file = path.join(cacheDir, `${ID}.json`);
    const cached = JSON.parse(readFileSync(file, 'utf8'));
    expect(cached.line).toBe(first[0]);

    // Same key: the cached line is printed without reading the session.
    writeFileSync(file, JSON.stringify({ ...cached, line: 'from the cache' }));
    expect((await statusline(payload, env)).out).toEqual(['from the cache']);

    // The transcript grew: the key no longer matches.
    appendFileSync(transcript, '\n');
    expect((await statusline(payload, env)).out).toEqual(first);

    writeFileSync(file, JSON.stringify({ ...cached, line: 'stale' }));
    mkdirSync(path.join(home, 'events'), { recursive: true });
    cpSync(path.join(FIXTURE, 'events', `${ID}.jsonl`), path.join(home, 'events', `${ID}.jsonl`));
    expect((await statusline(payload, env)).out[0]).not.toBe('stale');

    // --json always reads the session.
    writeFileSync(file, JSON.stringify({ ...JSON.parse(readFileSync(file, 'utf8')), line: 'x' }));
    expect(JSON.parse((await statusline(payload, env, '--json')).out[0]!).line).not.toBe('x');
  });

  it('deletes cached lines of sessions untouched for a month, and purge removes the cache', async () => {
    const { home, payload, cacheDir } = setup();
    mkdirSync(cacheDir, { recursive: true });
    const old = path.join(cacheDir, 'old-session.json');
    writeFileSync(old, '{}');
    const longAgo = new Date(now - 40 * 86_400_000);
    utimesSync(old, longAgo, longAgo);
    await statusline(payload, { AWF_HOME: home });
    expect(readdirSync(cacheDir)).toEqual([`${ID}.json`]);

    const io = captureIo();
    expect(await main(['purge', '--yes'], io, { AWF_HOME: home, HOME: '/nowhere' })).toBe(0);
    expect(existsSync(home)).toBe(false);
  });

  it('prints nothing and exits 0 on anything it cannot read', async () => {
    const { home, root } = setup();
    const env = { AWF_HOME: home };
    const garbage = path.join(root, 'garbage.jsonl');
    writeFileSync(garbage, 'not json\n{"type":"nonsense"}\n');
    const inputs = [
      '',
      'not json',
      'null',
      '[]',
      '42',
      '{}',
      JSON.stringify({ transcript_path: 7 }),
      JSON.stringify({ transcript_path: path.join(root, 'missing.jsonl') }),
      JSON.stringify({ transcript_path: path.join(root, 'notes.txt') }),
      JSON.stringify({ transcript_path: root + '.jsonl' }),
      JSON.stringify({ session_id: 'g', transcript_path: garbage }),
    ];
    for (const input of inputs) {
      const run = await statusline(input, env);
      expect({ input, code: run.code, out: run.out, err: run.err }).toEqual({
        input,
        code: 0,
        out: [],
        err: [],
      });
    }
    const debug = await statusline('not json', { ...env, AWF_DEBUG: '1' });
    expect(debug.out).toEqual([]);
    expect(debug.err[0]).toMatch(/^awf statusline: /);
  });

  it('explains itself when run in a terminal', async () => {
    const run = await statusline(undefined, { AWF_HOME: '/nowhere' });
    expect(run).toMatchObject({ code: 0, out: [] });
    expect(run.err[0]).toContain('stdin');
    const help = captureIo();
    expect(await main(['statusline', '--help'], help)).toBe(0);
    expect(help.stdout[0]).toContain('"statusLine"');
  });
});

describe('the status line format', () => {
  const parts = (over: Partial<StatusParts> = {}): StatusParts => ({
    phases: [
      { phase: 'tests', ms: 9_000_000, share: 0.362 },
      { phase: 'exploring', ms: 7_200_000, share: 0.29 },
      { phase: 'running', ms: 3_700_000, share: 0.1496 },
    ],
    failed: 15,
    reworkMs: 134_000,
    workingMs: 25_000_000,
    ...over,
  });

  it('shows three phases, failed runs and rework time', () => {
    expect(renderStatus(parts(), 'none')).toBe(
      'tests 36% · explore 29% · scripts 15% · 15 failed · rework 2m',
    );
    expect(renderStatus(parts({ failed: 0, reworkMs: 0 }), 'none')).toBe(
      'tests 36% · explore 29% · scripts 15%',
    );
    expect(renderStatus(parts({ phases: [] }), 'none')).toBe('');
  });

  it('drops the third phase rather than run long, and shows tiny shares as <1%', () => {
    const long = parts({
      phases: [
        { phase: 'unclassified', ms: 3, share: 0.34 },
        { phase: 'writing-tests', ms: 2, share: 0.33 },
        { phase: 'exploring', ms: 1, share: 0.004 },
      ],
      failed: 120,
      reworkMs: 3_540_000,
    });
    expect(renderStatus(long, 'none')).toBe(
      'unclassified 34% · test code 33% · 120 failed · rework 59m',
    );
    expect(renderStatus(parts({ phases: [long.phases[2]!], failed: 0 }), 'none')).toBe(
      'explore <1% · rework 2m',
    );
  });

  it('keeps pinned phases when the line runs long, dropping the last top phase', () => {
    const long = parts({
      phases: [
        { phase: 'tests', ms: 0, share: 0, pinned: true },
        { phase: 'unclassified', ms: 3, share: 0.34 },
        { phase: 'writing-tests', ms: 2, share: 0.33 },
      ],
      failed: 120,
      reworkMs: 3_540_000,
    });
    expect(renderStatus(long, 'none')).toBe(
      'tests 0% · unclassified 34% · 120 failed · rework 59m',
    );
  });

  it('writes durations short', () => {
    expect([45_000, 134_000, 3_540_000, 3_900_000, 37_000_000].map(shortDuration)).toEqual([
      '45s',
      '2m',
      '59m',
      '1h05m',
      '10h17m',
    ]);
  });
});
