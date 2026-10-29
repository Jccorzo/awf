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
  /** Whether the exit code belongs to the checks (see exitTrust). */
  exit?: ExitTrust;
}

/**
 * Whether a command's exit code tells if its checks passed. `full`: the last check ends the
 * command. `pass`: only commands chained with && follow, so a pass means the checks passed but a
 * failure may be a later command's. `none`: a pipe, `;`, `||` or `&` after the check hides it.
 */
export type ExitTrust = 'full' | 'pass' | 'none';

export interface ClassifiedSession extends Omit<Session, 'steps'> {
  steps: ClassifiedStep[];
}

export interface CommandInfo {
  phase: PhaseId;
  tags: string[];
  checks: Check[];
  rule: string;
  exit?: ExitTrust;
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
  /** The top-level simple command it came from. */
  index?: number;
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

const DOCKER_OPTIONS = [
  '-H',
  '--host',
  '--context',
  '-c',
  '--config',
  '-l',
  '--log-level',
  '-f',
  '--file',
  '-p',
  '--project-name',
  '--profile',
  '--env-file',
  '--project-directory',
];
/** Options that take a value, by program: `kubectl -n prod get pods` runs `get`. */
const VALUE_OPTIONS: Record<string, string[]> = {
  kubectl: [
    '-n',
    '--namespace',
    '--context',
    '--kubeconfig',
    '--cluster',
    '--user',
    '-s',
    '--server',
  ],
  gh: ['-R', '--repo'],
  docker: DOCKER_OPTIONS,
  podman: DOCKER_OPTIONS,
  'docker-compose': DOCKER_OPTIONS,
  bun: ['--cwd'],
  cargo: ['--color', '--config', '-Z', '-C'],
  cross: ['--color', '--config', '-Z'],
  ninja: ['-C', '-f', '-j', '-k', '-l', '-d', '-t', '-w'],
  meson: ['-C'],
  swift: ['--package-path', '--scratch-path', '-c', '--configuration'],
  terraform: ['-chdir'],
  dotnet: ['--project', '-p'],
  xcodebuild: [
    '-scheme',
    '-project',
    '-workspace',
    '-configuration',
    '-destination',
    '-sdk',
    '-target',
    '-derivedDataPath',
    '-resultBundlePath',
    '-testPlan',
    '-xcconfig',
    '-arch',
    '-toolchain',
    '-archivePath',
    '-exportPath',
    '-exportOptionsPlist',
    '-parallel-testing-worker-count',
  ],
  tox: ['-e', '-c', '--conf'],
  nox: ['-s', '--session', '-f', '--noxfile'],
};

/** Arguments that aren't options or an option's value. */
function positionalArgs(program: string, args: string[]): string[] {
  const valued = VALUE_OPTIONS[program] ?? [];
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (valued.includes(arg)) i++;
    else if (!arg.startsWith('-') && !arg.startsWith('+')) out.push(arg);
  }
  return out;
}

/** Task runners that run a named task: `just test`, `task lint`, `mise run build`, `rake spec`. */
const TASK_RUNNERS: Record<string, { sub?: string[]; valueOptions?: string[] }> = {
  just: { valueOptions: ['-f', '--justfile', '-d', '--working-directory', '--set'] },
  task: { valueOptions: ['-t', '--taskfile', '-d', '--dir'] },
  mise: { sub: ['run', 'r'] },
  poe: {},
  devbox: { sub: ['run'] },
  composer: { valueOptions: ['-d', '--working-dir'] },
  rake: { valueOptions: ['-f', '--rakefile'] },
  invoke: {},
  inv: {},
};

const COMPOSER_COMMANDS = new Set([
  'install',
  'i',
  'update',
  'u',
  'upgrade',
  'require',
  'r',
  'remove',
  'rm',
  'dump-autoload',
  'dumpautoload',
  'show',
  'info',
  'outdated',
  'validate',
  'diagnose',
  'config',
  'create-project',
  'init',
  'search',
  'depends',
  'why',
  'prohibits',
  'why-not',
  'audit',
  'global',
  'exec',
  'archive',
  'licenses',
  'status',
  'self-update',
  'clear-cache',
  'check-platform-reqs',
  'fund',
  'bump',
  'reinstall',
  'list',
  'help',
]);

