import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { summarize } from '../../analyze/summary';
import { buildDashData } from '../../dash/data';
import { renderDashHtml } from '../../dash/html';
import { awfHome } from '../../store/paths';
import { VERSION } from '../../version';
import { classifier, loadMany } from '../load';
import type { Command } from '../main';
import { homeRelative } from '../table';
import { openInBrowser } from './report';

export const dashCommand: Command = {
  summary: 'Write every session as one HTML dashboard, with filters by phase, project and period',
  usage: `Usage: awf dash [--since 30d] [--project <dir>] [--out <file.html>] [--open] [--json]

Writes one HTML file with every session awf has: time by phase, by project and over time, and a
table of sessions. Pick the phases to count (leave out Waiting on you to see how working time
splits), a period, a project, and hours or shares. Styles, script and data are inside the file,
and it makes no network requests. It holds session IDs, folder names and timings, and no
prompts, commands or output. Run "awf import" first to include past sessions.
  --since <age>     only sessions that started within this age (30d, 12h); default: all
  --project <dir>   only sessions started in this folder or below it
  --out <file>      where to write it (default: ~/.awf/reports/dash.html)
  --open            open it in your browser
  --json            print the dashboard's data as JSON instead`,
  options: {
    since: { type: 'string' },
    project: { type: 'string' },
    out: { type: 'string', short: 'o' },
    open: { type: 'boolean' },
    json: { type: 'boolean' },
  },
  run(ctx, _args, options) {
    const home = ctx.env.HOME ?? os.homedir();
    const classify = classifier();
    const analyzed = loadMany(ctx, options).map((session) => ({
      session,
      summary: summarize(classify(session)).summary,
    }));
    const data = buildDashData(analyzed, { home, now: ctx.now, version: VERSION });
    if (options.json) {
      ctx.io.out(JSON.stringify(data, null, 2));
      return 0;
    }
    const out =
      typeof options.out === 'string'
        ? path.resolve(ctx.cwd, options.out)
        : path.join(awfHome(ctx.env), 'reports', 'dash.html');
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, renderDashHtml(data));
    const count = data.sessions.length;
    ctx.io.out(
      `Wrote ${homeRelative(out, home)}: ${count} session${count === 1 ? '' : 's'} in ${data.projects.length} project${data.projects.length === 1 ? '' : 's'}`,
    );
    if (count === 0) ctx.io.out('No sessions yet: run "awf import" to read past ones.');
    ctx.io.out(pathToFileURL(out).href);
    if (options.open) openInBrowser(out, ctx, 'dash');
    return 0;
  },
};
