import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Classifier } from '../../classify/classify';
import { PHASE_LABEL, PHASES, type PhaseId } from '../../classify/phases';
import { diskFiles } from '../../classify/resolve';
import { loadRules } from '../../classify/rules';
import { classifier, loadMany } from '../load';
import type { Command } from '../main';
import { table } from '../table';

/** A seeded generator, so the same seed gives the same sample. */
function random(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const PHASE_IDS = new Set<string>(PHASES.map((p) => p.id));

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Parses a small CSV: quoted cells, doubled quotes, newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export const sampleCommand: Command = {
  summary: 'Pick random Bash steps to check by hand, or to label as a CSV',
  usage: `Usage: awf sample [--n 50] [--seed 1] [--since 30d] [--project <dir>] [--csv] [--json]

Prints random Bash calls from your sessions with the phase awf gave each, for a hand check.
With --csv it writes "command,cwd,awf_phase,your_phase": fill in your_phase with a phase id
(${PHASES.map((p) => p.id).join(', ')}) and run "awf accuracy <file>".
  --json   print the sample as a JSON array of { command, cwd, phase }`,
  options: {
    n: { type: 'string' },
    seed: { type: 'string' },
    since: { type: 'string' },
    project: { type: 'string' },
    csv: { type: 'boolean' },
    json: { type: 'boolean' },
  },
  run(ctx, _args, options) {
    const n = typeof options.n === 'string' ? Number.parseInt(options.n, 10) || 50 : 50;
    const next = random(
      typeof options.seed === 'string' ? Number.parseInt(options.seed, 10) || 1 : 1,
    );
    const classify = classifier();
    const pool: Array<{ command: string; cwd: string; phase: PhaseId }> = [];
    const seen = new Set<string>();
    for (const session of loadMany(ctx, options).map(classify)) {
      for (const step of session.steps) {
        if (step.kind !== 'tool' || step.tool !== 'Bash' || !step.command || seen.has(step.command))
          continue;
        seen.add(step.command);
        pool.push({
          command: step.command,
          cwd: session.cwd ?? '',
          phase: step.phase ?? 'unclassified',
        });
      }
    }
    const picked: typeof pool = [];
    while (picked.length < n && pool.length > 0)
      picked.push(...pool.splice(Math.floor(next() * pool.length), 1));
    if (options.json) {
      ctx.io.out(JSON.stringify(picked, null, 2));
      return 0;
    }
    if (options.csv) {
      ctx.io.out('command,cwd,awf_phase,your_phase');
      for (const p of picked) ctx.io.out([p.command, p.cwd, p.phase, ''].map(csvCell).join(','));
      return 0;
    }
    ctx.io.out(
      table(
        ['#', 'AWF SAYS', 'COMMAND'],
        picked.map((p, i) => {
          const line = p.command.replace(/\s+/g, ' ');
          return [
            String(i + 1),
            PHASE_LABEL[p.phase],
            line.length > 110 ? line.slice(0, 109) + '…' : line,
          ];
        }),
      ),
    );
    ctx.io.out(
      `\n${picked.length} of ${seen.size} distinct Bash commands. Count the ones you disagree with.`,
    );
    return 0;
  },
};

export const accuracyCommand: Command = {
  summary: 'Compare awf with your own labels from "awf sample --csv"',
  usage: `Usage: awf accuracy <labels.csv> [--json]

Re-classifies each labelled command with the current rules and reports agreement per phase.`,
  options: { json: { type: 'boolean' } },
  run(ctx, args, options) {
    const file = args[0];
    if (!file) throw new Error('give the labels file, for example fixtures/labels.csv');
    const rows = parseCsv(readFileSync(path.resolve(ctx.cwd, file), 'utf8'));
    const header = rows.shift() ?? [];
    const col = (name: string) => header.indexOf(name);
    const [ci, wi, yi] = [col('command'), col('cwd'), col('your_phase')];
    if (ci < 0 || yi < 0) throw new Error('the CSV needs "command" and "your_phase" columns');
    const files = diskFiles();
    const perPhase = new Map<string, { total: number; agree: number }>();
    const misses: Array<{ command: string; yours: string; awf: string }> = [];
    let total = 0;
    let agree = 0;
    for (const row of rows) {
      const yours = (row[yi] ?? '').trim();
      if (!yours) continue;
      if (!PHASE_IDS.has(yours))
        throw new Error(`unknown phase "${yours}"; use one of ${[...PHASE_IDS].join(', ')}`);
      const cwd = (wi >= 0 ? row[wi] : '') || ctx.cwd;
      const awf = new Classifier(loadRules(cwd, files), files).command(row[ci] ?? '', cwd).phase;
      const entry = perPhase.get(yours) ?? { total: 0, agree: 0 };
      entry.total++;
      total++;
      if (awf === yours) {
        entry.agree++;
        agree++;
      } else misses.push({ command: row[ci] ?? '', yours, awf });
      perPhase.set(yours, entry);
    }
    const report = {
      labelled: total,
      agree,
      accuracy: total > 0 ? agree / total : 0,
      perPhase: Object.fromEntries(
        [...perPhase].map(([p, v]) => [p, { ...v, accuracy: v.agree / v.total }]),
      ),
      misses,
    };
    if (options.json) {
      ctx.io.out(JSON.stringify(report, null, 2));
      return 0;
    }
    ctx.io.out(
      `awf agrees with ${agree} of ${total} labels (${((report.accuracy || 0) * 100).toFixed(1)}%).\n`,
    );
    ctx.io.out(
      table(
        ['YOUR PHASE', 'LABELS', 'AGREE', 'ACCURACY'],
        [...perPhase].map(([p, v]) => [
          PHASE_LABEL[p as PhaseId] ?? p,
          String(v.total),
          String(v.agree),
          `${((v.agree / v.total) * 100).toFixed(0)}%`,
        ]),
        [1, 2, 3],
      ),
    );
    if (misses.length > 0) {
      ctx.io.out('\nDisagreements:');
      for (const m of misses.slice(0, 30))
        ctx.io.out(`  ${m.yours} (awf: ${m.awf})  ${m.command.replace(/\s+/g, ' ').slice(0, 100)}`);
    }
    return 0;
  },
};
