import path from 'node:path';
import type { Session, Step } from '../model/types';
import { AGENT_TOOLS } from '../recorder/steps';
import { matchesAny } from './glob';
import { type CheckPhase, isCheckPhase, type PhaseId, RANK, topPhase } from './phases';
import { diskFiles, type Files, resolve, resolvePath } from './resolve';
import { type CommandRule, loadRules, type RulePhase, type Rules } from './rules';
import {
  programName,
  shellString,
  type SimpleCommand,
  splitCommand,
  stripHeredocs,
  unwrap,
} from './shell';

/** One lint, test or build run inside a step. */
export interface Check {
  /** The same check across runs: phase and tool, like "tests:vitest". */
  key: string;
  phase: CheckPhase;
  tool: string;
  failed: boolean;
}

export interface ClassifiedStep extends Step {
  /** Undefined for containers (turns, subagents, Agent calls), whose time their children carry. */
  phase?: PhaseId;
  /** Other phases a compound command touched, and notes like install, by-name or script:test. */
  tags: string[];
  checks: Check[];
  failed: boolean;
  /** The rule that decided, for awf stats and debugging. */
  rule?: string;
  /** Set by the rework detector: the check this edit reworks. */
  reworkFor?: string;
}

export interface ClassifiedSession extends Omit<Session, 'steps'> {
  steps: ClassifiedStep[];
}

export interface CommandInfo {
  phase: PhaseId;
  tags: string[];
  checks: Check[];
  rule: string;
}

interface Part {
  phase: RulePhase | undefined;
  program: string;
  tags: string[];
  checks: Check[];
  rule: string;
  files: string[];
  piped: boolean;
  /** Part of a command that waits: a sleep in a loop, or a long sleep. */
  polling?: boolean;
}

const MAX_DEPTH = 4;

/** Rank within one command (rule 2): an unmatched part outranks the near-instant phases. */
const COMPOUND_RANK: Record<PhaseId, number> = {
  build: 10,
  tests: 9,
  lint: 8,
  unclassified: 7,
  rework: 6,
  'writing-tests': 5,
  'writing-code': 4,
  exploring: 3,
  planning: 2,
  waiting: 1,
};

/** `sleep 30`, `sleep 1.5`, `sleep 2m`: the seconds a sleep waits (0 when unreadable). */
function sleepSeconds(arg: string | undefined): number {
  const match = /^(\d+(?:\.\d+)?)([smhd]?)$/.exec(arg ?? '');
  if (!match) return 0;
  const unit: Record<string, number> = { '': 1, s: 1, m: 60, h: 3600, d: 86400 };
  return Number(match[1]) * (unit[match[2] ?? ''] ?? 1);
}

const BACKGROUND_TOOLS = new Set(['TaskOutput', 'BashOutput', 'KillShell', 'KillBash', 'TaskStop']);
const WRITERS = new Set([
  'mkdir',
  'touch',
  'cp',
  'mv',
  'rm',
  'rmdir',
  'ln',
  'tee',
  'truncate',
  'install',
  'rsync',
  'patch',
  'sed',
  'gsed',
  'perl',
  'ditto',
  'unzip',
]);

export class Classifier {
  constructor(
    readonly rules: Rules,
    private readonly files: Files,
  ) {}

  /** Classifies one Bash command run in `cwd`. */
  command(text: string, cwd: string): CommandInfo {
    return this.combine(this.parts(text, cwd, 0), cwd);
  }

  isTestFile(file: string): boolean {
    return matchesAny(file, this.rules.testFiles);
  }

  private parts(text: string, cwd: string, depth: number): Part[] {
    const parts: Part[] = [];
    const simples = splitCommand(text);
    for (const simple of simples) {
      if (simple.argv[0] === 'cd') continue;
      const where = simple.cd.reduce((dir, target) => resolvePath(dir, target), cwd);
      parts.push(...this.simple(simple, where, depth));
    }
    // Waiting for something: `sleep` inside a loop, or a sleep of 5 seconds or more.
    const sleeps = simples
      .map((s) => unwrap(s.argv).argv)
      .filter((a) => programName(a[0] ?? '') === 'sleep');
    const loop = /(^|[\s;&|])(while|until|for)\s[\s\S]*(^|[\s;])do(\s|$)/m.test(
      stripHeredocs(text),
    );
    if (sleeps.length > 0 && (loop || sleeps.some((a) => sleepSeconds(a[1]) >= 5))) {
      for (const part of parts) part.polling = true;
    }
    return parts;
  }

