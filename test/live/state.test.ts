import { describe, expect, it } from 'vitest';
import {
  idleFor,
  isServer,
  liveState,
  stateLabel,
  transcriptFacts,
  type TranscriptFacts,
} from '../../src/live/state';
import type { RecorderEvent } from '../../src/recorder/event';
import {
  ms,
  notification,
  prompt,
  queuedNotice,
  request,
  result,
  system,
  text,
  toolUse,
} from '../transcript';

type Entry = Record<string, unknown>;

function facts(...entries: Array<Entry | string>): TranscriptFacts {
  return transcriptFacts(
    entries.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n') + '\n',
  );
}

/** The state at `t` seconds, with its label. */
function stateAt(t: number, entries: Array<Entry | string>, events?: RecorderEvent[]) {
  const state = liveState(facts(...entries), ms(t), events);
  return { ...state, label: stateLabel(state, ms(t)) };
}

/** An assistant reply that ends the turn, with no system entry after it. */
function endTurn(t: number, message: string): Entry {
  const entry = text(t, message);
  return { ...entry, message: { ...(entry.message as Entry), stop_reason: 'end_turn' } };
}

function userText(t: number, words: string): Entry {
  return {
    type: 'user',
    timestamp: new Date(ms(t)).toISOString(),
    message: { role: 'user', content: [{ type: 'text', text: words }] },
  };
}

const bash = (t: number, id: string, extra: Entry = {}) =>
  toolUse(t, `m-${id}`, id, 'Bash', { command: 'npm run build', ...extra });

