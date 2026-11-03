import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { fitLine, projectName, renderBoard, textWidth, truncate } from '../src/cli/board';
import {
  fillLine,
  liveLoop,
  liveOptions,
  newMemo,
  scan,
  type Terminal,
} from '../src/cli/commands/live';
import { main } from '../src/cli/main';
import { activeTranscripts } from '../src/store/sessions';
import { captureIo } from './helpers';

const FIXTURE = path.resolve(
  __dirname,
  '../fixtures/claude-code/cc-2.1.312-test-fix/4045beec-4abe-4901-822b-0e34d3c9fa14.jsonl',
);
const FIXTURE_ID = '4045beec-4abe-4901-822b-0e34d3c9fa14';
const FIXTURE_LINE = 'tests 20% · plan 35% · explore 27% · 1 failed · rework 2s';
const now = Date.parse('2026-10-29T12:00:00Z');
const MIN = 60_000;

type Entry = Record<string, unknown>;

const stamp = (ms: number) => new Date(ms).toISOString();
const promptAt = (ms: number, cwd: string, words: string): Entry => ({
  type: 'user',
  timestamp: stamp(ms),
  origin: { kind: 'human' },
  message: { role: 'user', content: words },
  cwd,
});
const callAt = (ms: number, id: string): Entry => ({
  type: 'assistant',
  timestamp: stamp(ms),
  message: {
    id: `m-${id}`,
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id, name: 'Bash', input: { command: 'npm test' } }],
  },
});
const endAt = (ms: number): Entry => ({
  type: 'system',
  subtype: 'turn_duration',
  timestamp: stamp(ms),
});

/** Claude Code's layout in a temp folder: projects/<folder>/<id>.jsonl, and an awf home. */
function setup() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'awf-live-'));
  const home = path.join(root, 'home');
  const projects = path.join(root, 'projects');
  const env: Record<string, string> = {
    AWF_CLAUDE_PROJECTS: projects,
    AWF_HOME: path.join(root, '.awf'),
    HOME: home,
    NO_COLOR: '1',
    COLUMNS: '200',
  };
  /** Writes a transcript last changed at `mtimeMs`; returns its path. */
  const write = (
    folder: string,
    id: string,
    entries: Array<Entry | string>,
    mtimeMs: number,
  ): string => {
    const dir = path.join(projects, folder);
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${id}.jsonl`);
    writeFileSync(
      file,
      entries.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n') + '\n',
    );
    utimesSync(file, new Date(mtimeMs), new Date(mtimeMs));
    return file;
  };
  /** Four sessions: one mid-turn, one ended, one whose subagent is busy, one too old. */
  const sessions = () => {
    const web = path.join(home, 'Documents', 'acme-billing', 'web');
    const deploys = path.join(home, 'Documents', 'deploys');
    write(
      'web',
      'aaaa',
      [promptAt(now - 2 * MIN, web, 'CI pipeline'), callAt(now - MIN, 't1')],
      now - MIN,
    );
    write(
      'deploys',
      'bbbb',
      [promptAt(now - 40 * MIN, deploys, 'Cache key rollout'), endAt(now - 30 * MIN)],
      now - 30 * MIN,
    );
    const busy = write(
      'deploys',
      'cccc',
      [promptAt(now - 6 * 3_600_000, deploys, 'background research')],
      now - 5 * 3_600_000,
    );
    const subagents = path.join(path.dirname(busy), 'cccc', 'subagents');
    mkdirSync(subagents, { recursive: true });
    const agent = path.join(subagents, 'agent-x.jsonl');
    writeFileSync(agent, '{}\n');
    utimesSync(agent, new Date(now - 10 * MIN), new Date(now - 10 * MIN));
    write('old', 'dddd', [promptAt(now - 4 * 3_600_000, home, 'old')], now - 3 * 3_600_000);
  };
  /** The fixture's transcript, its times moved so its last entry is at `lastMs`. */
  const fixture = (lastMs: number) => {
    const dir = path.join(projects, '-tmp-demo');
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${FIXTURE_ID}.jsonl`);
    const text = readFileSync(FIXTURE, 'utf8');
    const STAMP = /"timestamp":"([^"]+)"/g;
    const last = Math.max(...[...text.matchAll(STAMP)].map((m) => Date.parse(m[1]!)));
    writeFileSync(
      file,
      text.replace(
        STAMP,
        (_, iso: string) => `"timestamp":"${stamp(Date.parse(iso) - last + lastMs)}"`,
      ),
    );
    utimesSync(file, new Date(lastMs), new Date(lastMs));
    return file;
  };
  return { root, home, projects, env, write, sessions, fixture };
}