  private simple(simple: SimpleCommand, cwd: string, depth: number): Part[] {
    const argv = withoutGlobalOptions(unwrap(simple.argv).argv);
    const program = programName(argv[0] ?? '');
    const out: Part[] = [];
    if (simple.writes.length > 0) {
      out.push({
        phase: 'writing',
        program,
        tags: [],
        checks: [],
        rule: 'redirect',
        files: simple.writes,
        piped: simple.piped,
      });
    }
    const inner = shellString(argv);
    if (inner !== undefined && depth < MAX_DEPTH) {
      return [
        ...out,
        ...this.parts(inner, cwd, depth + 1).map((p) => ({ ...p, piped: p.piped || simple.piped })),
      ];
    }
    if (depth < MAX_DEPTH) {
      const resolved = this.resolved(argv, cwd, depth, simple.piped);
      if (resolved) return [...out, ...resolved];
    }
    out.push(this.byRule(argv, program, simple.piped, []));
    return out;
  }

  /** Scripts, make targets, task runners, hooks and script files, classified by what they run. */
  private resolved(argv: string[], cwd: string, depth: number, piped: boolean): Part[] | undefined {
    const res = resolve(argv, cwd, this.files);
    if (!res) return undefined;
    const program = programName(argv[0] ?? '');
    const tagged = (parts: Part[], tag: string) =>
      parts.map((p) => ({ ...p, piped: p.piped || piped, tags: unique([...p.tags, tag]) }));
    switch (res.kind) {
      case 'script': {
        const parts = res.commands.flatMap((c) => this.parts(c, res.cwd, depth + 1));
        return tagged(
          parts.length > 0 ? parts : [this.unmatched(program, piped)],
          `script:${res.name}`,
        );
      }
      case 'make': {
        const parts = res.commands.flatMap((c) => this.parts(c, res.cwd, depth + 1));
        return tagged(
          parts.length > 0 ? parts : [this.unmatched(program, piped)],
          `make:${res.target}`,
        );
      }
      case 'hook':
      case 'file': {
        const parts = res.commands.flatMap((c) => this.parts(c, res.cwd, depth + 1));
        const tag = res.kind === 'hook' ? `hook:${res.name}` : `file:${res.file}`;
        return tagged(parts.length > 0 ? parts : [this.unmatched(program, piped)], tag);
      }
      case 'bin': {
        const parts = this.simple({ argv: res.argv, writes: [], cd: [], piped }, cwd, depth + 1);
        return tagged(parts, `via:${program}`);
      }
      case 'script-name': {
        const rule = this.rules.scripts.find((r) => r.match.test(res.name));
        if (rule)
          return [
            this.part(
              rule.phase,
              res.name,
              rule.id,
              piped,
              ['by-name', `script:${res.name}`],
              `${res.runner} ${res.name}`,
            ),
          ];
        return tagged(
          this.simple({ argv: [res.name, ...res.rest], writes: [], cd: [], piped }, cwd, depth + 1),
          `script:${res.name}`,
        );
      }
      case 'make-name': {
        if (!res.target)
          return [this.part('build', 'make', 'make:default', piped, ['by-default'], 'make')];
        const rule = this.rules.scripts.find((r) => r.match.test(res.target as string));
        if (rule)
          return [
            this.part(
              rule.phase,
              'make',
              rule.id,
              piped,
              ['by-name', `make:${res.target}`],
              `make ${res.target}`,
            ),
          ];
        return [{ ...this.unmatched('make', piped), tags: [`make:${res.target}`] }];
      }
      case 'tasks': {
        return res.tasks.map((task) => {
          const last = task.split(':').pop() ?? task;
          const rule = this.rules.tasks.find((r) => r.match.test(task) || r.match.test(last));
          if (!rule) return { ...this.unmatched(res.runner, piped), tags: [`task:${task}`] };
          return this.part(rule.phase, res.runner, rule.id, piped, [`task:${task}`], res.runner);
        });
      }
    }
  }

