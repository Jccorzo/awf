import os from 'node:os';
import path from 'node:path';
import { AGENT_NAMES, importAgentFile, listAgentSessions } from '../../importers/agents';
import { importClaudeCodeTranscript } from '../../importers/claude-code/import';
import { listTranscripts } from '../../importers/claude-code/locate';
import { parseSince } from '../../model/time';
import type { Session } from '../../model/types';
import { readImported, stripDetail, writeImported } from '../../store/imported';
import { claudeProjectsDir } from '../../store/paths';
import { projectKey } from '../../store/sessions';
import type { Command } from '../main';
import { homeRelative, table } from '../table';

export interface ImportReport {
  transcripts: number;
  /** Sessions read per agent. */
  agents: Record<string, number>;
  imported: number;
  unchanged: number;
  steps: number;
  toolCalls: number;
  unknownEntries: Record<string, { count: number; versions: string[] }>;
  badLines: number;
  versions: string[];
  errors: Array<{ file: string; message: string }>;
}

export function inProject(folder: string, dir: string | undefined): boolean {
  if (!dir) return true;
  const key = projectKey(dir);
  return folder === key || folder.startsWith(key + '-');
}

export const importCommand: Command = {
  summary: 'Import past sessions from Claude Code, Codex, Gemini and OpenCode (read-only)',
  usage: `Usage: awf import [--since 30d] [--project <dir>] [--agent <name>] [--force] [--dry-run] [--json]

Reads every Claude Code transcript under ~/.claude/projects/, and the session logs of Codex CLI
(~/.codex/sessions), Gemini CLI (~/.gemini/tmp) and OpenCode (~/.local/share/opencode/storage),
all read-only, and keeps the timings in ~/.awf/imported/, so your history survives the agents
deleting old logs. Prints the sessions, steps and any log entries awf doesn't recognise.
  --since <age>     only logs changed within this age
  --project <dir>   only sessions started in this folder or below it
  --agent <name>    only one agent: claude-code, codex, gemini or opencode
  --force           re-import transcripts that haven't changed
  --dry-run         read and report, but write nothing
  --json            print JSON`,
  options: {
    since: { type: 'string' },
    project: { type: 'string' },
    agent: { type: 'string' },
    force: { type: 'boolean' },
    'dry-run': { type: 'boolean' },
    json: { type: 'boolean' },
  },
  run(ctx, _args, options) {
    const since =
      typeof options.since === 'string' ? ctx.now - parseSince(options.since) : -Infinity;
    const project =
      typeof options.project === 'string' ? path.resolve(ctx.cwd, options.project) : undefined;
    const agent = typeof options.agent === 'string' ? options.agent : undefined;
    if (agent && !(agent in AGENT_NAMES))
      throw new Error(`unknown agent "${agent}": use ${Object.keys(AGENT_NAMES).join(', ')}`);
    const files = (!agent || agent === 'claude-code' ? listTranscripts(ctx.env, since) : [])
      .filter((f) => inProject(f.project, project))
      .map((f) => ({ ...f, read: () => importClaudeCodeTranscript(f.path), agent: 'claude-code' }));
    for (const f of listAgentSessions(ctx.env, since)) {
      if (agent && f.agent !== agent) continue;
      files.push({ ...f, project: '', read: () => importAgentFile(f), agent: f.agent });
    }
    const report: ImportReport = {
      transcripts: files.length,
      agents: {},
      imported: 0,
      unchanged: 0,
      steps: 0,
      toolCalls: 0,
      unknownEntries: {},
      badLines: 0,
      versions: [],
      errors: [],
    };
    const versions = new Set<string>();
    for (const file of files) {
      let session: Session;
      const cached = options.force ? undefined : readImported(file.id, ctx.env);
      if (cached && cached.source.mtimeMs === file.mtimeMs && cached.source.size === file.size) {
        session = cached.session;
        report.unchanged++;
      } else {
        try {
          session = file.read();
        } catch (error) {
          report.errors.push({
            file: file.path,
            message: error instanceof Error ? error.message : String(error),
          });
          continue;
        }
        if (!options['dry-run']) {
          writeImported(
            {
              version: 1,
              source: { path: file.path, mtimeMs: file.mtimeMs, size: file.size },
              session: stripDetail(session),
            },
            ctx.env,
          );
        }
        report.imported++;
      }
      // Other agents' logs don't sit in a folder per project: filter by the session's own folder.
      if (
        file.agent !== 'claude-code' &&
        project &&
        !(session.cwd && (session.cwd === project || session.cwd.startsWith(project + path.sep)))
      ) {
        report.transcripts--;
        continue;
      }
      report.agents[file.agent] = (report.agents[file.agent] ?? 0) + 1;
      report.steps += session.steps.length;
      report.toolCalls += session.steps.filter((s) => s.kind === 'tool').length;
      report.badLines += session.diagnostics?.badLines ?? 0;
      if (session.agentVersion && session.agent === 'claude-code')
        versions.add(session.agentVersion);
      for (const [type, count] of Object.entries(session.diagnostics?.unknownEntries ?? {})) {
        const key = session.agent === 'claude-code' ? type : `${session.agent}:${type}`;
        const entry = (report.unknownEntries[key] ??= { count: 0, versions: [] });
        entry.count += count;
        if (session.agentVersion && !entry.versions.includes(session.agentVersion)) {
          entry.versions.push(session.agentVersion);
        }
      }
    }
    report.versions = [...versions].sort();
    if (options.json) {
      ctx.io.out(JSON.stringify(report, null, 2));
      return report.errors.length > 0 ? 1 : 0;
    }
    const home = ctx.env.HOME ?? os.homedir();
    const verb = options['dry-run'] ? 'Read' : 'Imported';
    const byAgent = Object.entries(report.agents)
      .map(([name, n]) => `${AGENT_NAMES[name as keyof typeof AGENT_NAMES] ?? name} ${n}`)
      .join(', ');
    const from = Object.keys(report.agents).every((a) => a === 'claude-code')
      ? `from ${homeRelative(claudeProjectsDir(ctx.env), home)} `
      : `(${byAgent}) `;
    ctx.io.out(
      `${verb} ${report.transcripts - report.errors.length} of ${report.transcripts} sessions ${from}` +
        `(${report.imported} new or changed, ${report.unchanged} unchanged): ${report.steps.toLocaleString('en-US')} steps, ` +
        `${report.toolCalls.toLocaleString('en-US')} tool calls.`,
    );
    if (report.versions.length > 0) {
      ctx.io.out(
        `Claude Code versions: ${report.versions[0]} to ${report.versions[report.versions.length - 1]}.`,
      );
    }
    const unknown = Object.entries(report.unknownEntries).sort((a, b) => b[1].count - a[1].count);
    if (unknown.length === 0) {
      ctx.io.out('Unknown entries: none.');
    } else {
      ctx.io.out(`Unknown entries (${unknown.length} types, counted and skipped):`);
      ctx.io.out(
        table(
          ['TYPE', 'COUNT', 'CLAUDE CODE'],
          unknown.map(([type, u]) => [type, String(u.count), u.versions.sort().join(', ')]),
          [1],
        ),
      );
    }
    if (report.badLines > 0) ctx.io.out(`Lines that weren't valid JSON: ${report.badLines}.`);
    if (report.errors.length > 0) {
      ctx.io.out(`Failed: ${report.errors.length} files`);
      for (const error of report.errors)
        ctx.io.out(`  ${homeRelative(error.file, home)}: ${error.message}`);
      return 1;
    }
    return 0;
  },
};
