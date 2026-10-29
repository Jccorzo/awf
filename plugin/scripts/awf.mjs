#!/usr/bin/env node
import { createRequire as __awfCreateRequire } from 'node:module';
const require = __awfCreateRequire(import.meta.url);

// src/version.ts
var VERSION = "0.1.0";

// src/cli/main.ts
var defaultIo = {
  out: (text) => process.stdout.write(text + "\n"),
  err: (text) => process.stderr.write(text + "\n")
};
var USAGE = `awf ${VERSION}: where a coding agent's time went, by phase.

Usage: awf <command> [options]

Commands:
  sessions    List recorded sessions`;
async function main(argv, io = defaultIo) {
  const [command] = argv;
  if (command === "--version" || command === "-v") {
    io.out(VERSION);
    return 0;
  }
  if (!command || command === "--help" || command === "-h" || command === "help") {
    io.out(USAGE);
    return 0;
  }
  if (command === "sessions") {
    io.out("not implemented");
    return 0;
  }
  io.err(`awf: unknown command "${command}". Run "awf --help".`);
  return 2;
}

// src/cli/bin.ts
main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    process.stderr.write(`awf: ${error instanceof Error ? error.message : String(error)}
`);
    process.exitCode = 1;
  }
);