  private part(
    phase: RulePhase,
    program: string,
    rule: string,
    piped: boolean,
    tags: string[],
    tool: string,
  ): Part {
    const checks: Check[] = isCheckPhase(phase)
      ? [{ key: `${phase}:${tool}`, phase, tool, failed: false }]
      : [];
    return { phase, program, tags, checks, rule, files: [], piped };
  }

  private unmatched(program: string, piped: boolean): Part {
    return { phase: undefined, program, tags: [], checks: [], rule: 'none', files: [], piped };
  }

  private byRule(argv: string[], program: string, piped: boolean, tags: string[]): Part {
    const rule = this.rules.commands.find((r) => ruleMatches(r, program, argv));
    if (!rule) return { ...this.unmatched(program, piped), tags };
    const part = this.part(
      rule.phase,
      program,
      rule.id,
      piped,
      rule.tag ? [rule.tag, ...tags] : tags,
      rule.tool ?? program,
    );
    if (rule.phase === 'writing' && WRITERS.has(program)) {
      part.files = argv.slice(1).filter((a) => !a.startsWith('-') && /[/.]/.test(a));
    }
    return part;
  }

  /**
   * Rule 2: a compound command takes its highest-ranked phase; the rest become tags. A part no rule
   * matches ranks above Writing and Exploring: those commands take next to no time, so the unknown
   * part most likely took it. Waiting in a loop or a long sleep, with no check, is polling.
   */
  private combine(parts: Part[], cwd: string): CommandInfo {
    const counted = parts.filter(
      (p) => p.phase !== 'neutral' && (!p.piped || isCheckPhase(p.phase) || p.phase === 'writing'),
    );
    const resolvedPhase = (p: Part): PhaseId => {
      if (p.phase === undefined) return 'unclassified';
      if (p.phase === 'writing') {
        return p.files.some((f) => this.isTestFile(path.isAbsolute(f) ? f : path.join(cwd, f)))
          ? 'writing-tests'
          : 'writing-code';
      }
      return p.phase as PhaseId;
    };
    const phases = counted.map(resolvedPhase);
    const hasCheck = phases.some((p) => isCheckPhase(p));
    const polling = !hasCheck && parts.some((p) => p.polling);
    let primary: PhaseId | undefined = polling ? 'unclassified' : undefined;
    if (!primary) {
      for (const phase of phases) {
        if (!primary || COMPOUND_RANK[phase] > COMPOUND_RANK[primary]) primary = phase;
      }
    }
    const tags = new Set<string>();
    for (const part of parts) for (const tag of part.tags) tags.add(tag);
    for (const phase of phases) if (phase !== primary && phase !== 'unclassified') tags.add(phase);
    for (const part of parts) if (!part.phase) tags.add(`unmatched:${part.program}`);
    if (polling) tags.add('polling');
    const checks = new Map<string, Check>();
    for (const part of parts)
      for (const check of part.checks)
        if (!checks.has(check.key)) checks.set(check.key, { ...check });
    if (!primary || primary === 'unclassified') {
      const onlyNeutral =
        parts.length > 0 && parts.every((p) => p.phase === 'neutral' || (p.piped && p.phase));
      if (onlyNeutral && !polling) tags.add('neutral');
      const rule = onlyNeutral
        ? (parts.find((p) => p.phase === 'neutral')?.rule ?? 'none')
        : 'none';
      return { phase: 'unclassified', tags: [...tags], checks: [...checks.values()], rule };
    }
    const decider = counted[phases.indexOf(primary)];
    return {
      phase: primary,
      tags: [...tags],
      checks: [...checks.values()],
      rule: decider?.rule ?? 'none',
    };
  }

