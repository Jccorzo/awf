import { VERSION } from '../version';

export interface Io {
  out: (text: string) => void;
  err: (text: string) => void;
}

const defaultIo: Io = {
  out: (text) => process.stdout.write(text + '\n'),
  err: (text) => process.stderr.write(text + '\n'),
};

const USAGE = `awf ${VERSION}: where a coding agent's time went, by phase.

Usage: awf <command> [options]

Commands:
  sessions    List recorded sessions`;

export async function main(argv: string[], io: Io = defaultIo): Promise<number> {
  const [command] = argv;
  if (command === '--version' || command === '-v') {
    io.out(VERSION);
    return 0;
  }
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    io.out(USAGE);
    return 0;
  }
  if (command === 'sessions') {
    io.out('not implemented');
    return 0;
  }
  io.err(`awf: unknown command "${command}". Run "awf --help".`);
  return 2;
}
