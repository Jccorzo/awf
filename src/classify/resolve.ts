// Resolves scripts and task runners to what they actually run (docs/phases.md, rule 3).
import { existsSync, readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import { firstPositional, programName, scriptFile } from './shell';

export interface Files {
  /** File contents, or undefined if it doesn't exist or can't be read. */
  read(file: string): string | undefined;
}

const MAX_FILE = 512 * 1024;

/** Reads files from disk, once each. */
export function diskFiles(): Files {
  const cache = new Map<string, string | undefined>();
  return {
    read(file) {
      if (cache.has(file)) return cache.get(file);
      let text: string | undefined;
      try {
        if (existsSync(file) && statSync(file).isFile() && statSync(file).size <= MAX_FILE) {
          text = readFileSync(file, 'utf8');
        }
      } catch {
        text = undefined;
      }
      cache.set(file, text);
      return text;
    },
  };
}

/** A fixed set of files, for tests. */
export function memoryFiles(entries: Record<string, string>): Files {
  return { read: (file) => entries[path.resolve(file)] ?? entries[file] };
}

export type Resolution =
  /** A script read from its file: its commands (pre, main, post). */
  | { kind: 'script'; runner: string; name: string; commands: string[]; cwd: string }
  /** A script whose file couldn't be read: its name decides. `rest` are the arguments after it. */
  | { kind: 'script-name'; runner: string; name: string; rest: string[] }
  /** Not a script after all: the runner runs a binary (`pnpm tsc`). */
  | { kind: 'bin'; argv: string[] }
  | { kind: 'make'; target: string; commands: string[]; cwd: string }
  | { kind: 'make-name'; target?: string }
  | { kind: 'tasks'; runner: string; tasks: string[] }
  | { kind: 'hook'; name: string; commands: string[]; cwd: string }
  | { kind: 'file'; file: string; commands: string[]; cwd: string };

export function findUp(
  start: string,
  names: string[],
  files: Files,
): { dir: string; file: string; text: string } | undefined {
  let dir = path.resolve(start);
  for (let i = 0; i < 16; i++) {
    for (const name of names) {
      const file = path.join(dir, name);
      const text = files.read(file);
      if (text !== undefined) return { dir, file, text };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

export function resolvePath(cwd: string, target: string): string {
  if (target === '~' || target.startsWith('~/')) return path.join(os.homedir(), target.slice(1));
  return path.resolve(cwd, target);
}

function optionValue(args: string[], names: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (names.includes(arg)) return args[i + 1];
    for (const name of names) {
      if (name.startsWith('--') && arg.startsWith(name + '=')) return arg.slice(name.length + 1);
      if (!name.startsWith('--') && arg.startsWith(name) && arg.length > name.length)
        return arg.slice(name.length);
    }
  }
  return undefined;
}

const NPM_ALIASES: Record<string, string> = {
  t: 'test',
  tst: 'test',
  test: 'test',
  start: 'start',
  stop: 'stop',
  restart: 'restart',
};
const NPM_RUN = new Set(['run', 'run-script', 'rum', 'urn']);
const PNPM_BUILTINS = new Set([
  'add',
  'install',
  'i',
  'update',
  'up',
  'upgrade',
  'remove',
  'rm',
  'uninstall',
  'un',
  'link',
  'ln',
  'unlink',
  'import',
  'rebuild',
  'rb',
  'prune',
  'fetch',
  'patch',
  'patch-commit',
  'patch-remove',
  'audit',
  'list',
  'ls',
  'll',
  'outdated',
  'why',
  'licenses',
  'exec',
  'dlx',
  'create',
  'init',
  'publish',
  'pack',
  'store',
  'server',
  'env',
  'setup',
  'config',
  'c',
  'get',
  'set',
  'bin',
  'root',
  'dedupe',
  'deploy',
  'doctor',
  'self-update',
  'approve-builds',
  'ignored-builds',
  'cat-file',
  'cat-index',
  'find-hash',
  'recursive',
  'help',
]);
const YARN_BUILTINS = new Set([
  'add',
  'install',
  'remove',
  'upgrade',
  'up',
  'run',
  'exec',
  'dlx',
  'workspace',
  'workspaces',
  'why',
  'info',
  'list',
  'config',
  'cache',
  'init',
  'create',
  'global',
  'link',
  'unlink',
  'pack',
  'publish',
  'version',
  'versions',
  'outdated',
  'audit',
  'bin',
  'dedupe',
  'set',
  'plugin',
  'constraints',
  'npm',
  'node',
  'explain',
  'patch',
  'patch-commit',
  'rebuild',
  'search',
  'stage',
  'unplug',
  'import',
  'help',
  'login',
  'logout',
  'owner',
  'tag',
  'team',
  'check',
  'autoclean',
  'licenses',
  'generate-lock-entry',
  'policies',
]);
const BUN_BUILTINS = new Set([
  'test',
  'build',
  'install',
  'i',
  'add',
  'a',
  'remove',
  'rm',
  'update',
  'outdated',
  'link',
  'unlink',
  'pm',
  'x',
  'create',
  'init',
  'upgrade',
  'publish',
  'patch',
  'repl',
  'exec',
  'audit',
  'info',
  'why',
  'help',
]);

const PNPM_VALUE_OPTIONS = [
  '-C',
  '--dir',
  '--filter',
  '-F',
  '--workspace-concurrency',
  '--reporter',
  '--loglevel',
  '--test-pattern',
];
const YARN_VALUE_OPTIONS = ['--cwd'];
const NPM_VALUE_OPTIONS = ['--prefix', '-w', '--workspace', '--loglevel', '--userconfig'];

function packageScripts(
  cwd: string,
  files: Files,
): { scripts: Record<string, string>; dir: string } | undefined {
  const found = findUp(cwd, ['package.json'], files);
  if (!found) return undefined;
  try {
    const pkg = JSON.parse(found.text) as { scripts?: Record<string, unknown> };
    const scripts: Record<string, string> = {};
    for (const [name, body] of Object.entries(pkg.scripts ?? {}))
      if (typeof body === 'string') scripts[name] = body;
    return { scripts, dir: found.dir };
  } catch {
    return undefined;
  }
}

/** pre<name>, <name>, post<name>: what `npm run <name>` runs. */
function scriptCommands(scripts: Record<string, string>, name: string, prePost: boolean): string[] {
  const main = scripts[name] as string;
  if (!prePost) return [main];
  return [scripts[`pre${name}`], main, scripts[`post${name}`]].filter(
    (c): c is string => typeof c === 'string',
  );
}

function resolveScript(
  runner: string,
  name: string,
  rest: string[],
  cwd: string,
  files: Files,
  options: { prePost: boolean; runsBins: boolean; workspace: boolean },
): Resolution {
  // Scripts of other workspace packages (-r, --filter), or a package.json awf can't read: the name decides.
  if (options.workspace) return { kind: 'script-name', runner, name, rest };
  const pkg = packageScripts(cwd, files);
  if (pkg && typeof pkg.scripts[name] === 'string') {
    return {
      kind: 'script',
      runner,
      name,
      commands: scriptCommands(pkg.scripts, name, options.prePost),
      cwd: pkg.dir,
    };
  }
  if (!pkg) return { kind: 'script-name', runner, name, rest };
  if (options.runsBins) return { kind: 'bin', argv: [name, ...rest] };
  return { kind: 'script-name', runner, name, rest };
}

function resolveNpm(args: string[], cwd: string, files: Files): Resolution | undefined {
  const prefix = optionValue(args, ['--prefix']);
  const dir = prefix ? resolvePath(cwd, prefix) : cwd;
  const workspace =
    optionValue(args, ['-w', '--workspace']) !== undefined ||
    args.includes('--workspaces') ||
    args.includes('-ws');
  const i = firstPositional(args, NPM_VALUE_OPTIONS);
  if (i < 0) return undefined;
  const sub = args[i] as string;
  if (NPM_RUN.has(sub)) {
    const j = firstPositional(args.slice(i + 1), []);
    if (j < 0) return undefined;
    const name = args[i + 1 + j] as string;
    return resolveScript('npm', name, args.slice(i + 2 + j), dir, files, {
      prePost: true,
      runsBins: false,
      workspace,
    });
  }
  const alias = NPM_ALIASES[sub];
  if (alias)
    return resolveScript('npm', alias, args.slice(i + 1), dir, files, {
      prePost: true,
      runsBins: false,
      workspace,
    });
  return undefined;
}

function resolvePnpm(args: string[], cwd: string, files: Files): Resolution | undefined {
  const dirOption = optionValue(args, ['-C', '--dir']);
  const dir = dirOption ? resolvePath(cwd, dirOption) : cwd;
  const workspace =
    args.includes('-r') ||
    args.includes('--recursive') ||
    optionValue(args, ['--filter', '-F']) !== undefined;
  const i = firstPositional(args, PNPM_VALUE_OPTIONS);
  if (i < 0) return undefined;
  const sub = args[i] as string;
  if (sub === 'run' || sub === 'run-script') {
    const j = firstPositional(args.slice(i + 1), PNPM_VALUE_OPTIONS);
    if (j < 0) return undefined;
    return resolveScript('pnpm', args[i + 1 + j] as string, args.slice(i + 2 + j), dir, files, {
      prePost: false,
      runsBins: false,
      workspace,
    });
  }
  if (sub === 'test' || sub === 't')
    return resolveScript('pnpm', 'test', args.slice(i + 1), dir, files, {
      prePost: false,
      runsBins: false,
      workspace,
    });
  if (PNPM_BUILTINS.has(sub)) return undefined;
  return resolveScript('pnpm', sub, args.slice(i + 1), dir, files, {
    prePost: false,
    runsBins: true,
    workspace,
  });
}

function resolveYarn(args: string[], cwd: string, files: Files): Resolution | undefined {
  const cwdOption = optionValue(args, ['--cwd']);
  const dir = cwdOption ? resolvePath(cwd, cwdOption) : cwd;
  const i = firstPositional(args, YARN_VALUE_OPTIONS);
  if (i < 0) return undefined;
  const sub = args[i] as string;
  if (sub === 'run') {
    const name = args[i + 1];
    return name
      ? resolveScript('yarn', name, args.slice(i + 2), dir, files, {
          prePost: true,
          runsBins: true,
          workspace: false,
        })
      : undefined;
  }
  if (sub === 'workspace') {
    const name = args[i + 2];
    return name
      ? {
          kind: 'script-name',
          runner: 'yarn',
          name: name === 'run' ? (args[i + 3] ?? name) : name,
          rest: [],
        }
      : undefined;
  }
  if (sub === 'workspaces') {
    const run = args.indexOf('run', i);
    const name = run >= 0 ? args[run + 1] : undefined;
    return name ? { kind: 'script-name', runner: 'yarn', name, rest: [] } : undefined;
  }
  if (YARN_BUILTINS.has(sub)) return undefined;
  return resolveScript('yarn', sub, args.slice(i + 1), dir, files, {
    prePost: true,
    runsBins: true,
    workspace: false,
  });
}

function resolveBun(args: string[], cwd: string, files: Files): Resolution | undefined {
  const i = firstPositional(args, ['--cwd']);
  if (i < 0) return undefined;
  const sub = args[i] as string;
  // `bun run --cwd web test`, `bun run --filter web test`, `bun run --bun test`.
  const after =
    sub === 'run' ? firstPositional(args.slice(i + 1), ['--cwd', '--filter', '-F']) : -1;
  const nameAt = sub === 'run' ? (after < 0 ? -1 : i + 1 + after) : i;
  const name = nameAt >= 0 ? args[nameAt] : undefined;
  if (!name || (sub !== 'run' && BUN_BUILTINS.has(sub))) return undefined;
  if (/\.(m?[jt]sx?|cjs|cts)$/.test(name)) return undefined; // running a file
  const pkg = packageScripts(cwd, files);
  if (pkg && typeof pkg.scripts[name] === 'string') {
    return {
      kind: 'script',
      runner: 'bun',
      name,
      commands: scriptCommands(pkg.scripts, name, true),
      cwd: pkg.dir,
    };
  }
  return sub === 'run'
    ? { kind: 'script-name', runner: 'bun', name, rest: args.slice(nameAt + 1) }
    : undefined;
}

function resolveDeno(args: string[], cwd: string, files: Files): Resolution | undefined {
  if (args[0] !== 'task' || !args[1]) return undefined;
  const name = args[1];
  const found = findUp(cwd, ['deno.json', 'deno.jsonc'], files);
  if (found) {
    try {
      const config = JSON.parse(found.text.replace(/^\s*\/\/.*$/gm, '')) as {
        tasks?: Record<string, unknown>;
      };
      const task = config.tasks?.[name];
      const body =
        typeof task === 'string'
          ? task
          : typeof (task as { command?: unknown })?.command === 'string'
            ? (task as { command: string }).command
            : undefined;
      if (body) return { kind: 'script', runner: 'deno', name, commands: [body], cwd: found.dir };
    } catch {
      // fall through
    }
  }
  return { kind: 'script-name', runner: 'deno', name, rest: args.slice(2) };
}

interface MakeRule {
  deps: string[];
  recipe: string[];
}

/** Reads targets, prerequisites, recipes and simple variables out of a Makefile. */
export function parseMakefile(text: string): { rules: Map<string, MakeRule>; first?: string } {
  const lines = text.replace(/\\\n/g, ' ').split('\n');
  const vars = new Map<string, string>();
  const rules = new Map<string, MakeRule>();
  let first: string | undefined;
  let current: MakeRule[] = [];
  for (const raw of lines) {
    if (raw.startsWith('\t')) {
      for (const rule of current) rule.recipe.push(raw.slice(1));
      continue;
    }
    const line = raw.replace(/(^|\s)#.*$/, '').trimEnd();
    if (!line.trim()) continue;
    const assign =
      /^(?:export\s+|override\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*(:{1,3}=|\?=|\+=|!=|=)\s*(.*)$/.exec(
        line,
      );
    if (assign) {
      const [, name, op, value] = assign as unknown as [string, string, string, string];
      vars.set(name, op === '+=' ? `${vars.get(name) ?? ''} ${value}`.trim() : value);
      current = [];
      continue;
    }
    const rule = /^([^:=#]+?)\s*::?\s*(?![=])(.*)$/.exec(line);
    if (rule) {
      const [, targetsText, depsText] = rule as unknown as [string, string, string];
      const recipeAfterSemicolon = depsText.includes(';')
        ? depsText.slice(depsText.indexOf(';') + 1).trim()
        : '';
      const deps = (depsText.split(';')[0] ?? '')
        .split(/\s+/)
        .filter((d) => d && !d.startsWith('|'));
      current = [];
      for (const target of targetsText.trim().split(/\s+/)) {
        if (target.includes('%') || target.startsWith('.')) continue;
        const entry = rules.get(target) ?? { deps: [], recipe: [] };
        entry.deps.push(...deps);
        if (recipeAfterSemicolon) entry.recipe.push(recipeAfterSemicolon);
        rules.set(target, entry);
        current.push(entry);
        first ??= target;
      }
      continue;
    }
    current = [];
  }
  const expand = (text: string, depth = 0): string =>
    depth > 5
      ? text
      : text
          .replace(/\$\$/g, '\uE000')
          .replace(/\$\(MAKE\)|\$\{MAKE\}/g, 'make')
          .replace(/\$\(shell [^)]*\)/g, '')
          .replace(/\$[({]([A-Za-z_][A-Za-z0-9_.-]*)[)}]/g, (_m, name: string) =>
            expand(vars.get(name) ?? '', depth + 1),
          )
          .replace(/\uE000/g, '$');
  for (const rule of rules.values()) {
    rule.recipe = rule.recipe
      .map((line) =>
        expand(line)
          .replace(/^[\s@+-]+/, '')
          .trim(),
      )
      .filter(Boolean);
  }
  return { rules, ...(first ? { first } : {}) };
}

function recipeFor(rules: Map<string, MakeRule>, target: string, depth = 0): string[] | undefined {
  const rule = rules.get(target);
  if (!rule) return undefined;
  if (rule.recipe.length > 0 || depth > 3) return rule.recipe;
  // An aggregate target like `all: build test` runs its prerequisites.
  return rule.deps.flatMap((dep) => recipeFor(rules, dep, depth + 1) ?? []);
}

function resolveMake(args: string[], cwd: string, files: Files): Resolution | undefined {
  if (
    args.some((a) =>
      [
        '-n',
        '--dry-run',
        '--just-print',
        '--recon',
        '-q',
        '--question',
        '-p',
        '--print-data-base',
        '-v',
        '--version',
        '-h',
        '--help',
      ].includes(a),
    )
  ) {
    return undefined;
  }
  const dirOption = optionValue(args, ['-C', '--directory']);
  const dir = dirOption ? resolvePath(cwd, dirOption) : cwd;
  const fileOption = optionValue(args, ['-f', '--file', '--makefile']);
  const valueOptions = [
    '-C',
    '--directory',
    '-f',
    '--file',
    '--makefile',
    '-j',
    '--jobs',
    '-l',
    '--load-average',
    '-I',
    '--include-dir',
    '-o',
    '-W',
  ];
  const targets: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (valueOptions.includes(arg)) {
      if (arg !== '-j' || /^\d+$/.test(args[i + 1] ?? '')) i++;
      continue;
    }
    if (arg.startsWith('-') || arg.includes('=')) continue;
    targets.push(arg);
  }
  const text = fileOption
    ? files.read(resolvePath(dir, fileOption))
    : (files.read(path.join(dir, 'GNUmakefile')) ??
      files.read(path.join(dir, 'makefile')) ??
      files.read(path.join(dir, 'Makefile')));
  if (text === undefined)
    return { kind: 'make-name', ...(targets[0] ? { target: targets[0] } : {}) };
  const parsed = parseMakefile(text);
  const wanted = targets.length > 0 ? targets : parsed.first ? [parsed.first] : [];
  if (wanted.length === 0) return { kind: 'make-name' };
  const commands: string[] = [];
  for (const target of wanted) {
    const recipe = recipeFor(parsed.rules, target);
    if (recipe === undefined) return { kind: 'make-name', target };
    commands.push(...recipe);
  }
  return { kind: 'make', target: wanted.join(' '), commands, cwd: dir };
}

const GRADLE_VALUE_OPTIONS = [
  '-p',
  '--project-dir',
  '-x',
  '--exclude-task',
  '-I',
  '--init-script',
  '-c',
  '--settings-file',
  '-b',
  '--build-file',
  '--console',
  '--warning-mode',
  '--max-workers',
  '-g',
  '--gradle-user-home',
  '--project-cache-dir',
  '-D',
  '-P',
  '--priority',
  '--include-build',
  '--configuration',
  '--dependency',
  '--task',
  '--tests',
  '--args',
];
const MAVEN_VALUE_OPTIONS = [
  '-pl',
  '--projects',
  '-f',
  '--file',
  '-s',
  '--settings',
  '-gs',
  '-P',
  '--activate-profiles',
  '-T',
  '--threads',
  '-rf',
  '--resume-from',
  '-l',
  '--log-file',
  '-t',
  '--toolchains',
  '-b',
  '--builder',
  '-D',
];

function positionals(args: string[], valueOptions: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (valueOptions.includes(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith('-')) out.push(arg);
  }
  return out;
}

function resolveTasks(program: string, args: string[]): Resolution | undefined {
  let tasks: string[] = [];
  if (program === 'gradle') tasks = positionals(args, GRADLE_VALUE_OPTIONS);
  else if (program === 'mvn') {
    tasks = positionals(args, MAVEN_VALUE_OPTIONS);
    // With tests skipped, verify only builds.
    if (args.some((a) => /^-D(skipTests|maven\.test\.skip)(=true)?$/.test(a)))
      tasks = tasks.map((t) => (t === 'verify' ? 'package' : t));
  } else if (program === 'lerna') {
    const all = positionals(args, ['--scope', '--ignore', '--concurrency', '--since']);
    if (all[0] !== 'run' || !all[1]) return undefined;
    tasks = [all[1]];
  } else if (program === 'sbt') tasks = positionals(args, []).map((t) => t.replace(/^[^/]+\//, ''));
  else if (program === 'turbo') {
    const all = positionals(args, [
      '--filter',
      '-F',
      '--concurrency',
      '--output-logs',
      '--cache-dir',
      '--graph',
      '--log-order',
    ]);
    tasks = all[0] === 'run' ? all.slice(1) : all;
    if (
      [
        'prune',
        'login',
        'logout',
        'link',
        'unlink',
        'daemon',
        'telemetry',
        'gen',
        'ls',
        'info',
        'query',
        'scan',
        'watch',
      ].includes(tasks[0] ?? '')
    )
      return undefined;
  } else if (program === 'nx') {
    const all = positionals(args, [
      '-p',
      '--projects',
      '-c',
      '--configuration',
      '--parallel',
      '--base',
      '--head',
      '--exclude',
    ]);
    const flag = args.findIndex((a) => a === '-t' || a === '--target' || a === '--targets');
    const inline = optionValue(args, ['--target', '--targets']);
    if (flag >= 0) {
      const values: string[] = [];
      for (const arg of args.slice(flag + 1)) {
        if (arg.startsWith('-')) break;
        values.push(...arg.split(','));
      }
      tasks = values;
    } else if (inline) tasks = inline.split(',');
    else if (all[0] === 'run' && all[1]) tasks = [all[1].split(':')[1] ?? all[1]];
    else if (
      all[0] &&
      ![
        'affected',
        'run-many',
        'graph',
        'show',
        'list',
        'report',
        'reset',
        'daemon',
        'migrate',
        'g',
        'generate',
        'init',
        'add',
        'release',
        'sync',
        'format',
        'format:write',
        'format:check',
      ].includes(all[0])
    )
      tasks = [all[0]];
    else if (all[0] === 'format:write' || all[0] === 'format:check' || all[0] === 'format')
      tasks = ['format'];
  }
  tasks = tasks.filter((t) => t && !t.includes('='));
  if (tasks.length === 0) return undefined;
  if (tasks.length > 1) tasks = tasks.filter((t) => t !== 'clean' && !t.endsWith(':clean'));
  return { kind: 'tasks', runner: program, tasks };
}

function resolveGitCommit(args: string[], cwd: string, files: Files): Resolution | undefined {
  const sub = positionals(args, ['-C', '-c', '--git-dir', '--work-tree', '--namespace'])[0];
  if (sub !== 'commit' || args.includes('--no-verify') || args.includes('-n')) return undefined;
  // The repo root: the folder holding .git (a directory, or a file in a worktree).
  const root = findUp(cwd, ['.git/HEAD', '.git'], files)?.dir ?? cwd;
  const husky = files.read(path.join(root, '.husky', 'pre-commit'));
  if (husky !== undefined)
    return { kind: 'hook', name: '.husky/pre-commit', commands: [husky], cwd: root };
  const lefthook =
    files.read(path.join(root, 'lefthook.yml')) ?? files.read(path.join(root, 'lefthook.yaml'));
  if (lefthook !== undefined) {
    try {
      const doc = YAML.parse(lefthook) as {
        'pre-commit'?: { commands?: Record<string, { run?: string }> };
      };
      const commands = Object.values(doc?.['pre-commit']?.commands ?? {})
        .map((c) => c?.run)
        .filter((c): c is string => typeof c === 'string');
      if (commands.length > 0)
        return { kind: 'hook', name: 'lefthook pre-commit', commands, cwd: root };
    } catch {
      // fall through
    }
  }
  if (files.read(path.join(root, '.pre-commit-config.yaml')) !== undefined) {
    return { kind: 'hook', name: 'pre-commit', commands: ['pre-commit run'], cwd: root };
  }
  const gitHook = files.read(path.join(root, '.git', 'hooks', 'pre-commit'));
  if (gitHook !== undefined)
    return { kind: 'hook', name: '.git/hooks/pre-commit', commands: [gitHook], cwd: root };
  return undefined;
}

/** What a simple command (wrappers already removed) actually runs, when awf can tell. */
export function resolve(argv: string[], cwd: string, files: Files): Resolution | undefined {
  const program = programName(argv[0] ?? '');
  const args = argv.slice(1);
  switch (program) {
    case 'npm':
      return resolveNpm(args, cwd, files);
    case 'pnpm':
      return resolvePnpm(args, cwd, files);
    case 'yarn':
      return resolveYarn(args, cwd, files);
    case 'bun':
      return resolveBun(args, cwd, files);
    case 'deno':
      return resolveDeno(args, cwd, files);
    case 'make':
    case 'gmake':
      return resolveMake(args, cwd, files);
    case 'gradle':
    case 'mvn':
    case 'sbt':
    case 'turbo':
    case 'nx':
    case 'lerna':
      return resolveTasks(program, args);
    case 'git':
      return resolveGitCommit(args, cwd, files);
  }
  const file = scriptFile(argv);
  if (file) {
    const full = resolvePath(cwd, file);
    const text = files.read(full);
    // Only shell scripts are read as commands: a Python or Node file isn't shell.
    if (text !== undefined && isShellScript(file, text))
      return { kind: 'file', file, commands: [text], cwd };
  }
  return undefined;
}

const SHELL_SHEBANG = /^#!\s*\S*\/(env\s+)?(sh|bash|zsh|dash|ksh)\b/;

function isShellScript(file: string, text: string): boolean {
  if (text.startsWith('#!')) return SHELL_SHEBANG.test(text);
  return /\.(sh|bash|zsh)$/.test(file);
}
