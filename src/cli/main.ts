import { readFileSync } from 'node:fs';
import { parseArgs, type ParseArgsConfig } from 'node:util';
import { VERSION } from '../version';
import { classifyCommand } from './commands/classify';
import { compareCommand } from './commands/compare';
import { doctorCommand } from './commands/doctor';
import { importCommand } from './commands/import';
import { liveCommand } from './commands/live';
import { purgeCommand } from './commands/purge';
import { reportCommand } from './commands/report';
import { accuracyCommand, sampleCommand } from './commands/sample';
import { sessionsCommand } from './commands/sessions';
import { statsCommand } from './commands/stats';
import { statuslineCommand } from './commands/statusline';
import { summaryCommand } from './commands/summary';

export interface Io {
  out: (text: string) => void;
  err: (text: string) => void;
  /** Standard input, read whole; undefined when it's a terminal. Only `statusline` reads it. */
  input?: () => string | undefined;
}

export interface Ctx {
  io: Io;
  env: Record<string, string | undefined>;
  cwd: string;
  now: number;
}

export type Options = Record<string, string | boolean | string[] | undefined>;

export interface Command {
  summary: string;
  usage: string;
  options: NonNullable<ParseArgsConfig['options']>;
  run: (ctx: Ctx, args: string[], options: Options) => Promise<number> | number;
}

const defaultIo: Io = {
  out: (text) => process.stdout.write(text + '\n'),
  err: (text) => process.stderr.write(text + '\n'),
  input: () => (process.stdin.isTTY ? undefined : readFileSync(0, 'utf8')),
};

export const COMMANDS: Record<string, Command> = {
  sessions: sessionsCommand,
  import: importCommand,
  classify: classifyCommand,
  summary: summaryCommand,
  report: reportCommand,
  compare: compareCommand,
  stats: statsCommand,
  statusline: statuslineCommand,
  live: liveCommand,
  sample: sampleCommand,
  accuracy: accuracyCommand,
  doctor: doctorCommand,
  purge: purgeCommand,
};

function usage(): string {
  const width = Math.max(...Object.keys(COMMANDS).map((name) => name.length));
  const lines = Object.entries(COMMANDS).map(
    ([name, command]) => `  ${name.padEnd(width)}  ${command.summary}`,
  );
  return [
    `awf ${VERSION}: where a coding agent's time went, by phase.`,
    '',
    'Usage: awf <command> [options]',
    '',
    'Commands:',
    ...lines,
    '',
    'Run "awf <command> --help" for its options. Every command takes --json.',
  ].join('\n');
}

export async function main(
  argv: string[],
  io: Io = defaultIo,
  env: Record<string, string | undefined> = process.env,
  cwd: string = process.cwd(),
  now: number = Date.now(),
): Promise<number> {
  const [name, ...rest] = argv;
  if (name === '--version' || name === '-v') {
    io.out(VERSION);
    return 0;
  }
  if (!name || name === '--help' || name === '-h' || name === 'help') {
    io.out(usage());
    return 0;
  }
  const command = COMMANDS[name];
  if (!command) {
    io.err(`awf: unknown command "${name}". Run "awf --help".`);
    return 2;
  }
  let parsed;
  try {
    parsed = parseArgs({
      args: rest,
      options: { ...command.options, help: { type: 'boolean', short: 'h' } },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    io.err(`awf ${name}: ${error instanceof Error ? error.message : String(error)}`);
    io.err(command.usage);
    return 2;
  }
  if (parsed.values.help) {
    io.out(command.usage);
    return 0;
  }
  try {
    return await command.run({ io, env, cwd, now }, parsed.positionals, parsed.values);
  } catch (error) {
    io.err(`awf ${name}: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
