import type { ClassifiedSession, ClassifiedStep } from '../../classify/classify';
import { PHASE_LABEL, PHASES, type PhaseId } from '../../classify/phases';
import { programName, splitCommand, unwrap } from '../../classify/shell';
import { formatDuration } from '../../model/time';
import { classifier, loadMany } from '../load';
import type { Command } from '../main';
import { table } from '../table';

export interface BashStats {
  sessions: number;
  bashMs: number;
  bashCalls: number;
  unclassifiedMs: number;
  unclassifiedShare: number;
  byPhase: Array<{ phase: PhaseId; ms: number; calls: number; share: number }>;
  /**
   * Bash time of one phase by program: for Unclassified, the program no rule matched (which rule
   * is missing); for the others, the part of the command that decided the phase.
   */
  topUnclassified: Array<{ program: string; ms: number; calls: number }>;
  /** Unclassified time of other tools, by tool name. */
  otherUnclassified: Array<{ tool: string; ms: number; calls: number }>;
}

const POLLING = '(polling: sleep in a loop, or a long sleep)';

/** Time a Bash call ran, without any wait for approval. */
function runMs(step: ClassifiedStep): number {
  return Math.max(0, step.endMs - step.startMs - (step.waitMs ?? 0));
}

/** Programs that change nothing; a command's head is the first program after them. */
const NEUTRAL_HEADS = new Set([
  'cd',
  'export',
  'echo',
  'printf',
  'set',
  'source',
  '.',
  'true',
  'false',
  ':',
  'sleep',
  '[',
  '[[',
  'test',
  'unset',
  'local',
  'eval',
  'pushd',
  'popd',
  'wait',
]);

/** "python3", "node", "curl", "docker run": the program (and subcommand) a command really runs. */
export function commandHead(command: string): string {
  const simple = splitCommand(command)
    .map((c) => unwrap(c.argv).argv)
    .filter((argv) => argv.length > 0);
  const argv = simple.find((a) => !NEUTRAL_HEADS.has(programName(a[0] ?? ''))) ?? simple[0];
  if (!argv) return '(empty)';
  const program = programName(argv[0] ?? '');
  const sub = argv[1];
  return sub && /^[a-z][a-z-]{1,20}$/.test(sub) ? `${program} ${sub}` : program;
}