  /** Classifies a whole session: every step gets a phase (containers excepted), checks and failures. */
  session(session: Session): ClassifiedSession {
    const steps: ClassifiedStep[] = session.steps.map((s) => ({
      ...s,
      tags: [],
      checks: [],
      failed: false,
    }));
    const byId = new Map(steps.map((s) => [s.id, s]));
    const hasChildren = new Set(steps.map((s) => s.parentId).filter((id): id is string => !!id));
    const home = session.cwd ?? process.cwd();
    const shellCwd = new Map<string, string>();

    // Tool calls and background shells first, in time order (so `cd` carries over between calls).
    const ordered = steps
      .filter((s) => s.kind === 'tool' || s.kind === 'background')
      .sort((a, b) => a.startMs - b.startMs);
    for (const step of ordered) {
      if (step.kind === 'background' || isShellTool(step.tool)) {
        const ctx = step.agentId ?? '';
        const cwd = shellCwd.get(ctx) ?? home;
        if (!step.command) {
          step.phase = 'unclassified';
          step.tags = ['no-command'];
          continue;
        }
        const info = this.command(step.command, cwd);
        Object.assign(step, {
          phase: info.phase,
          tags: info.tags,
          checks: info.checks,
          rule: info.rule,
        });
        if (step.kind === 'tool') shellCwd.set(ctx, nextCwd(step.command, cwd, home));
        this.markFailures(step);
      } else {
        this.tool(step, hasChildren);
      }
    }
    // Calls that wait on a background task take its phase.
    for (const step of ordered) {
      if (step.kind !== 'tool' || !step.tool || !BACKGROUND_TOOLS.has(step.tool)) continue;
      const source = steps.find(
        (s) =>
          s !== step &&
          s.backgroundId &&
          s.backgroundId === step.backgroundId &&
          s.phase &&
          s.phase !== 'unclassified',
      );
      if (source?.phase) {
        step.phase = source.phase;
        step.tags = unique([...step.tags, 'background-task']);
      }
    }
    for (const step of steps) {
      if (step.kind === 'model') step.phase = this.modelPhase(step, byId);
      else if (step.kind === 'idle') step.phase = 'waiting';
      else if (step.kind === 'compact') {
        step.phase = 'unclassified';
        step.tags = ['compaction'];
      }
    }
    return { ...session, steps };
  }

  private tool(step: ClassifiedStep, hasChildren: Set<string>): void {
    const name = step.tool ?? '';
    if (AGENT_TOOLS.has(name)) {
      // Its subagent's steps carry its time; without them we don't know what it did.
      if (!hasChildren.has(step.id)) {
        step.phase = 'unclassified';
        step.tags = ['subagent'];
      }
      return;
    }
    if (BACKGROUND_TOOLS.has(name)) {
      step.phase = 'unclassified';
      step.tags = ['background-task'];
      return;
    }
    const rule = this.rules.tools.find((r) => r.names?.has(name) || r.match?.test(name));
    if (!rule || rule.phase === 'neutral') {
      step.phase = 'unclassified';
      return;
    }
    step.rule = rule.id;
    if (rule.phase === 'writing') {
      step.phase = (step.files ?? []).some((f) => this.isTestFile(f))
        ? 'writing-tests'
        : 'writing-code';
    } else {
      step.phase = rule.phase as PhaseId;
      if (isCheckPhase(rule.phase)) {
        step.checks = [
          { key: `${rule.phase}:${name}`, phase: rule.phase, tool: name, failed: false },
        ];
        this.markFailures(step);
      }
    }
  }

  /** Rule 4: exit code or failure event, else output patterns; a tool's own pattern names the check. */
  private markFailures(step: ClassifiedStep): void {
    if (step.checks.length === 0) return;
    const stopped = step.flags.includes('interrupted') || step.flags.includes('denied');
    const output = step.detail?.output;
    const byTool = (tool: string) => this.rules.failurePatterns.filter((p) => p.tool === tool);
    const named = output
      ? step.checks.filter((c) => byTool(c.tool).some((p) => p.pattern.test(output)))
      : [];
    const generic = output ? byTool('*').some((p) => p.pattern.test(output)) : false;
    if (named.length > 0) {
      for (const check of named) check.failed = true;
    } else if ((step.ok === false && !stopped) || generic) {
      const top = [...step.checks].sort((a, b) => RANK[b.phase] - RANK[a.phase])[0] as Check;
      top.failed = true;
      if (step.checks.length > 1) step.tags = unique([...step.tags, 'failure-unattributed']);
    }
    step.failed = step.checks.some((c) => c.failed);
  }

