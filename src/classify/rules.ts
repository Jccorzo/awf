import path from 'node:path';
import YAML from 'yaml';
import defaultRulesText from './default-rules.yaml?raw';
import { globToRegExp } from './glob';
import type { Files } from './resolve';

export type RulePhase =
  | 'lint'
  | 'tests'
  | 'build'
  | 'exploring'
  | 'writing'
  | 'running'
  | 'planning'
  | 'waiting'
  | 'neutral';

const RULE_PHASES = new Set<RulePhase>([
  'lint',
  'tests',
  'build',
  'exploring',
  'writing',
  'running',
  'planning',
  'waiting',
  'neutral',
]);

export interface CommandRule {
  id: string;
  phase: RulePhase;
  programs?: Set<string>;
  /** Leading positional arguments; each position lists its alternatives. */
  args?: string[][];
  with?: string[];
  without?: string[];
  only?: Set<string>;
  match?: RegExp;
  tag?: string;
  tool?: string;
  /**
   * From a repo's `.awf/rules.yaml`: it decides before awf reads what a command runs (a script's
   * contents, a package script, a make recipe), so a repo can name its own scripts.
   */
  repo?: boolean;
}

export interface NameRule {
  id: string;
  phase: RulePhase;
  match: RegExp;
}

export interface ToolRule {
  id: string;
  phase: RulePhase;
  names?: Set<string>;
  match?: RegExp;
  /** The call's action must be one of these (a browser `computer` call's `screenshot`). */
  actions?: Set<string>;
}

export interface Rules {
  commands: CommandRule[];
  tasks: NameRule[];
  scripts: NameRule[];
  tools: ToolRule[];
  testFiles: RegExp[];
  failurePatterns: Array<{ tool: string; pattern: RegExp }>;
  /** Where the rules came from, highest priority first. */
  sources: string[];
}

/** Compiles a regex; a leading (?m), (?i) or (?s) becomes a flag, since JavaScript has no inline flags. */
export function regex(source: string, where: string): RegExp {
  let flags = '';
  let body = source;
  const inline = /^\(\?([mis]+)\)/.exec(body);
  if (inline) {
    flags = inline[1] as string;
    body = body.slice(inline[0].length);
  }
  try {
    return new RegExp(body, flags);
  } catch (error) {
    throw new Error(`${where}: bad regex ${JSON.stringify(source)}: ${(error as Error).message}`, {
      cause: error,
    });
  }
}

function list(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]).map(String);
}

function phaseOf(value: unknown, where: string): RulePhase {
  if (typeof value === 'string' && RULE_PHASES.has(value as RulePhase)) return value as RulePhase;
  throw new Error(
    `${where}: unknown phase ${JSON.stringify(value)}; use one of ${[...RULE_PHASES].join(', ')}`,
  );
}

type Doc = Record<string, unknown>;

function parseDoc(text: string, source: string): Doc {
  const doc = YAML.parse(text) ?? {};
  if (typeof doc !== 'object' || Array.isArray(doc))
    throw new Error(`${source}: expected a YAML mapping`);
  return doc as Doc;
}

