import os from 'node:os';
import { formatDurationLine, formatSummaryLines, summarize } from '../../analyze/summary';
import { formatClock } from '../../model/time';
import { classifier, loadOne } from '../load';
import type { Command } from '../main';
import { shareSession } from '../share';
import { homeRelative } from '../table';

export const summaryCommand: Command = {
  summary: 'One line per phase: time, share, runs and failures',
  usage: `Usage: awf summary <session> [--json] [--share]

Shows where a session's time went, one line per phase, with check runs, failures and rework.
Phase times add up to the session's total. <session> is an ID or its first characters, "last",
or a transcript or events file.
  --json    print JSON
  --share   phases, durations and tool names only: no task, folder, commands or files`,
  options: {
    json: { type: 'boolean' },
    share: { type: 'boolean' },
    project: { type: 'string' },
  },
  run(ctx, args, options) {
    const classified = classifier()(loadOne(ctx, args[0], options, true));
    const { summary } = summarize(options.share ? shareSession(classified) : classified);
    if (options.share) {
      delete summary.title;
      delete summary.cwd;
      for (const window of summary.rework)
        window.check = window.check.replace(/^(\w+):(npm|pnpm|yarn|bun|deno|make) .*/, '$1:$2');
    }
    if (options.json) {
      ctx.io.out(JSON.stringify(summary, null, 2));
      return 0;
    }
    const home = ctx.env.HOME ?? os.homedir();
    const header = [
      `Session ${summary.id.slice(0, 8)}`,
      formatClock(summary.startMs),
      formatDurationLine(summary),
      ...(summary.cwd ? [homeRelative(summary.cwd, home)] : []),
    ].join(' · ');
    ctx.io.out(header);
    if (summary.title) ctx.io.out(`Task: ${summary.title}`);
    ctx.io.out('');
    for (const line of formatSummaryLines(summary)) ctx.io.out(line);
    return 0;
  },
};
