// The data a report embeds: offsets from the session start, display order, and only what the
// viewer shows. With share, no task, folder, commands, files, descriptions or output.
import type { Analysis } from '../analyze/summary';
import { phaseDetail } from '../analyze/summary';
import { phaseSegments } from '../analyze/timeline';
import type { ClassifiedStep } from '../classify/classify';
import type { PhaseId } from '../classify/phases';
import { programName, splitCommand, unwrap } from '../classify/shell';
import { maskSecrets } from '../model/mask';
import type { TokenUsage } from '../model/types';

export interface ReportPhase {
  id: PhaseId;
  label: string;
  ms: number;
  share: number;
  detail: string;
}

export interface ReportStep {
  /** Display index; parents come before their children. */
  i: number;
  /** Parent's display index, or -1. */
  p: number;
  depth: number;
  kind: string;
  phase?: PhaseId;
  /** Start and end, in ms from the session start. */
  s: number;
  e: number;
  label: string;
  /** Command, file or what a model step produced. Absent when shared. */
  text?: string;
  tool?: string;
  ok?: boolean;
  failed: boolean;
  flags: string[];
  tags: string[];
  checks: Array<{ key: string; failed: boolean }>;
  reworkFor?: string;
  runMs?: number;
  waitMs?: number;
  exitCode?: number;
  model?: string;
  tokens?: TokenUsage;
  description?: string;
  output?: string;
  files?: string[];
  agentType?: string;
  /** Whether the step has children (turns, subagents, Agent calls). */
  container: boolean;
  /** Model steps: display indexes of the calls this model time wrote. */
  produces?: number[];
}

export interface ReportData {
  v: 1;
  generatedAt: number;
  share: boolean;
  session: {
    id: string;
    title?: string;
    cwd?: string;
    agent: string;
    agentVersion?: string;
    sources: string[];
    startMs: number;
    totalMs: number;
    activeMs: number;
  };
  phases: ReportPhase[];
  counts: {
    modelCalls: number;
    toolCalls: number;
    subagents: number;
    failures: number;
    reworkLoops: number;
  };
  tokens?: TokenUsage;
  rework: Array<{ check: string; failedAt: number; passedAt?: number; edits: number }>;
  steps: ReportStep[];
  /** Display indexes of the slowest leaf steps, slowest first. */
  slowest: number[];
  /** Where unclassified time went, by program: the hint for which rules are missing. */
  unclassified: Array<{ name: string; ms: number }>;
  /** Unclassified model time: spent writing those unclassified calls. */
  unclassifiedModelMs: number;
  /** Which phase each stretch of the session counts as: [start, end, phase], in ms from the start. */
  timeline: Array<[number, number, PhaseId]>;
}

/** Output kept per step, and for the whole report, so a long session stays a light file. */
const MAX_OUTPUT_STEP = 4000;
const MAX_OUTPUT_TOTAL = 2_500_000;

/** A script name like "npm lint:fix" is the project's; shared reports keep only the runner. */
function shareCheck(key: string): string {
  return key.replace(/:(npm|pnpm|yarn|bun|deno|make) .*/, ':$1');
}

function stepLabel(step: ClassifiedStep, turnNumber: Map<string, number>, share: boolean): string {
  switch (step.kind) {
    case 'turn':
      return `Turn ${turnNumber.get(step.id) ?? ''}`.trim();
    case 'subagent':
      return step.agentType ? `Subagent · ${step.agentType}` : 'Subagent';
    case 'model':
      return 'Model';
    case 'idle':
      return 'Idle';
    case 'compact':
      return 'Compacting context';
    case 'background':
      return 'Background';
    default:
      if (step.tool?.startsWith('mcp__')) {
        const [, id = '', ...name] = step.tool.split('__');
        // Some connectors are named by a UUID; its first block is enough to tell them apart.
        const server = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id) ? `${id.slice(0, 8)}…` : id;
        return share ? server : [server, ...name].join(' · ');
      }
      return step.tool ?? 'Tool';
  }
}

function shortPath(file: string, cwd: string | undefined, home: string | undefined): string {
  if (cwd && (file === cwd || file.startsWith(cwd + '/'))) return file.slice(cwd.length + 1) || '.';
  if (home && file.startsWith(home + '/')) return '~' + file.slice(home.length);
  return file;
}