async function live(env: Record<string, string | undefined>, ...args: string[]) {
  const io = captureIo();
  const code = await main(['live', ...args], io, env, '/', now);
  return { code, out: io.stdout.join('\n').split('\n'), err: io.stderr };
}

describe('awf live: which sessions', () => {
  it('takes sessions changed within --since, a subagent counting, newest first, up to --limit', async () => {
    const { env, sessions } = setup();
    sessions();
    expect(activeTranscripts(env, now - 2 * 3_600_000).map((t) => t.id)).toEqual([
      'aaaa',
      'cccc',
      'bbbb',
    ]);
    const ids = async (...args: string[]) =>
      JSON.parse((await live(env, '--json', ...args)).out.join('\n')).map(
        (row: { id: string }) => row.id,
      );
    expect(await ids()).toEqual(['aaaa', 'cccc', 'bbbb']);
    expect(await ids('--limit', '2')).toEqual(['aaaa', 'cccc']);
    expect(await ids('--since', '4h')).toEqual(['aaaa', 'cccc', 'bbbb', 'dddd']);
    expect(await ids('--since', '20m')).toEqual(['aaaa', 'cccc']);
  });

  it("goes by the transcript's last entry, not the time its file changed", async () => {
    const { env, sessions, write, home } = setup();
    sessions();
    // Last worked on 3h ago; the app reopened it a minute ago, adding entries without a time.
    write(
      'reopened',
      'eeee',
      [
        promptAt(now - 3 * 3_600_000, home, 'reopened'),
        endAt(now - 3 * 3_600_000 + MIN),
        { type: 'cost-state', sessionId: 'eeee' },
        { type: 'last-prompt', lastPrompt: 'reopened', sessionId: 'eeee' },
      ],
      now - MIN,
    );
    const pass = async (...args: string[]) =>
      JSON.parse((await live(env, '--json', ...args)).out.join('\n')).map(
        (row: { id: string; activityMs: number }) => [row.id, (now - row.activityMs) / MIN],
      );
    expect(await pass()).toEqual([
      ['aaaa', 1],
      ['cccc', 10],
      ['bbbb', 30],
    ]);
    expect((await pass('--since', '4h')).map(([id]: [string]) => id)).toEqual([
      'aaaa',
      'cccc',
      'bbbb',
      'eeee',
      'dddd',
    ]);
    expect((await live(env, '--once')).out[0]).toMatch(/^awf live · 3 active · /);
  });

  it('leaves out the copy a resume left behind, which would read as working', async () => {
    const { env, write, home } = setup();
    const opening = [promptAt(now - 3 * MIN, home, 'task'), callAt(now - 3 * MIN, 'toolu_1')];
    write('web', 'real', [...opening, callAt(now - MIN, 'toolu_2')], now - MIN);
    write('web', 'copy', opening, now - 3 * MIN);
    write('web', 'other', [promptAt(now - 2 * MIN, home, 'x'), callAt(now - MIN, 't1')], now - MIN);
    write('web', 'twin', [promptAt(now - 2 * MIN, home, 'y'), callAt(now - MIN, 't1')], now - MIN);
    const rows = JSON.parse((await live(env, '--json')).out.join('\n'));
    expect(rows.map((row: { id: string }) => row.id).sort()).toEqual(['other', 'real', 'twin']);
    expect((await live(env, '--once')).out[0]).toMatch(/^awf live · 3 active · /);
  });

  it('says so when nothing is active', async () => {
    const { env } = setup();
    const run = await live(env, '--once');
    expect(run.code).toBe(0);
    expect(run.out).toEqual([
      expect.stringMatching(/^awf live · nothing active in the last 2h · \d\d:\d\d$/),
    ]);
  });

  it('rejects options it cannot read', async () => {
    const { env } = setup();
    for (const args of [
      ['--limit', '0'],
      ['--every', '0.5s'],
      ['--every', 'soon'],
      ['--since', 'yesterday'],
    ]) {
      const run = await live(env, '--once', ...args);
      expect({ args, code: run.code }).toEqual({ args, code: 1 });
      expect(run.err[0]).toMatch(/^awf live: /);
    }
    expect(liveOptions({ every: '1m', since: '30m', pin: 'none' })).toMatchObject({
      everyMs: 60_000,
      sinceMs: 30 * MIN,
      limit: 10,
      pin: [],
    });
  });
});

