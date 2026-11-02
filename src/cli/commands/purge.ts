import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { awfHome } from '../../store/paths';
import type { Command } from '../main';
import { homeRelative } from '../table';

/** What awf keeps in its folder. Anything else there means the folder isn't only awf's. */
const OURS = new Set(['events', 'imported', 'reports', 'cache', '.DS_Store']);

function size(target: string): number {
  const stat = statSync(target, { throwIfNoEntry: false });
  if (!stat) return 0;
  if (!stat.isDirectory()) return stat.size;
  return readdirSync(target).reduce((n, name) => n + size(path.join(target, name)), 0);
}

function human(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} kB`;
  return `${bytes} B`;
}

export const purgeCommand: Command = {
  summary: "Delete everything awf stored (~/.awf); Claude Code's own files stay",
  usage: `Usage: awf purge [--yes] [--json]

Deletes awf's folder (~/.awf, or $AWF_HOME): recorded timings, the import cache, reports and the
status line's cache.
Claude Code's transcripts are never touched. Without --yes it only lists what it would delete.
  --yes    delete it
  --json   print the folder's contents as JSON (it still deletes only with --yes)`,
  options: { yes: { type: 'boolean' }, json: { type: 'boolean' } },
  run(ctx, _args, options) {
    const home = ctx.env.HOME ?? os.homedir();
    const dir = awfHome(ctx.env);
    const shown = homeRelative(dir, home);
    if (!existsSync(dir)) {
      if (options.json) {
        ctx.io.out(JSON.stringify({ dir, parts: [], foreign: [], deleted: false }, null, 2));
      } else {
        ctx.io.out(`Nothing to delete: ${shown} doesn't exist.`);
      }
      return 0;
    }
    const entries = readdirSync(dir);
    const foreign = entries.filter((name) => !OURS.has(name));
    const parts = entries
      .filter((name) => OURS.has(name) && name !== '.DS_Store')
      .map((name) => ({ name, bytes: size(path.join(dir, name)) }));
    const report = (deleted: boolean) =>
      ctx.io.out(JSON.stringify({ dir, parts, foreign, deleted }, null, 2));
    if (options.json && !options.yes) {
      report(false);
      return 0;
    }
    if (foreign.length) {
      ctx.io.err(
        `${shown} holds files awf didn't make (${foreign.slice(0, 5).join(', ')}${foreign.length > 5 ? ', …' : ''}), so awf won't delete it. Remove them first, or delete the folder yourself.`,
      );
      return 1;
    }
    if (!options.yes) {
      ctx.io.out(`Would delete ${shown}:`);
      for (const part of parts) ctx.io.out(`  ${part.name.padEnd(9)} ${human(part.bytes)}`);
      ctx.io.out('Run "awf purge --yes" to delete it. Claude Code\'s transcripts are not touched.');
      return 0;
    }
    rmSync(dir, { recursive: true, force: true });
    if (options.json) report(true);
    else ctx.io.out(`Deleted ${shown}.`);
    return 0;
  },
};