/** Run several package scripts: `run-s lint test`, `npm-run-all -p a b`, `concurrently "npm:x"`. */
const SCRIPT_RUNNERS = new Set([
  'run-s',
  'run-p',
  'npm-run-all',
  'npm-run-all2',
  'concurrently',
  'start-server-and-test',
  'server-test',
  'start-test',
]);

/** `sed -i`, `perl -pi`, `yq -i`, `gawk -i inplace`, `sort -o f`: an in-place edit, and its files. */
function inPlaceEdit(program: string, args: string[]): string[] | undefined {
  const positional = args.filter((a) => !a.startsWith('-'));
  if (program === 'sed' || program === 'gsed') {
    const inPlace = args.some((a) => /^-[a-zA-Z]*i/.test(a) || a.startsWith('--in-place'));
    if (!inPlace) return undefined;
    const script = args.some((a) => a === '-e' || a === '-f' || a === '--expression') ? 0 : 1;
    return positional.slice(script);
  }
  if (program === 'perl') {
    const inPlace = args.some((a) => {
      if (!/^-[^-]/.test(a)) return false;
      for (const letter of a.slice(1)) {
        if (letter === 'i') return true;
        if ('MmIdDxeEFlC0'.includes(letter)) return false; // takes a value: the rest is it
      }
      return false;
    });
    return inPlace ? positional.slice(1) : undefined;
  }
  if (program === 'yq') {
    return args.some((a) => a === '-i' || a === '--inplace') ? positional.slice(1) : undefined;
  }
  if (program === 'gawk' || program === 'awk') {
    const i = args.indexOf('-i');
    return i >= 0 && args[i + 1] === 'inplace' ? positional.slice(2) : undefined;
  }
  if (program === 'sort') {
    const i = args.indexOf('-o');
    return i >= 0 && args[i + 1] ? [args[i + 1] as string] : undefined;
  }
  return undefined;
}
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
    const parts = this.parts(text, cwd, 0);
    const info = this.combine(parts, cwd);
    if (info.checks.length > 0) info.exit = exitTrust(splitCommand(text), parts);
    return info;
  }

  isTestFile(file: string): boolean {
    return matchesAny(file, this.rules.testFiles);
  }

  private parts(text: string, cwd: string, depth: number): Part[] {
    const parts: Part[] = [];
    const simples = splitCommand(text);
    simples.forEach((simple, index) => {
      if (simple.argv[0] === 'cd') return;
      const where = simple.cd.reduce((dir, target) => resolvePath(dir, target), cwd);
      const made = this.simple(simple, where, depth);
      if (depth === 0) for (const part of made) part.index = index;
      parts.push(...made);
    });
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
      const expanded = this.expanded(argv, program, cwd, depth, simple.piped);
      if (expanded) return [...out, ...expanded];
      const resolved = this.resolved(argv, cwd, depth, simple.piped);
      if (resolved) return [...out, ...resolved];
    }
    out.push(this.byRule(argv, program, simple.piped, []));
    return out;
  }

  /** The phase a script, target or task name suggests: its first word decides (build:test is a build). */
  byName(name: string): (typeof this.rules.scripts)[number] | undefined {
    const first = name.split(/[:_-]/)[0] ?? name;
    return (
      this.rules.scripts.find((r) => r.match.test(first)) ??
      this.rules.scripts.find((r) => r.match.test(name))
    );
  }

  private named(runner: string, name: string, piped: boolean, tag: string): Part {
    const rule = this.byName(name);
    if (!rule) return { ...this.unmatched(runner, piped), tags: [tag] };
    return this.part(rule.phase, runner, rule.id, piped, ['by-name', tag], `${runner} ${name}`);
  }

  /** Commands that run other commands awf can name: find -exec, task runners, script runners. */
  private expanded(
    argv: string[],
    program: string,
    cwd: string,
    depth: number,
    piped: boolean,
  ): Part[] | undefined {
    const args = argv.slice(1);
    if (program === 'find' || program === 'fd' || program === 'fdfind') {
      const at = args.findIndex((a) =>
        ['-exec', '-execdir', '-ok', '-okdir', '-x', '--exec', '-X', '--exec-batch'].includes(a),
      );
      const parts: Part[] = [];
      if (args.includes('-delete'))
        parts.push({ ...this.part('writing', program, 'find-delete', piped, [], program) });
      if (at >= 0) {
        const rest = args.slice(at + 1);
        const stop = rest.findIndex((a) => a === ';' || a === '+');
        const inner = stop >= 0 ? rest.slice(0, stop) : rest;
        if (inner.length > 0)
          parts.push(...this.simple({ argv: inner, writes: [], cd: [], piped }, cwd, depth + 1));
      }
      if (parts.length === 0) return undefined;
      return [
        this.byRule(
          [argv[0] as string, ...args.slice(0, at >= 0 ? at : args.length)],
          program,
          piped,
          [],
        ),
        ...parts,
      ];
    }
    const runner = TASK_RUNNERS[program];
    if (runner) {
      let rest = args;
      if (runner.sub) {
        const at = rest.findIndex((a) => !a.startsWith('-'));
        if (at < 0 || !runner.sub.includes(rest[at] as string)) return undefined;
        rest = rest.slice(at + 1);
      }
      const names = positionals(rest, runner.valueOptions ?? []).filter((n) => !n.includes('='));
      if (program === 'composer') {
        // composer runs scripts as `composer run x` or `composer x`; its own commands go to the rules.
        if (['run', 'run-script'].includes(names[0] ?? '')) names.shift();
        else if (COMPOSER_COMMANDS.has(names[0] ?? '')) return undefined;
      }
      const name = names[0];
      if (!name) return undefined;
      return [this.named(program, name, piped, `task:${name}`)];
    }
    if (SCRIPT_RUNNERS.has(program)) {
      const valueOptions =
        program === 'concurrently'
          ? [
              '-n',
              '--names',
              '-c',
              '--prefix-colors',
              '-p',
              '--prefix',
              '-m',
              '--max-processes',
              '--success',
              '-t',
              '--timestamp-format',
              '--restart-tries',
              '--restart-after',
            ]
          : ['--max-parallel', '--npm-path'];
      let names = positionals(args, valueOptions);
      if (program.includes('server') || program.endsWith('start-test')) names = names.slice(-1); // start, url, then the test script
      if (names.length === 0) return undefined;
      const parts = names.flatMap((name) => {
        const shorthand = /^(npm|pnpm|yarn|bun):(.+)$/.exec(name);
        const command =
          program === 'concurrently' && !shorthand ? name : `npm run ${shorthand?.[2] ?? name}`;
        return this.parts(command, cwd, depth + 1);
      });
      return parts.map((p) => ({
        ...p,
        piped: p.piped || piped,
        tags: unique([...p.tags, `via:${program}`]),
      }));
    }
    return undefined;
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
        const rule = this.byName(res.name);
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
        const rule = this.byName(res.target);
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
          // turbo, nx and lerna run package scripts by name; Gradle names a task by its path.
          if (['turbo', 'nx', 'lerna'].includes(res.runner))
            return this.named(
              res.runner,
              task.replace(/^[^:]+:(?=[^:]+:)/, ''),
              piped,
              `task:${task}`,
            );
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
    const edited = inPlaceEdit(program, argv.slice(1));
    if (edited)
      return {
        ...this.part('writing', program, 'in-place-edit', piped, tags, program),
        files: edited,
      };
    // `script/test` and `bin/test` are scripts, not the shell's test builtin.
    const byPath = (argv[0] ?? '').includes('/');
    const rule = this.rules.commands.find(
      (r) => !(byPath && r.phase === 'neutral') && ruleMatches(r, program, argv),
    );
    if (!rule) return { ...this.unmatched(program, piped), tags };
    const sub = positionalArgs(program, argv.slice(1))[0] ?? '';
    const part = this.part(
      rule.phase,
      program,
      rule.id,
      piped,
      rule.tag ? [rule.tag, ...tags] : tags,
      rule.tool?.replace('{1}', sub) ?? program,
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
        if (info.exit) step.exit = info.exit;
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

  /**
   * Rule 4: the exit code decides when it belongs to the checks. Output patterns decide when a pipe,
   * `;` or `|| true` hid it, or when a command chained after the checks may have failed instead.
   * A tool's own pattern names the check that failed.
   */
  private markFailures(step: ClassifiedStep): void {
    if (step.checks.length === 0) return;
    const exit = step.exit ?? 'full';
    const stopped = step.flags.includes('interrupted') || step.flags.includes('denied');
    const known = step.ok !== undefined && !stopped;
    const passed = known && step.ok === true && exit !== 'none';
    const output = step.detail?.output;
    const byTool = (tool: string) => this.rules.failurePatterns.filter((p) => p.tool === tool);
    const named = output
      ? step.checks.filter((c) => byTool(c.tool).some((p) => p.pattern.test(output)))
      : [];
    const generic = output ? byTool('*').some((p) => p.pattern.test(output)) : false;
    const top = () => [...step.checks].sort((a, b) => RANK[b.phase] - RANK[a.phase])[0] as Check;
    const blame = (checks: Check[], sure: boolean) => {
      for (const check of checks) check.failed = true;
      if (!sure) step.tags = unique([...step.tags, 'failure-unattributed']);
    };
    if (passed) {
      // Exit 0 from the checks themselves: a pattern in passing output (a test named "...FAILED")
      // doesn't make it a failure.
    } else if (named.length > 0) {
      blame(named, true);
    } else if (known && step.ok === false) {
      if (exit === 'full') blame([top()], step.checks.length === 1);
      // Something failed, maybe after the checks passed: without output, or with a generic
      // failure line in it, blame the check, unsure; output with neither clears it.
      else if (!output || generic) blame([top()], false);
    } else if (generic) {
      blame([top()], step.checks.length === 1);
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

/** See ExitTrust. */
function exitTrust(simples: SimpleCommand[], parts: Part[]): ExitTrust {
  const withChecks = parts.filter((p) => p.checks.length > 0 && p.index !== undefined);
  if (withChecks.length === 0) return 'full';
  const last = Math.max(...withChecks.map((p) => p.index as number));
  if (simples[last]?.substituted) return 'none';
  // A pipe inside what the check ran: a script's `vitest | tee out`, `bash -c "pytest | tail"`.
  const own = parts.filter((p) => p.index === last);
  const lastCheck = own.findLastIndex((p) => p.checks.length > 0);
  if (own.slice(lastCheck + 1).some((p) => p.piped)) return 'none';
  let trust: ExitTrust = 'full';
  for (let k = last; k < simples.length; k++) {
    const op = simples[k]?.next;
    if (op === undefined) break;
    if (op === '(' || op === ')') continue;
    if (op === '|' || op === '|&') {
      if (k === last) return 'none';
      trust = 'pass';
      continue;
    }
    if (op === '&') return 'none';
    if (k === simples.length - 1) break; // a trailing ; or newline
    if (op === '&&') {
      trust = 'pass';
      continue;
    }
    return 'none'; // ;, newline, ||: what follows sets the exit code
  }
  return trust;
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
    // A cd in a subshell or a substitution ends with it.
    if (simple.subshell || simple.substituted) continue;
    if ((simple.argv[0] === 'cd' || simple.argv[0] === 'pushd') && !simple.piped)
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
    const positional = positionalArgs(program, args);
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

function positionals(args: string[], valueOptions: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (arg === '--') break;
    if (valueOptions.includes(arg)) i++;
    else if (!arg.startsWith('-')) out.push(arg);
  }
  return out;
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