describe('awf live --once and --json', () => {
  it('prints the board: project, task, state and phase split', async () => {
    const { env, sessions, fixture } = setup();
    sessions();
    fixture(now - 20 * MIN);
    const run = await live(env, '--once');
    expect(run.code).toBe(0);
    expect(run.out[0]).toMatch(/^awf live · 4 active · \d\d:\d\d$/);
    const rows = run.out.slice(1).map((line) => line.replace(/ {2,}/g, ' | '));
    // The scrubbed fixture's prompt is ‹text›; its folder is outside HOME, so it's cut from the left.
    expect(rows).toEqual([
      'acme-billing/web | CI pipeline | working | tests 100%',
      'deploys | background research | working',
      `…/scratchpad/demo | ‹text› | idle 20m | ${FIXTURE_LINE}`,
      'deploys | Cache key rollout | idle 30m | tests 0% · plan 100%',
    ]);
  });

  it('prints the same pass as JSON, lines uncoloured even with colours on', async () => {
    const { env, sessions, fixture } = setup();
    sessions();
    const transcript = fixture(now - 20 * MIN);
    const run = await live({ ...env, NO_COLOR: undefined, COLORTERM: 'truecolor' }, '--json');
    const rows = JSON.parse(run.out.join('\n'));
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      id: 'aaaa',
      project: 'acme-billing/web',
      title: 'CI pipeline',
      state: 'working',
      label: 'working',
      background: 0,
      line: 'tests 100%',
    });
    expect(rows[2]).toMatchObject({
      id: FIXTURE_ID,
      state: 'idle',
      line: FIXTURE_LINE,
      transcript,
      sinceMs: expect.any(Number),
    });
    expect(rows[3]).toMatchObject({ id: 'bbbb', label: 'idle 30m', sinceMs: now - 30 * MIN });
  });

  it("shares the status line's cache, both ways", async () => {
    const { env, fixture } = setup();
    const transcript = fixture(now - MIN);
    await live(env, '--once');
    const file = path.join(env.AWF_HOME!, 'cache', 'statusline', `${FIXTURE_ID}.json`);
    const cached = JSON.parse(readFileSync(file, 'utf8'));
    expect(cached.line).toBe(FIXTURE_LINE);

    // The status line finds the board's line under its own key...
    writeFileSync(file, JSON.stringify({ ...cached, line: 'from the board' }));
    const io = { ...captureIo(), input: () => JSON.stringify({ transcript_path: transcript }) };
    await main(['statusline'], io, env, '/', now);
    expect(io.stdout).toEqual(['from the board']);
    // ...and the board the status line's.
    writeFileSync(file, JSON.stringify({ ...cached, line: 'from the status line' }));
    expect((await live(env, '--once')).out[1]).toContain('from the status line');
  });

  it('fits rows to the terminal width', async () => {
    const { env, sessions, fixture } = setup();
    sessions();
    fixture(now - 20 * MIN);
    for (const columns of [120, 80, 60, 30]) {
      const run = await live({ ...env, COLUMNS: String(columns) }, '--once');
      for (const line of run.out) expect(textWidth(line)).toBeLessThanOrEqual(columns);
    }
    const narrow = await live({ ...env, COLUMNS: '60' }, '--once');
    // The phase line before the task: the task goes first.
    expect(narrow.out[3]).toContain('tests 20%');
    expect(narrow.out[3]).not.toContain('The sum');
  });
});