  /** Rule 1: model time takes the phase of the call it produced. */
  private modelPhase(step: ClassifiedStep, byId: Map<string, ClassifiedStep>): PhaseId {
    const phases: PhaseId[] = [];
    for (const id of step.produces ?? []) {
      const produced = byId.get(id);
      if (!produced) continue;
      if (produced.tool && AGENT_TOOLS.has(produced.tool)) phases.push('planning');
      else if (produced.phase === 'waiting') phases.push('planning');
      else if (produced.phase) phases.push(produced.phase);
    }
    return topPhase(phases) ?? 'planning';
  }
}

/** `git -C dir -c k=v --no-pager status` is `git status` to the rules. */
function withoutGlobalOptions(argv: string[]): string[] {
  if (programName(argv[0] ?? '') !== 'git') return argv;
  const out = [argv[0] as string];
  let i = 1;
  while (i < argv.length) {
    const arg = argv[i] as string;
    if (
      arg === '-C' ||
      arg === '-c' ||
      arg === '--git-dir' ||
      arg === '--work-tree' ||
      arg === '--namespace'
    )
      i += 2;
    else if (
      arg.startsWith('--git-dir=') ||
      arg.startsWith('--work-tree=') ||
      arg === '--no-pager' ||
      arg === '-P' ||
      arg === '--paginate' ||
      arg === '--bare' ||
      arg === '--no-optional-locks'
    )
      i++;
    else break;
  }
  return [...out, ...argv.slice(i)];
}

function isShellTool(tool: string | undefined): boolean {
  return (
    tool === 'Bash' || tool === 'PowerShell' || tool === 'shell' || tool === 'run_shell_command'
  );
}

/** The shell's directory after a command: `cd` persists between calls, unless it leaves the project. */
function nextCwd(command: string, cwd: string, home: string): string {
  let dir = cwd;
  for (const simple of splitCommand(command)) {
    if (simple.argv[0] === 'cd' && !simple.piped)
      dir = resolvePath(
        simple.cd.reduce((d, t) => resolvePath(d, t), cwd),
        simple.argv[1] ?? '~',
      );
  }
  return dir === home || dir.startsWith(home + path.sep) ? dir : home;
}

function ruleMatches(rule: CommandRule, program: string, argv: string[]): boolean {
  if (rule.programs && !rule.programs.has(program)) return false;
  const args = argv.slice(1);
  if (rule.match && !rule.match.test(argv.join(' '))) return false;
  if (rule.args) {
    const positional = args.filter((a) => !a.startsWith('-') && !a.startsWith('+'));
    let at = 0;
    for (let i = 0; i < rule.args.length; i++) {
      const options = rule.args[i] as string[];
      const fits = (word: string | undefined) =>
        word !== undefined &&
        options.some((o) => (o.endsWith('*') ? word.startsWith(o.slice(0, -1)) : o === word));
      if (i === 0) {
        if (!fits(positional[0])) return false;
        at = 1;
        continue;
      }
      // Later words may come after an option's value: `docker compose -f x.yml build`.
      const found = positional.slice(at, at + 3).findIndex(fits);
      if (found < 0) return false;
      at += found + 1;
    }
  }
  const has = (flag: string) => args.some((a) => a === flag || a.startsWith(flag + '='));
  if (rule.with && !rule.with.every(has)) return false;
  if (rule.without && rule.without.some(has)) return false;
  if (rule.only && !args.every((a) => rule.only?.has(a))) return false;
  return true;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/** Classifies a session with the built-in rules and the project's `.awf/rules.yaml`. */
export function classifySession(
  session: Session,
  options: { files?: Files; rules?: Rules } = {},
): ClassifiedSession {
  const files = options.files ?? diskFiles();
  const rules = options.rules ?? loadRules(session.cwd, files);
  return new Classifier(rules, files).session(session);
}
