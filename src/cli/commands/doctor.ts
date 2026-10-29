import os from 'node:os';
import { listTranscripts } from '../../importers/claude-code/locate';
import { formatDuration } from '../../model/time';
import { listEventFiles } from '../../store/events';
import { listImportedIds, readImported } from '../../store/imported';
import { awfHome, claudeProjectsDir } from '../../store/paths';
import { VERSION } from '../../version';
import type { Command } from '../main';
import { homeRelative, table } from '../table';

export const doctorCommand: Command = {
  summary: 'Check the recorder and list transcript entries awf does not recognise',
  usage: `Usage: awf doctor [--json]

Shows whether the recorder is writing events, where awf reads and writes, and every transcript entry
type the importer didn't recognise, with the Claude Code versions that wrote it. Run it after a
Claude Code update. It reads what "awf import" stored, so run that first.`,
  options: { json: { type: 'boolean' } },
  run(ctx, _args, options) {
    const events = listEventFiles(ctx.env);
    const lastEvent = Math.max(0, ...events.map((f) => f.mtimeMs));
    const transcripts = listTranscripts(ctx.env, ctx.now - 30 * 86_400_000);
    const imported = listImportedIds(ctx.env);
    const unknown = new Map<string, { count: number; versions: Set<string> }>();
    for (const id of imported) {
      const session = readImported(id, ctx.env)?.session;
      for (const [type, count] of Object.entries(session?.diagnostics?.unknownEntries ?? {})) {
        const entry = unknown.get(type) ?? { count: 0, versions: new Set<string>() };
        entry.count += count;
        if (session?.agentVersion) entry.versions.add(session.agentVersion);
        unknown.set(type, entry);
      }
    }
    const report = {
      awf: VERSION,
      node: process.version,
      awfHome: awfHome(ctx.env),
      claudeProjects: claudeProjectsDir(ctx.env),
      recordedSessions: events.length,
      lastEventMs: lastEvent || null,
      transcriptsLast30Days: transcripts.length,
      importedSessions: imported.length,
      unknownEntries: Object.fromEntries(
        [...unknown].map(([type, u]) => [
          type,
          { count: u.count, versions: [...u.versions].sort() },
        ]),
      ),
    };
    if (options.json) {
      ctx.io.out(JSON.stringify(report, null, 2));
      return 0;
    }
    const home = ctx.env.HOME ?? os.homedir();
    const recorder =
      events.length === 0
        ? 'no events yet. Install the plugin: claude plugin install awf@awf'
        : `${events.length} sessions, last event ${formatDuration(ctx.now - lastEvent)} ago`;
    ctx.io.out(
      [
        `awf ${VERSION} on Node ${process.version}`,
        `Writes:   ${homeRelative(report.awfHome, home)} (events/, imported/)`,
        `Reads:    ${homeRelative(report.claudeProjects, home)} (never changes it)`,
        `Recorder: ${recorder}`,
        `Transcripts changed in the last 30 days: ${transcripts.length}; imported sessions: ${imported.length}`,
      ].join('\n'),
    );
    if (unknown.size === 0) {
      ctx.io.out(
        imported.length > 0
          ? 'Unknown transcript entries: none.'
          : 'Run "awf import" to check transcripts.',
      );
    } else {
      ctx.io.out('Unknown transcript entries (skipped; new in a Claude Code update?):');
      ctx.io.out(
        table(
          ['TYPE', 'COUNT', 'CLAUDE CODE'],
          [...unknown]
            .sort((a, b) => b[1].count - a[1].count)
            .map(([type, u]) => [type, String(u.count), [...u.versions].sort().join(', ')]),
          [1],
        ),
      );
    }
    return 0;
  },
};