/** The program a command really runs, for the unclassified hint. */
function head(command: string): string {
  const argv = splitCommand(command)
    .map((c) => unwrap(c.argv).argv)
    .find(
      (a) =>
        a.length > 0 &&
        !['cd', 'export', 'echo', 'set', 'source'].includes(programName(a[0] ?? '')),
    );
  return argv ? programName(argv[0] ?? '') : 'shell';
}

export function buildReportData(
  analysis: Analysis,
  options: { share?: boolean; home?: string; now?: number } = {},
): ReportData {
  const { session, summary } = analysis;
  const share = options.share ?? false;
  const t0 = session.startMs;
  const byId = new Map(session.steps.map((s) => [s.id, s]));
  const children = new Map<string | null, ClassifiedStep[]>();
  for (const step of session.steps) {
    const parent = step.parentId && byId.has(step.parentId) ? step.parentId : null;
    children.set(parent, [...(children.get(parent) ?? []), step]);
  }
  for (const list of children.values())
    list.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const turnNumber = new Map<string, number>();
  for (const step of session.steps
    .filter((s) => s.kind === 'turn')
    .sort((a, b) => a.startMs - b.startMs)) {
    turnNumber.set(step.id, turnNumber.size + 1);
  }

  const steps: ReportStep[] = [];
  const displayIndex = new Map<string, number>();
  let outputBudget = MAX_OUTPUT_TOTAL;
  const visit = (step: ClassifiedStep, parent: number, depth: number) => {
    const i = steps.length;
    const kids = children.get(step.id) ?? [];
    const out: ReportStep = {
      i,
      p: parent,
      depth,
      kind: step.kind,
      s: step.startMs - t0,
      e: step.endMs - t0,
      label: stepLabel(step, turnNumber, share),
      failed: step.failed,
      flags: step.flags,
      tags: share
        ? step.tags.filter((t) => !/^(script|make|task|file|hook|via|unmatched):/.test(t))
        : step.tags,
      checks: step.checks.map((c) => ({
        key: share ? shareCheck(c.key) : c.key,
        failed: c.failed,
      })),
      container: kids.length > 0,
    };
    if (step.phase) out.phase = step.phase;
    if (step.tool)
      out.tool =
        step.tool.startsWith('mcp__') && share
          ? `mcp__${step.tool.split('__')[1] ?? ''}`
          : step.tool;
    if (step.ok !== undefined) out.ok = step.ok;
    if (step.reworkFor) out.reworkFor = share ? shareCheck(step.reworkFor) : step.reworkFor;
    if (step.runMs !== undefined) out.runMs = step.runMs;
    if (step.waitMs !== undefined) out.waitMs = step.waitMs;
    if (step.exitCode !== undefined) out.exitCode = step.exitCode;
    if (step.model) out.model = step.model;
    if (step.tokens) out.tokens = step.tokens;
    if (step.agentType) out.agentType = step.agentType;
    if (step.kind === 'model' && step.produces?.length) {
      const produced = step.produces
        .map((id) => byId.get(id))
        .filter((s): s is ClassifiedStep => !!s);
      out.text = '→ ' + produced.map((s) => stepLabel(s, turnNumber, share)).join(', ');
    }
    if (!share) {
      if (step.command) out.text = step.command;
      else if (step.files?.length && step.kind === 'tool')
        out.text = step.files.map((f) => shortPath(f, session.cwd, options.home)).join(' ');
      if (step.files?.length)
        out.files = step.files.map((f) => shortPath(f, session.cwd, options.home));
      if (step.detail?.description) out.description = step.detail.description;
      if (step.detail?.output && outputBudget > 0) {
        const text = maskSecrets(step.detail.output).slice(0, MAX_OUTPUT_STEP);
        out.output = text;
        outputBudget -= text.length;
      }
    }
    steps.push(out);
    displayIndex.set(step.id, i);
    for (const kid of kids) visit(kid, i, depth + 1);
  };
  for (const top of children.get(null) ?? []) visit(top, -1, 0);
  for (const step of session.steps) {
    const target = displayIndex.get(step.id);
    if (step.kind !== 'model' || !step.produces?.length || target === undefined) continue;
    const made = step.produces.map((id) => displayIndex.get(id)).filter((i) => i !== undefined);
    if (made.length) (steps[target] as ReportStep).produces = made;
  }

  // Background work doesn't hold the agent up, so it can't be the slow step.
  const leaves = steps.filter(
    (s) =>
      !s.container &&
      s.kind !== 'idle' &&
      s.kind !== 'turn' &&
      s.kind !== 'background' &&
      !s.flags.includes('background'),
  );
  const slowest = [...leaves]
    .sort((a, b) => b.e - b.s - (a.e - a.s))
    .slice(0, 3)
    .map((s) => s.i);

  // Model time is unclassified because the calls it wrote are; it's counted apart from them.
  const MODEL = '\0model';
  const unclassifiedName = (step: ClassifiedStep): string => {
    if (step.kind === 'compact') return 'compaction';
    if (step.tags.includes('polling')) return 'polling';
    if (step.kind === 'model') return MODEL;
    if (step.command && !share) return head(step.command);
    if (step.tool?.startsWith('mcp__')) return stepLabel(step, turnNumber, share);
    return step.tool ?? step.kind;
  };
  // Each unclassified stretch of the timeline goes to one step running then (foreground first, then
  // the latest started), so overlapping steps aren't counted twice and the names add up to the total.
  const segments = phaseSegments(session);
  const owners = session.steps
    .filter((s) => s.phase === 'unclassified' && s.kind !== 'turn' && s.endMs > s.startMs)
    .sort((a, b) => a.startMs - b.startMs);
  const unclassified = new Map<string, number>();
  const add = (name: string, ms: number) =>
    unclassified.set(name, (unclassified.get(name) ?? 0) + ms);
  for (const segment of segments) {
    if (segment.phase !== 'unclassified') continue;
    if (!segment.covered) {
      add('time between steps', segment.end - segment.start);
      continue;
    }
    // Split the stretch where steps start or end, and give each piece to the step running then.
    const running = owners.filter((o) => o.startMs < segment.end && o.endMs > segment.start);
    const cuts = [
      ...new Set([
        segment.start,
        segment.end,
        ...running
          .flatMap((o) => [o.startMs, o.endMs])
          .filter((t) => t > segment.start && t < segment.end),
      ]),
    ].sort((a, b) => a - b);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const a = cuts[k] as number;
      const b = cuts[k + 1] as number;
      let owner: ClassifiedStep | undefined;
      for (const step of running) {
        if (step.startMs >= b || step.endMs <= a) continue;
        const background = step.kind === 'background' || step.flags.includes('background');
        const ownerBackground =
          owner && (owner.kind === 'background' || owner.flags.includes('background'));
        if (
          !owner ||
          (ownerBackground && !background) ||
          (ownerBackground === background && step.startMs >= owner.startMs)
        )
          owner = step;
      }
      add(owner ? unclassifiedName(owner) : 'time between steps', b - a);
    }
  }

  const data: ReportData = {
    v: 1,
    generatedAt: options.now ?? Date.now(),
    share,
    session: {
      id: share ? session.id.slice(0, 8) : session.id,
      agent: session.agent,
      sources: session.sources,
      startMs: t0,
      totalMs: summary.totalMs,
      activeMs: summary.activeMs,
    },
    phases: summary.phases.map((p) => ({
      id: p.phase,
      label: p.label,
      ms: p.ms,
      share: p.share,
      detail: phaseDetail(p),
    })),
    counts: {
      modelCalls: summary.modelCalls,
      toolCalls: summary.toolCalls,
      subagents: summary.subagents,
      failures: summary.failures,
      reworkLoops: summary.rework.filter((w) => w.edits > 0).length,
    },
    rework: summary.rework.map((w) => ({
      check: share ? shareCheck(w.check) : w.check,
      failedAt: w.failedAtMs - t0,
      ...(w.passedAtMs !== undefined ? { passedAt: w.passedAtMs - t0 } : {}),
      edits: w.edits,
    })),
    steps,
    slowest,
    unclassified: [...unclassified]
      .filter(([name]) => name !== MODEL)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, ms]) => ({ name, ms })),
    unclassifiedModelMs: unclassified.get(MODEL) ?? 0,
    timeline: segments.map((g) => [g.start - t0, g.end - t0, g.phase]),
  };
  if (session.agentVersion) data.session.agentVersion = session.agentVersion;
  if (!share && session.title) data.session.title = session.title;
  if (!share && session.cwd) data.session.cwd = shortPath(session.cwd, undefined, options.home);
  if (summary.tokens) data.tokens = summary.tokens;
  return data;
}
