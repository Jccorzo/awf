import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { summarize } from '../../analyze/summary';
import { attachBuildTimings } from '../../build/drilldown';
import { buildReportData } from '../../report/data';
import { renderReportHtml } from '../../report/html';
import { awfHome, safeId } from '../../store/paths';
import { classifier, loadOne } from '../load';
import type { Command, Ctx } from '../main';
import { homeRelative } from '../table';

export const reportCommand: Command = {
  summary: 'Write a session as one self-contained HTML waterfall',
  usage: `Usage: awf report <session> [--out <file.html>] [--share] [--open] [--json]

Writes one HTML file that draws the session: time by phase, the phase at each moment, and every
step on a waterfall, with failures, rework and the slowest steps marked. Styles and script are
inside the file, and it makes no network requests. <session> is an ID or its first characters,
"last", or a transcript or events file.
  --out <file>  where to write it (default: ~/.awf/reports/<session>.html)
  --share       phases, durations and tool names only: no task, folder, commands, files or output
  --open        open it in your browser
  --json        print the report's data as JSON instead`,
  options: {
    out: { type: 'string', short: 'o' },
    share: { type: 'boolean' },
    open: { type: 'boolean' },
    json: { type: 'boolean' },
    project: { type: 'string' },
  },
  run(ctx, args, options) {
    const share = options.share === true;
    const session = loadOne(ctx, args[0], options, !share);
    // Builds run with timing output on show their slowest tasks (not in shared reports).
    if (!share) attachBuildTimings(session);
    const home = ctx.env.HOME ?? os.homedir();
    const data = buildReportData(summarize(classifier()(session)), { share, home, now: ctx.now });
    if (options.json) {
      ctx.io.out(JSON.stringify(data, null, 2));
      return 0;
    }
    const out =
      typeof options.out === 'string'
        ? path.resolve(ctx.cwd, options.out)
        : path.join(
            awfHome(ctx.env),
            'reports',
            `${safeId(session.id)}${share ? '-share' : ''}.html`,
          );
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, renderReportHtml(data));
    ctx.io.out(
      `Wrote ${homeRelative(out, home)}${share ? ' (shareable: no commands, files or output)' : ''}`,
    );
    ctx.io.out(pathToFileURL(out).href);
    if (options.open) openInBrowser(out, ctx, 'report');
    return 0;
  },
};

export function openInBrowser(file: string, ctx: Ctx, awfCommand: string): void {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [file]]
      : process.platform === 'win32'
        ? ['explorer', [file]]
        : ['xdg-open', [file]];
  try {
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.on('error', () =>
      ctx.io.err(`awf ${awfCommand}: couldn't open a browser; open the file above.`),
    );
    child.unref();
  } catch {
    ctx.io.err(`awf ${awfCommand}: couldn't open a browser; open the file above.`);
  }
}