describe('awf live with broken transcripts', () => {
  it("skips a transcript it can't read, and shows the others", async () => {
    const { env, sessions, write } = setup();
    sessions();
    write('broken', 'eeee', ['not json', '{"type":', '[1,2]'], now - 5 * MIN);
    write(
      'half',
      'ffff',
      ['garbage', promptAt(now - 3 * MIN, '/repo', 'still here')],
      now - 3 * MIN,
    );
    const run = await live(env, '--once');
    expect(run.code).toBe(0);
    expect(run.out[0]).toMatch(/· 4 active ·/);
    expect(run.out.join('\n')).not.toContain('eeee');
    expect(run.out[2]).toMatch(/^\/repo +still here +working$/);
  });

  it("shows the row without its phase line when the session can't be read", () => {
    const { env, fixture } = setup();
    const transcript = fixture(now - MIN);
    const options = liveOptions({});
    const { rows } = scan({ env }, options, newMemo(), now);
    expect(rows).toHaveLength(1);
    // Gone between the scan and the phase line.
    rmSync(transcript);
    expect(fillLine({ env }, rows[0]!, options, 'none', now, false)).toBe(true);
    expect(rows[0]).toMatchObject({ error: 'transcript not found' });
    expect(rows[0]!.line).toBeUndefined();
    const board = renderBoard(
      'awf live',
      [{ project: 'demo', title: 'The sum', label: 'your turn', state: 'your-turn' }],
      { mode: 'none' },
    );
    expect(board[1]).toBe('demo   The sum   your turn');
  });
});

describe('the board layout', () => {
  const rows = [
    {
      project: 'acme-billing/web',
      title: 'CI pipeline for demo-0001 and the release train',
      label: 'working',
      state: 'working' as const,
      line: 'tests 35% · build 33% · explore 12% · 12 failed',
    },
    {
      project: 'deploys',
      title: 'Cache key rollout',
      label: 'idle 12m',
      state: 'idle' as const,
      line: 'tests 4% · scripts 57% · explore 23% · rework 14m',
    },
  ];

  it('aligns the columns and cuts long tasks', () => {
    expect(renderBoard('awf live · 2 active', rows, { mode: 'none' })).toEqual([
      'awf live · 2 active',
      'acme-billing/web   CI pipeline for demo-0001…   working    tests 35% · build 33% · explore 12% · 12 failed',
      'deploys            Cache key rollout            idle 12m   tests 4% · scripts 57% · explore 23% · rework 14m',
    ]);
  });

  it('drops phase items from the end before cutting, and the task before the phase line', () => {
    const at80 = renderBoard('awf live', rows, { mode: 'none', columns: 80 });
    // The line takes what it needs, keeping 12 columns for the task.
    expect(at80[1]).toBe(
      'acme-billing/web   CI pipeline…   working    tests 35% · build 33% · explore 12%',
    );
    expect(at80[2]).toBe('deploys            Cache key r…   idle 12m   tests 4% · scripts 57%');
    const at50 = renderBoard('awf live', rows, { mode: 'none', columns: 50 });
    expect(at50.slice(1)).toEqual([
      'acme-billing/web   working    tests 35%',
      'deploys            idle 12m   tests 4%',
    ]);
    expect(fitLine('tests 35% · build 33%', 12)).toBe('tests 35%');
    expect(fitLine('unclassified 52%', 10)).toBe('unclassif…');
  });

  it('keeps colours whole when it drops or cuts', () => {
    const coloured =
      '\x1b[38;5;172mtests\x1b[39m 35% \x1b[2m·\x1b[22m \x1b[38;5;169mbuild\x1b[39m 33%';
    expect(fitLine(coloured, 12)).toBe('\x1b[38;5;172mtests\x1b[39m 35%');
    expect(truncate('\x1b[1mlong words\x1b[22m', 6)).toBe('\x1b[1mlong…\x1b[0m');
    expect(textWidth(coloured)).toBe('tests 35% · build 33%'.length);
    expect(textWidth('日本')).toBe(4);
    const board = renderBoard('awf live', rows, { mode: '256' });
    expect(board[0]).toBe('\x1b[2mawf live\x1b[22m');
    expect(board[2]).toContain('\x1b[2midle 12m\x1b[22m');
  });

  it('counts the rows that do not fit the terminal', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ ...rows[1]!, project: `p${i}` }));
    const board = renderBoard('awf live', many, { mode: 'none', height: 4 });
    expect(board).toHaveLength(4);
    expect(board[3]).toBe('… 4 more');
  });

  it('names projects by their folder, short', () => {
    const home = '/Users/me';
    expect(projectName('/Users/me/Documents/acme-billing/web', home)).toBe('acme-billing/web');
    expect(projectName('/Users/me/Documents/deploys', home)).toBe('deploys');
    expect(projectName('/Users/me/Documents', home)).toBe('Documents');
    expect(projectName('/Users/me/work/api', home)).toBe('api');
    expect(projectName('/Users/me/visualization/awf', home)).toBe('visualization/awf');
    expect(projectName('/Users/me', home)).toBe('~');
    expect(projectName('/Users/meself/x', home)).toBe('/Users/meself/x');
    expect(projectName('/tmp/demo', home)).toBe('/tmp/demo');
  });
});