function entries(doc: Doc, key: string, source: string): Doc[] {
  const value = doc[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${source}: "${key}" must be a list`);
  return value as Doc[];
}

/** Compiles rule documents; earlier documents win, because within a section the first match wins. */
export function compileRules(docs: Array<{ text: string; source: string }>): Rules {
  const rules: Rules = {
    commands: [],
    tasks: [],
    scripts: [],
    tools: [],
    testFiles: [],
    failurePatterns: [],
    sources: [],
  };
  for (const { text, source } of docs) {
    const doc = parseDoc(text, source);
    rules.sources.push(source);
    entries(doc, 'commands', source).forEach((r, i) => {
      const where = `${source} commands[${i}]`;
      const rule: CommandRule = {
        id: `${path.basename(source)}:commands[${i}]`,
        phase: phaseOf(r.phase, where),
      };
      if (r.program !== undefined) rule.programs = new Set(list(r.program));
      if (r.args !== undefined) rule.args = list(r.args).map((a) => a.split('|'));
      if (r.with !== undefined) rule.with = list(r.with);
      if (r.without !== undefined) rule.without = list(r.without);
      if (r.only !== undefined) rule.only = new Set(list(r.only));
      if (r.match !== undefined) rule.match = regex(String(r.match), where);
      if (r.tag !== undefined) rule.tag = String(r.tag);
      if (r.tool !== undefined) rule.tool = String(r.tool);
      if (!rule.programs && !rule.match) throw new Error(`${where}: needs program or match`);
      if (source !== DEFAULT_RULES_SOURCE) rule.repo = true;
      rules.commands.push(rule);
    });
    for (const key of ['tasks', 'scripts'] as const) {
      entries(doc, key, source).forEach((r, i) => {
        const where = `${source} ${key}[${i}]`;
        if (r.match === undefined) throw new Error(`${where}: needs match`);
        rules[key].push({
          id: `${path.basename(source)}:${key}[${i}]`,
          phase: phaseOf(r.phase, where),
          match: regex(String(r.match), where),
        });
      });
    }
    entries(doc, 'tools', source).forEach((r, i) => {
      const where = `${source} tools[${i}]`;
      const rule: ToolRule = {
        id: `${path.basename(source)}:tools[${i}]`,
        phase: phaseOf(r.phase, where),
      };
      if (r.name !== undefined) rule.names = new Set(list(r.name));
      if (r.match !== undefined) rule.match = regex(String(r.match), where);
      if (r.action !== undefined)
        rule.actions = new Set(list(r.action).flatMap((a) => a.split('|')));
      if (!rule.names && !rule.match) throw new Error(`${where}: needs name or match`);
      rules.tools.push(rule);
    });
    for (const glob of list(doc.testFiles)) rules.testFiles.push(globToRegExp(glob));
    entries(doc, 'failurePatterns', source).forEach((r, i) => {
      const where = `${source} failurePatterns[${i}]`;
      rules.failurePatterns.push({
        tool: String(r.tool ?? '*'),
        pattern: regex(String(r.pattern), where),
      });
    });
  }
  return rules;
}

export const DEFAULT_RULES_SOURCE = 'default-rules.yaml';

let defaults: Rules | undefined;

/** The built-in rules alone. */
export function defaultRules(): Rules {
  defaults ??= compileRules([{ text: defaultRulesText, source: DEFAULT_RULES_SOURCE }]);
  return defaults;
}

/** The nearest `.awf/rules.yaml` from `dir` upward. */
function findRulesFile(dir: string, files: Files): { file: string; text: string } | undefined {
  let current = path.resolve(dir);
  for (let i = 0; i < 12; i++) {
    const file = path.join(current, '.awf', 'rules.yaml');
    const text = files.read(file);
    if (text !== undefined) return { file, text };
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return undefined;
}

function withDefaults(found: { file: string; text: string }): Rules {
  return compileRules([
    { text: found.text, source: found.file },
    { text: defaultRulesText, source: DEFAULT_RULES_SOURCE },
  ]);
}

/** The built-in rules extended by `.awf/rules.yaml` in the project (searched from `cwd` upward). */
export function loadRules(cwd: string | undefined, files: Files): Rules {
  const found = cwd ? findRulesFile(cwd, files) : undefined;
  return found ? withDefaults(found) : defaultRules();
}

/**
 * The rules of the repo each directory is in: its nearest `.awf/rules.yaml` with the built-in
 * rules, or undefined when it has none. Each file is compiled once. A command that runs in
 * another repo than the session's (`cd ../ios && ./scripts/test.sh`) is classified by that
 * repo's rules.
 */
export function repoRules(files: Files): (dir: string) => Rules | undefined {
  const byDir = new Map<string, Rules | undefined>();
  const byFile = new Map<string, Rules>();
  return (dir) => {
    const key = path.resolve(dir);
    if (byDir.has(key)) return byDir.get(key);
    const found = findRulesFile(key, files);
    let rules: Rules | undefined;
    if (found) {
      rules = byFile.get(found.file) ?? withDefaults(found);
      byFile.set(found.file, rules);
    }
    byDir.set(key, rules);
    return rules;
  };
}