export function bashStats(
  sessions: ClassifiedSession[],
  top = 10,
  focus: PhaseId = 'unclassified',
): BashStats {
  const byPhase = new Map<PhaseId, { ms: number; calls: number }>();
  const heads = new Map<string, { ms: number; calls: number }>();
  const others = new Map<string, { ms: number; calls: number }>();
  let bashMs = 0;
  let bashCalls = 0;
  for (const session of sessions) {
    for (const step of session.steps) {
      if (step.kind !== 'tool' || step.flags.includes('background')) continue;
      const ms = runMs(step);
      if (step.tool !== 'Bash') {
        if (step.phase === 'unclassified') {
          const tool = step.tool?.startsWith('mcp__')
            ? `mcp__${step.tool.split('__')[1] ?? ''}`
            : (step.tool ?? '?');
          const entry = others.get(tool) ?? { ms: 0, calls: 0 };
          entry.ms += ms;
          entry.calls++;
          others.set(tool, entry);
        }
        continue;
      }
      const phase = step.phase ?? 'unclassified';
      bashMs += ms;
      bashCalls++;
      const entry = byPhase.get(phase) ?? { ms: 0, calls: 0 };
      entry.ms += ms;
      entry.calls++;
      byPhase.set(phase, entry);
      if (phase === focus) {
        // For unclassified calls, the program no rule matched says which rule is missing. For the
        // others, the part of the command that decided the phase: `T=$(gh auth token); xcodebuild
        // test` is a test run of xcodebuild, not of gh.
        const unmatched = step.tags
          .find((t) => t.startsWith('unmatched:'))
          ?.slice('unmatched:'.length);
        const polling =
          step.decidedBy === 'polling' ||
          (focus === 'unclassified' && step.tags.includes('polling'));
        const head = polling
          ? POLLING
          : focus === 'unclassified'
            ? (unmatched ?? (step.command ? commandHead(step.command) : '(no command)'))
            : (step.decidedBy ?? (step.command ? commandHead(step.command) : '(no command)'));
        const h = heads.get(head) ?? { ms: 0, calls: 0 };
        h.ms += ms;
        h.calls++;
        heads.set(head, h);
      }
    }
  }
  const unclassifiedMs = byPhase.get('unclassified')?.ms ?? 0;
  const sorted = <K extends string>(map: Map<string, { ms: number; calls: number }>, key: K) =>
    [...map]
      .sort((a, b) => b[1].ms - a[1].ms)
      .slice(0, top)
      .map(
        ([name, v]) => ({ [key]: name, ...v }) as Record<K, string> & { ms: number; calls: number },
      );
  return {
    sessions: sessions.length,
    bashMs,
    bashCalls,
    unclassifiedMs,
    unclassifiedShare: bashMs > 0 ? unclassifiedMs / bashMs : 0,
    byPhase: PHASES.filter((p) => byPhase.has(p.id)).map((p) => {
      const v = byPhase.get(p.id) as { ms: number; calls: number };
      return { phase: p.id, ...v, share: bashMs > 0 ? v.ms / bashMs : 0 };
    }),
    topUnclassified: sorted(heads, 'program'),
    otherUnclassified: sorted(others, 'tool'),
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export const statsCommand: Command = {
  summary: 'Share of Bash time each phase got, and what is left unclassified',
  usage: `Usage: awf stats [--since 30d] [--project <dir>] [--top 10] [--phase <id>] [--json]

Classifies the Bash calls of every recorded or imported session and shows the time per phase,
the share left unclassified, and the programs behind that time, to show which rules are missing.
  --phase <id>   break this phase down instead of unclassified (tests, build, exploring, ...), by
                 the part of each command that decided its phase: xcodebuild test, cargo test`,
  options: {
    since: { type: 'string' },
    project: { type: 'string' },
    top: { type: 'string' },
    phase: { type: 'string' },
    json: { type: 'boolean' },
  },
  run(ctx, _args, options) {
    const classify = classifier();
    const sessions = loadMany(ctx, options).map(classify);
    const top = typeof options.top === 'string' ? Number.parseInt(options.top, 10) || 10 : 10;
    const focus = (typeof options.phase === 'string' ? options.phase : 'unclassified') as PhaseId;
    if (!PHASES.some((p) => p.id === focus))
      throw new Error(`unknown phase "${focus}"; use one of ${PHASES.map((p) => p.id).join(', ')}`);
    const stats = bashStats(sessions, top, focus);
    if (options.json) {
      ctx.io.out(JSON.stringify(stats, null, 2));
      return 0;
    }
    if (stats.bashCalls === 0) {
      ctx.io.out(
        'No Bash calls found. Run "awf import" first, or record a session with the plugin.',
      );
      return 0;
    }
    ctx.io.out(
      `Bash time: ${formatDuration(stats.bashMs)} in ${stats.bashCalls.toLocaleString('en-US')} calls across ${stats.sessions} sessions. ` +
        `Unclassified: ${pct(stats.unclassifiedShare)}.`,
    );
    ctx.io.out('');
    ctx.io.out(
      table(
        ['PHASE', 'TIME', 'SHARE', 'CALLS'],
        stats.byPhase.map((p) => [
          PHASE_LABEL[p.phase],
          formatDuration(p.ms),
          pct(p.share),
          p.calls.toLocaleString('en-US'),
        ]),
        [1, 2, 3],
      ),
    );
    if (stats.topUnclassified.length > 0) {
      ctx.io.out('');
      ctx.io.out(
        focus === 'unclassified'
          ? 'Unclassified Bash time by program (add rules for these in .awf/rules.yaml):'
          : `${PHASE_LABEL[focus]} Bash time by program:`,
      );
      ctx.io.out(
        table(
          ['PROGRAM', 'TIME', 'CALLS'],
          stats.topUnclassified.map((h) => [h.program, formatDuration(h.ms), String(h.calls)]),
          [1, 2],
        ),
      );
    }
    if (stats.otherUnclassified.length > 0) {
      ctx.io.out('');
      ctx.io.out('Unclassified time of other tools:');
      ctx.io.out(
        table(
          ['TOOL', 'TIME', 'CALLS'],
          stats.otherUnclassified.map((h) => [h.tool, formatDuration(h.ms), String(h.calls)]),
          [1, 2],
        ),
      );
    }
    return 0;
  },
};
