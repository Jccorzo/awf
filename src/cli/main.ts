import { parseArgs, type ParseArgsConfig } from 'node:util';
import { VERSION } from '../version';
import { sessionsCommand } from './commands/sessions';

export interface Io {
  out: (text: string) => void;
  err: (text: string) => void;
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
};

export const COMMANDS: Record<string, Command> = {
  sessions: sessionsCommand,
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
