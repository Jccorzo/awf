import { main } from './main';

// `awf stats | head` closes the pipe early; that isn't an error.
process.stdout.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(`awf: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  },
);
