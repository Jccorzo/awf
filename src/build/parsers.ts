// Readers for the timing output of build tools. Each returns the tasks it found, slowest first;
// start times when the tool records them (Cargo, Bazel), durations only otherwise.

export interface BuildTask {
  name: string;
  ms: number;
  /** Absolute start, when the tool records it. */
  startMs?: number;
  /** Tasks of this kind (Xcode groups them), or calls (MSBuild). */
  count?: number;
  /** UP-TO-DATE, FROM-CACHE, ... (Gradle). */
  result?: string;
}

const bySlowest = (tasks: BuildTask[]) => tasks.sort((a, b) => b.ms - a.ms);

/** `cargo build --timings`: target/cargo-timings/cargo-timing-<time>.html, with its UNIT_DATA. */
export function parseCargoTimings(html: string): { startMs?: number; tasks: BuildTask[] } {
  const start = /Build start:<\/td>\s*<td>([^<]+)</.exec(html)?.[1];
  const startMs = start ? Date.parse(start) : NaN;
  const data = /const UNIT_DATA = (\[[\s\S]*?\]);\s*\n\s*const /.exec(html)?.[1];
  if (!data) return { tasks: [] };
  let units: Array<{
    name?: string;
    version?: string;
    target?: string;
    start?: number;
    duration?: number;
  }>;
  try {
    units = JSON.parse(data);
  } catch {
    return { tasks: [] };
  }
  const tasks = units
    .filter((u) => typeof u.duration === 'number' && u.name)
    .map((u) => {
      const target = (u.target ?? '').trim();
      const task: BuildTask = {
        name: `${u.name} v${u.version ?? ''}${target ? ` (${target.replace(/"/g, '')})` : ''}`,
        ms: Math.round((u.duration ?? 0) * 1000),
      };
      if (Number.isFinite(startMs) && typeof u.start === 'number')
        task.startMs = startMs + Math.round(u.start * 1000);
      return task;
    });
  return { ...(Number.isFinite(startMs) ? { startMs } : {}), tasks: bySlowest(tasks) };
}

/** `xcodebuild -showBuildTimingSummary`: "SwiftCompile (2 tasks) | 0.377 seconds" lines. */
export function parseXcodeTimingSummary(output: string): BuildTask[] {
  const at = output.lastIndexOf('Build Timing Summary');
  if (at < 0) return [];
  const tasks: BuildTask[] = [];
  for (const match of output
    .slice(at)
    .matchAll(/^(\S.*?) \((\d+) tasks?\) \| ([\d.]+) seconds$/gm)) {
    tasks.push({
      name: match[1] as string,
      count: Number(match[2]),
      ms: Math.round(Number(match[3]) * 1000),
    });
  }
  return bySlowest(tasks);
}

/** Gradle's terse durations: "0.512s", "1m2.34s", "2h0m1.00s". */
export function gradleDuration(text: string): number | undefined {
  const match = /^(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)$/.exec(text.trim());
  if (!match) return undefined;
  const [, d = '0', h = '0', m = '0', s = '0'] = match;
  return Math.round(((Number(d) * 24 + Number(h)) * 60 + Number(m)) * 60_000 + Number(s) * 1000);
}

/** `gradle --profile`: build/reports/profile/profile-<time>.html, its Task Execution table. */
export function parseGradleProfile(html: string): BuildTask[] {
  const at = html.indexOf('<h2>Task Execution</h2>');
  if (at < 0) return [];
  const section = html.slice(at, html.indexOf('</table>', at) + 8);
  const tasks: BuildTask[] = [];
  for (const row of section.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...(row[1] ?? '').matchAll(/<td[^>]*?(?:\/>|>([\s\S]*?)<\/td>)/g)].map((c) =>
      (c[1] ?? '').replace(/<[^>]+>/g, '').trim(),
    );
    const [name, duration, result = ''] = cells;
    if (!name || !duration || result === '(total)') continue;
    const ms = gradleDuration(duration);
    if (ms === undefined) continue;
    tasks.push({ name, ms, ...(result ? { result } : {}) });
  }
  return bySlowest(tasks);
}

/** The time in a Gradle profile's file name, profile-2026-10-28-14-03-12.html, in local time. */
export function gradleProfileTime(file: string): number | undefined {
  const m = /profile-(\d{4})-(\d\d)-(\d\d)-(\d\d)-(\d\d)-(\d\d)\.html$/.exec(file);
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s] = m.map(Number) as number[];
  return new Date(y as number, (mo as number) - 1, d, h, mi, s).getTime();
}

/** The time in a Cargo timing report's name, cargo-timing-20261029T061854.142995Z.html (UTC). */
export function cargoTimingTime(file: string): number | undefined {
  const m = /cargo-timing-(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)(?:\.(\d+))?Z\.html$/.exec(file);
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s] = m.map(Number) as number[];
  return (
    Date.UTC(y as number, (mo as number) - 1, d, h, mi, s) +
    Math.round(Number(`0.${m[7] ?? '0'}`) * 1000)
  );
}

/** `bazel build --profile=x.json`: a JSON trace; its "action processing" events, in microseconds. */
export function parseBazelProfile(json: string, startMs: number): BuildTask[] {
  let trace: {
    traceEvents?: Array<{ cat?: string; name?: string; ph?: string; ts?: number; dur?: number }>;
  };
  try {
    trace = JSON.parse(json);
  } catch {
    return [];
  }
  const tasks: BuildTask[] = [];
  for (const e of trace.traceEvents ?? []) {
    if (e.ph !== 'X' || typeof e.dur !== 'number' || typeof e.ts !== 'number' || !e.name) continue;
    if (e.cat !== 'action processing') continue;
    tasks.push({
      name: e.name,
      ms: Math.round(e.dur / 1000),
      startMs: startMs + Math.round(e.ts / 1000),
    });
  }
  return bySlowest(tasks);
}

/** MSBuild's `-clp:PerformanceSummary`: the "Target Performance Summary" lines. */
export function parseMsbuildSummary(output: string): BuildTask[] {
  const at = output.lastIndexOf('Target Performance Summary:');
  if (at < 0) return [];
  const tasks: BuildTask[] = [];
  for (const line of output.slice(at).split('\n').slice(1)) {
    const match = /^\s*(\d+) ms\s+(.+?)\s+(\d+) calls?\s*$/.exec(line);
    if (!match) {
      if (line.trim() === '' || /Performance Summary:/.test(line)) {
        if (tasks.length > 0) break;
        continue;
      }
      continue;
    }
    tasks.push({ name: match[2] as string, ms: Number(match[1]), count: Number(match[3]) });
  }
  return bySlowest(tasks);
}
