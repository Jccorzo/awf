import os from 'node:os';
import type { ClassifiedStep } from '../../classify/classify';
import { PHASE_LABEL } from '../../classify/phases';
import { formatClock, formatDuration } from '../../model/time';
import { classifier, loadOne } from '../load';
import type { Command } from '../main';
import { shareSession } from '../share';
import { homeRelative } from '../table';

function offset(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `+${h}:${String(m).padStart(2, '0')}:${sec}` : `+${m}:${sec}`;
}

function label(step: ClassifiedStep): string {
  switch (step.kind) {
    case 'turn':
      return step.flags.includes('notification') ? 'turn (background notice)' : 'turn';
    case 'subagent':
      return `subagent ${step.agentType ?? ''}`.trim();
    case 'model':
      return 'model';
    case 'idle':
      return 'idle';
    case 'compact':
      return 'compaction';
    case 'background':
      return `background: ${step.command ?? ''}`;
    default:
      return [step.tool, step.command ?? (step.files ?? []).join(' ')].filter(Boolean).join(': ');
  }
}

export const classifyCommand: Command = {
  summary: 'Show every step of a session with its phase',
  usage: `Usage: awf classify <session> [--json] [--share] [--detail]

Lists each step (turns, model time, tool calls, subagents) with its phase, tags and failures.
<session> is an ID or its first characters, "last", or a transcript or events file.
  --json     print JSON
  --share    phases, durations and tool names only (no commands, files or output)
  --detail   with --json, include output from the transcript (masked)`,
  options: {
    json: { type: 'boolean' },
    share: { type: 'boolean' },
    detail: { type: 'boolean' },
    project: { type: 'string' },
  },
  run(ctx, args, options) {
    const session = classifier()(loadOne(ctx, args[0], options, true));
    if (options.json) {
      const out = options.share
        ? shareSession(session)
        : options.detail
          ? session
          : withoutDetail(session);
      ctx.io.out(JSON.stringify(out, null, 2));
      return 0;
    }
    const shown = options.share ? shareSession(session) : session;
    const home = ctx.env.HOME ?? os.homedir();
    ctx.io.out(
      `Session ${session.id.slice(0, 8)} · ${formatClock(session.startMs)} · ${formatDuration(session.endMs - session.startMs)}` +
        (shown.cwd ? ` · ${homeRelative(shown.cwd, home)}` : ''),
    );
    const depth = new Map<string, number>();
    const byId = new Map(shown.steps.map((s) => [s.id, s]));
    const level = (s: ClassifiedStep): number => {
      if (depth.has(s.id)) return depth.get(s.id) as number;
      const parent = s.parentId ? byId.get(s.parentId) : undefined;
      const d = parent ? level(parent) + 1 : 0;
      depth.set(s.id, d);
      return d;
    };
    const ordered = [...shown.steps].sort((a, b) => a.startMs - b.startMs || level(a) - level(b));
    for (const step of ordered) {
      const phase = step.phase ? PHASE_LABEL[step.phase] : '';
      const notes = [
        step.failed ? 'FAILED' : '',
        ...step.flags.filter((f) => f !== 'answer'),
        ...step.tags.filter((t) => !t.startsWith('unmatched:')),
      ].filter(Boolean);
      const text = label(step).replace(/\s+/g, ' ');
      ctx.io.out(
        [
          offset(step.startMs - session.startMs).padStart(9),
          formatDuration(step.endMs - step.startMs).padStart(8),
          phase.padEnd(22),
          '  '.repeat(level(step)) + (text.length > 90 ? text.slice(0, 89) + '…' : text),
          notes.length > 0 ? `[${notes.join(', ')}]` : '',
        ]
          .join('  ')
          .trimEnd(),
      );
    }
    return 0;
  },
};

function withoutDetail<T extends { steps: Array<{ detail?: unknown }> }>(session: T): T {
  return { ...session, steps: session.steps.map(({ detail: _detail, ...rest }) => rest) };
}
