// Build drill-down: when a step ran a build tool with its timing output on, finds that output (in the
// step's output, or the report file the tool wrote) and attaches the build's slowest tasks to the step.
// Only reads files; see docs/build-drilldown.md.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { resolvePath } from '../classify/resolve';
import { programName, splitCommand, unwrap } from '../classify/shell';
import type { BuildTimings, Session, Step } from '../model/types';
import {
  cargoTimingTime,
  gradleProfileTime,
  parseBazelProfile,
  parseCargoTimings,
  parseGradleProfile,
  parseMsbuildSummary,
  parseXcodeTimingSummary,
} from './parsers';

export interface BuildFiles {
  /** Text of a file (gzip unpacked), or undefined. */
  read(file: string): string | undefined;
  list(dir: string): string[];
}

export const diskBuildFiles: BuildFiles = {
  read(file) {
    try {
      const bytes = readFileSync(file);
      return file.endsWith('.gz') ? gunzipSync(bytes).toString('utf8') : bytes.toString('utf8');
    } catch {
      return undefined;
    }
  },
  list(dir) {
    try {
      return readdirSync(dir);
    } catch {
      return [];
    }
  },
};

/** How far a report file's time may be from its step, for clocks and slow starts. */
const WINDOW_MS = 10_000;
/** Tasks kept per step: the slowest. */
export const MAX_TASKS = 12;

/** Attaches build timings to the steps that have them; returns how many steps got some. */
export function attachBuildTimings(session: Session, files: BuildFiles = diskBuildFiles): number {
  let found = 0;
  for (const step of session.steps) {
    if (step.kind !== 'tool' || !step.command) continue;
    const timings = timingsFor(step, session.cwd, files);
    if (!timings || timings.tasks.length === 0) continue;
    step.build = {
      ...timings,
      tasks: timings.tasks.slice(0, MAX_TASKS),
      total: timings.tasks.length,
    };
    found++;
  }
  return found;
}

function optionValue(args: string[], names: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (names.includes(arg)) return args[i + 1];
    const eq = names.find((n) => arg.startsWith(`${n}=`));
    if (eq) return arg.slice(eq.length + 1);
  }
  return undefined;
}

/** The report file in `dir` whose time (from its name) falls within the step, closest to its start. */
function nearest(
  files: BuildFiles,
  dir: string,
  timeOf: (name: string) => number | undefined,
  step: Step,
): string | undefined {
  let best: string | undefined;
  let distance = Infinity;
  for (const name of files.list(dir)) {
    const t = timeOf(name);
    if (t === undefined || t < step.startMs - WINDOW_MS || t > step.endMs + WINDOW_MS) continue;
    if (Math.abs(t - step.startMs) < distance) {
      best = path.join(dir, name);
      distance = Math.abs(t - step.startMs);
    }
  }
  return best;
}

function timingsFor(
  step: Step,
  sessionCwd: string | undefined,
  files: BuildFiles,
): Omit<BuildTimings, 'total'> | undefined {
  const output = step.detail?.output ?? '';
  for (const simple of splitCommand(step.command ?? '')) {
    const argv = unwrap(simple.argv).argv;
    const program = programName(argv[0] ?? '');
    const args = argv.slice(1);
    const cwd = simple.cd.reduce((dir, target) => resolvePath(dir, target), sessionCwd ?? '/');
    switch (program) {
      case 'xcodebuild': {
        if (!args.includes('-showBuildTimingSummary')) break;
        const tasks = parseXcodeTimingSummary(output);
        if (tasks.length) return { tool: 'xcodebuild', source: 'output', tasks };
        break;
      }
      case 'msbuild':
      case 'MSBuild':
      case 'dotnet': {
        const tasks = parseMsbuildSummary(output);
        if (tasks.length) return { tool: 'msbuild', source: 'output', tasks };
        break;
      }
      case 'cargo':
      case 'cross': {
        if (!args.some((a) => a === '--timings' || a.startsWith('--timings='))) break;
        const manifest = optionValue(args, ['--manifest-path']);
        const root = manifest ? path.dirname(resolvePath(cwd, manifest)) : cwd;
        const file =
          /Timing report saved to (\S+\.html)/.exec(output)?.[1] ??
          nearest(files, path.join(root, 'target', 'cargo-timings'), cargoTimingTime, step);
        const html = file ? files.read(file) : undefined;
        if (file && html)
          return { tool: 'cargo', source: file, tasks: parseCargoTimings(html).tasks };
        break;
      }
      case 'gradle': {
        if (!args.includes('--profile')) break;
        const project = optionValue(args, ['-p', '--project-dir']);
        const root = project ? resolvePath(cwd, project) : cwd;
        const file =
          /See the profiling report at: file:\/\/(\S+\.html)/.exec(output)?.[1] ??
          nearest(files, path.join(root, 'build', 'reports', 'profile'), gradleProfileTime, step);
        const html = file ? files.read(decodeURI(file)) : undefined;
        if (file && html)
          return { tool: 'gradle', source: decodeURI(file), tasks: parseGradleProfile(html) };
        break;
      }
      case 'bazel':
      case 'bazelisk': {
        const flag = optionValue(args, ['--profile']);
        if (!flag) break;
        const file = resolvePath(cwd, flag);
        const text = files.read(file);
        if (text)
          return { tool: 'bazel', source: file, tasks: parseBazelProfile(text, step.startMs) };
        break;
      }
    }
  }
  return undefined;
}