describe('live state', () => {
  it('is working mid-turn: after a prompt, with a call open, and while a model request is out', () => {
    const start = [prompt(0, 'fix the build')];
    expect(stateAt(5, start)).toMatchObject({ kind: 'working', why: 'turn', label: 'working' });
    const calling = [...start, bash(2, 't1')];
    expect(stateAt(5, calling)).toMatchObject({ kind: 'working', why: 'turn' });
    expect(facts(...calling).openCalls).toEqual([
      { id: 't1', tool: 'Bash', ms: ms(2), command: 'npm run build' },
    ]);
    const answered = [...calling, result(9, 't1')];
    expect(stateAt(10, answered)).toMatchObject({ kind: 'working' });
    expect(facts(...answered).openCalls).toEqual([]);
    expect(stateAt(11, [...answered, request(10, 'r1')])).toMatchObject({ kind: 'working' });
    // A long silence mid-turn is still working: without the recorder awf doesn't guess.
    expect(stateAt(3600, calling)).toMatchObject({ kind: 'working' });
  });

  it('is your turn once the turn ended, however Claude Code marked the end', () => {
    const ended = (end: Entry) => stateAt(60, [prompt(0, 'hi'), text(3, 'm1'), end]);
    // The terminal writes turn_duration; the desktop app a stop_hook_summary, or nothing.
    expect(ended(system(4, 'turn_duration'))).toMatchObject({
      kind: 'your-turn',
      sinceMs: ms(4),
      label: 'your turn',
    });
    expect(ended(system(4, 'stop_hook_summary'))).toMatchObject({ kind: 'your-turn' });
    expect(stateAt(60, [prompt(0, 'hi'), endTurn(3, 'm1')])).toMatchObject({
      kind: 'your-turn',
      sinceMs: ms(3),
    });
    // Interrupted, or ended on an API error.
    expect(
      stateAt(60, [prompt(0, 'hi'), bash(1, 't1'), userText(2, '[Request interrupted by user]')]),
    ).toMatchObject({ kind: 'your-turn', sinceMs: ms(2) });
    expect(
      stateAt(60, [prompt(0, 'hi'), { ...text(2, 'm1', 'API Error'), isApiErrorMessage: true }]),
    ).toMatchObject({ kind: 'your-turn' });
    // The model works again after its turn ended (it answers a notice): working.
    const again = [prompt(0, 'hi'), endTurn(3, 'm1'), system(3, 'turn_duration')];
    expect(stateAt(60, [...again, request(50, 'r2')])).toMatchObject({ kind: 'working' });
    // A new prompt opens a turn.
    expect(stateAt(60, [...again, prompt(50, 'and now?')])).toMatchObject({ kind: 'working' });
  });

  it('is your turn while a question waits for your answer', () => {
    const asking = [
      prompt(0, 'plan it'),
      toolUse(2, 'm1', 'q1', 'AskUserQuestion', { questions: [] }),
    ];
    expect(stateAt(30, asking)).toMatchObject({
      kind: 'your-turn',
      question: 'AskUserQuestion',
      sinceMs: ms(2),
    });
    expect(stateAt(2 + 10 * 60, asking).label).toBe('idle 10m');
    expect(stateAt(40, [...asking, result(35, 'q1')])).toMatchObject({ kind: 'working' });
  });

  it('is working while a background task, subagent or monitor it started still runs', () => {
    const launched = [
      prompt(0, 'build it'),
      bash(1, 't1', { run_in_background: true }),
      result(2, 't1', { toolUseResult: { backgroundTaskId: 'b1' } }),
      endTurn(3, 'm2'),
      system(3, 'turn_duration'),
    ];
    expect(stateAt(100, launched)).toMatchObject({
      kind: 'working',
      why: 'background',
      background: 1,
    });
    // The completion notice ends it: your turn since the turn ended.
    expect(stateAt(100, [...launched, notification(50, 'b1', 'completed')])).toMatchObject({
      kind: 'your-turn',
      sinceMs: ms(3),
      background: 0,
    });
    // So does stopping it.
    expect(
      stateAt(100, [
        ...launched.slice(0, 3),
        toolUse(4, 'm3', 't2', 'TaskStop', { task_id: 'b1' }),
        result(5, 't2'),
        endTurn(6, 'm4'),
      ]),
    ).toMatchObject({ kind: 'your-turn', background: 0 });
    // A call that failed started nothing.
    expect(
      stateAt(100, [
        prompt(0, 'build it'),
        bash(1, 't1', { run_in_background: true }),
        result(2, 't1', { error: true, toolUseResult: { backgroundTaskId: 'b1' } }),
        endTurn(3, 'm2'),
      ]),
    ).toMatchObject({ kind: 'your-turn' });

    const agent = [
      prompt(0, 'look around'),
      toolUse(1, 'm1', 'c1', 'Agent', { subagent_type: 'Explore', run_in_background: true }),
      result(2, 'c1', {
        toolUseResult: { isAsync: true, status: 'async_launched', agentId: 'a1' },
      }),
      endTurn(3, 'm2'),
    ];
    expect(stateAt(100, agent)).toMatchObject({ kind: 'working', why: 'background' });
    expect(stateAt(100, [...agent, queuedNotice(80, 'a1', 'completed')])).toMatchObject({
      kind: 'your-turn',
    });

    const monitor = [
      prompt(0, 'watch CI'),
      toolUse(1, 'm1', 'c1', 'Monitor', { command: 'gh run watch', timeout_ms: 600000 }),
      result(2, 'c1', { toolUseResult: { taskId: 'w1', timeoutMs: 600000, persistent: false } }),
      endTurn(3, 'm2'),
      // A monitor's events come as notices without a status while it runs.
      {
        type: 'queue-operation',
        operation: 'enqueue',
        timestamp: new Date(ms(40)).toISOString(),
        content:
          '<task-notification><task-id>w1</task-id><summary>step done</summary><event>x</event></task-notification>',
      },
    ];
    expect(stateAt(100, monitor)).toMatchObject({ kind: 'working', background: 1 });
    expect(stateAt(100, [...monitor, notification(90, 'w1', 'completed')])).toMatchObject({
      kind: 'your-turn',
    });
  });

  it('knows the process exited: what was running died with it', () => {
    const costState = { type: 'cost-state', sessionId: 's', totalCostUSD: 1 };
    const running = [
      prompt(0, 'serve it'),
      bash(1, 't1', { run_in_background: true }),
      result(2, 't1', { toolUseResult: { backgroundTaskId: 'b1' } }),
      endTurn(3, 'm2'),
      system(3, 'turn_duration'),
    ];
    expect(stateAt(100, [...running, costState])).toMatchObject({
      kind: 'your-turn',
      sinceMs: ms(3),
      background: 0,
    });
    // Quit mid-turn: the turn ends at the last thing written; the killed call's late result
    // doesn't open it again.
    const quit = [
      prompt(0, 'test it'),
      bash(2, 't2'),
      costState,
      result(16, 't2', { error: true }),
    ];
    expect(stateAt(100, quit)).toMatchObject({ kind: 'your-turn', sinceMs: ms(2) });
    // Resumed: a new prompt is a new turn.
    expect(stateAt(100, [...quit, prompt(90, 'go on')])).toMatchObject({ kind: 'working' });
  });

  it('ends the turn of a slash command that ran without the model', () => {
    const local = [
      prompt(0, '<command-name>/model</command-name><command-args>opus</command-args>'),
      userText(1, '<local-command-stdout>Set model to opus</local-command-stdout>'),
    ];
    expect(stateAt(60, local)).toMatchObject({ kind: 'your-turn', sinceMs: ms(1) });
    // A command the model answers is a turn like any other.
    const skill = [
      prompt(0, '<command-name>/review</command-name>'),
      request(1, 'r1'),
      userText(2, '<local-command-stdout>noise</local-command-stdout>'),
    ];
    expect(stateAt(60, skill)).toMatchObject({ kind: 'working' });
  });

  it('reads idle after five minutes of your turn', () => {
    const ended = [prompt(0, 'hi'), endTurn(3, 'm1'), system(3, 'turn_duration')];
    expect(stateAt(3 + 4 * 60, ended).label).toBe('your turn');
    expect(stateAt(3 + 12 * 60, ended)).toMatchObject({ kind: 'idle', label: 'idle 12m' });
    expect(stateAt(3 + 185 * 60, ended).label).toBe('idle 3h05m');
    expect(idleFor(2 * 86_400_000 + 5)).toBe('2d');
  });

  it("shows approval? from the recorder's events, only for a call still open", () => {
    const calling = [prompt(0, 'deploy'), bash(2, 't1')];
    const event = (e: string, extra: Partial<RecorderEvent> = {}): RecorderEvent => ({
      v: 1,
      e,
      t: ms(2),
      sid: 's',
      ...extra,
    });
    const asked = [
      event('PreToolUse', { tool: 'Bash', tuid: 't1', ih: 'h1' }),
      event('PermissionRequest', { tool: 'Bash', ih: 'h1' }),
    ];
    expect(stateAt(30, calling, asked)).toMatchObject({ kind: 'approval', label: 'approval?' });
    // Without events, or once the call ended, no guess.
    expect(stateAt(30, calling)).toMatchObject({ kind: 'working' });
    expect(
      stateAt(30, calling, [...asked, event('PostToolUse', { tool: 'Bash', tuid: 't1' })]),
    ).toMatchObject({ kind: 'working' });
    // The transcript has the call's result (a hook was lost): not waiting.
    expect(stateAt(30, [...calling, result(9, 't1')], asked)).toMatchObject({ kind: 'working' });
    // A background subagent's prompt counts until the subagent stops.
    const agent = [
      prompt(0, 'look around'),
      toolUse(1, 'm1', 'c1', 'Agent', { subagent_type: 'Explore' }),
      result(2, 'c1', { toolUseResult: { isAsync: true, agentId: 'a1' } }),
      endTurn(3, 'm2'),
    ];
    const sub = [
      event('PreToolUse', { tool: 'Bash', tuid: 's1', ih: 'h2', aid: 'a1' }),
      event('PermissionRequest', { tool: 'Bash', ih: 'h2', aid: 'a1' }),
    ];
    expect(stateAt(30, agent, sub)).toMatchObject({ kind: 'approval' });
    expect(stateAt(30, agent, [...sub, event('SubagentStop', { aid: 'a1' })])).toMatchObject({
      kind: 'working',
    });
  });

  it('names the session: its custom title, else its AI title, else its first prompt', () => {
    const base = [
      { type: 'file-history-snapshot', snapshot: {} },
      prompt(0, '/model opus'),
      prompt(
        1,
        '<system-reminder>ignore me</system-reminder>Fix the\nflaky   test API_TOKEN=abc123',
      ),
      text(2, 'm1'),
    ];
    expect(facts(...base)).toMatchObject({
      cwd: '/repo',
      title: 'Fix the flaky test API_TOKEN=‹masked›',
    });
    const aiTitle = { type: 'ai-title', aiTitle: 'Fix flaky test', sessionId: 's' };
    expect(facts(...base, aiTitle).title).toBe('Fix flaky test');
    const custom = { type: 'custom-title', customTitle: 'CI \x1b[31mred\x1b[0m', sessionId: 's' };
    expect(facts(...base, custom, aiTitle).title).toBe('CI [31mred [0m');
    // Only a slash command: that's the title.
    expect(facts(prompt(0, '/model opus')).title).toBe('/model opus');
  });

  it("skips lines that aren't JSON, and subagent entries in the main file", () => {
    const read = facts(
      'not json',
      prompt(0, 'hi'),
      '{"half": ',
      { ...bash(1, 'side'), isSidechain: true },
      endTurn(2, 'm1'),
    );
    expect(read).toMatchObject({ turnOpen: false, endedMs: ms(2), openCalls: [] });
    expect(facts('garbage', '[]', '42')).toEqual({
      turnOpen: false,
      openCalls: [],
      background: [],
    });
  });

  it('is your turn when only a server is left running: nothing waits for it to end', () => {
    const serve = (command: string) => [
      prompt(0, 'start the app'),
      bash(1, 't1', { command, run_in_background: true }),
      result(2, 't1', { toolUseResult: { backgroundTaskId: 'b1' } }),
      endTurn(3, 'm2'),
      system(3, 'turn_duration'),
    ];
    expect(
      stateAt(100, serve('cd ui && PORT=3002 npx next dev -p 3002 > dev.log 2>&1')),
    ).toMatchObject({ kind: 'your-turn', sinceMs: ms(3), background: 1, servers: 1 });
    expect(stateAt(1000, serve('pnpm -C core dev'))).toMatchObject({
      kind: 'idle',
      label: 'idle 16m',
    });
    // A test run that brings up its own server is waited for.
    expect(stateAt(100, serve('PORT=3001 pnpm test:e2e'))).toMatchObject({
      kind: 'working',
      background: 1,
      servers: 0,
    });
    // So is anything else it started, next to the server.
    expect(
      stateAt(100, [
        ...serve('pnpm dev'),
        prompt(10, 'and the tests'),
        bash(11, 't2', { command: 'pnpm test', run_in_background: true }),
        result(12, 't2', { toolUseResult: { backgroundTaskId: 'b2' } }),
        endTurn(13, 'm3'),
      ]),
    ).toMatchObject({ kind: 'working', why: 'background', background: 2, servers: 1 });
    // A turn under way is working, server or not.
    expect(stateAt(100, [...serve('pnpm dev'), prompt(50, 'now fix it')])).toMatchObject({
      kind: 'working',
      why: 'turn',
    });
  });

  it('tells servers from commands that end', () => {
    const servers = [
      'pnpm dev',
      'pnpm -C /Users/me/core dev',
      'PORT=8082 CORE_BASE_URL=http://localhost:8090 pnpm dev:server',
      'yarn start:dev',
      'npm run dev > $TMPDIR/chat.log 2>&1',
      'npx serve dist',
      'pnpm build > build.log 2>&1 && pnpm exec next start --port 23057',
      'exec pnpm exec vite --port 3101 --strictPort',
      'CLOUDSDK_CORE_ACCOUNT=me@example.com exec cloud-sql-proxy --gcloud-auth --port 5435 p:r:i',
      'go build -o back-bin . && PORT=8080 ./back-bin > back.log 2>&1',
      'APP_BIND=127.0.0.1:8788 ./target/debug/app serve > back.log',
      'cd fake-oauth && node server.mjs 9911',
      'firebase serve --only hosting --port 5055',
      'python3 -m http.server 8000',
      'python manage.py runserver',
      'docker compose up api',
      'kubectl port-forward svc/api 8080:80',
      'tail -f app.log',
    ];
    const ends = [
      'pnpm test',
      'pnpm build',
      'npm run lint -- --fix',
      'vite build',
      'vite-node x.ts',
      'pnpm add -D start-server-and-test',
      'PORT=3001 pnpm test:e2e',
      'PGPORT=5432 psql -c "select 1"',
      'docker compose up -d',
      'echo "starting server"',
      'target/debug/app serve --help | sed -n 5,12p',
      'timeout 60 pnpm dev',
      'gh run watch 36678360235 --exit-status --interval 60',
      'gh pr checks 12 --watch',
      'until [ "$(gh run view 1 --json status --jq .status)" = completed ]; do sleep 30; done',
      'xcodebuild test -scheme App',
      'sleep 600; echo done',
    ];
    expect(servers.filter((c) => !isServer(c))).toEqual([]);
    expect(ends.filter((c) => isServer(c))).toEqual([]);
  });

  it('counts only what the agent writes as activity, not what an exit or a reopen adds', () => {
    const read = facts(
      prompt(0, 'hi'),
      endTurn(2, 'm1'),
      system(2, 'turn_duration'),
      { type: 'cost-state', sessionId: 's' },
      { type: 'pr-link', timestamp: new Date(ms(5000)).toISOString(), prNumber: 1 },
      { type: 'file-history-delta', timestamp: new Date(ms(6000)).toISOString() },
      { type: 'last-prompt', lastPrompt: 'hi' },
    );
    expect(read).toMatchObject({ turnOpen: false, endedMs: ms(2), lastMs: ms(2) });
  });
});