describe('the live board', () => {
  function fakeTerminal() {
    let resize = () => {};
    let stop = () => {};
    const terminal: Terminal & { output: string } = {
      output: '',
      isTTY: true,
      columns: 100,
      rows: 20,
      write(text) {
        this.output += text;
      },
      onResize(listener) {
        resize = listener;
        return () => (resize = () => {});
      },
      onStop(listener) {
        stop = listener;
        return () => (stop = () => {});
      },
    };
    return { terminal, resize: () => resize(), stop: () => stop() };
  }

  it('redraws in place with the cursor hidden, and gives it back on Ctrl-C', async () => {
    const { env, sessions, fixture } = setup();
    sessions();
    fixture(now - 20 * MIN);
    const { terminal, resize, stop } = fakeTerminal();
    const done = liveLoop({ env }, liveOptions({}), terminal, () => now);
    // Rows show at once; phase lines fill in one session at a time, the last one last.
    await vi.waitFor(() => expect(terminal.output).toContain('tests 0% · plan 100%'));
    const first = terminal.output.slice(0, terminal.output.indexOf('\x1b[J'));
    expect(first).toContain('Cache key rollout');
    expect(first).not.toContain('plan 100%');
    expect(terminal.output.startsWith('\x1b[?25l\x1b[H\x1b[2J')).toBe(true);
    // Each frame: cursor home, every line cleared to its end, the rest of the screen cleared.
    const frame = terminal.output.slice(terminal.output.lastIndexOf('\x1b[H'));
    expect(frame.startsWith('\x1b[Hawf live · 4 active · every 20s · ')).toBe(true);
    expect(frame.split('\n')[0]!.endsWith('\x1b[K')).toBe(true);
    expect(frame.endsWith('\x1b[K\x1b[J')).toBe(true);
    expect(frame.split('\n')).toHaveLength(5);

    terminal.columns = 50;
    const before = terminal.output.length;
    resize();
    const resized = terminal.output.slice(before);
    for (const line of resized.split('\n')) expect(textWidth(line)).toBeLessThanOrEqual(50);

    stop();
    expect(await done).toBe(0);
    expect(terminal.output.endsWith('\n\x1b[?25h')).toBe(true);
    const after = terminal.output.length;
    resize();
    expect(terminal.output.length).toBe(after);
  });
});
