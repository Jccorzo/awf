// Build drill-down: each tool's timing output, and how a build step finds it. Cargo and Xcode
// fixtures are real output (paths scrubbed); Gradle, Bazel and MSBuild are hand-made from their formats.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/analyze/summary';
import { attachBuildTimings, type BuildFiles } from '../../src/build/drilldown';
import {
  cargoTimingTime,
  gradleDuration,
  gradleProfileTime,
  parseBazelProfile,
  parseCargoTimings,
  parseGradleProfile,
  parseMsbuildSummary,
  parseXcodeTimingSummary,
} from '../../src/build/parsers';
import { memoryFiles } from '../../src/classify/resolve';
import type { Session, Step } from '../../src/model/types';
import { buildReportData } from '../../src/report/data';

const dir = path.resolve(__dirname, '../../fixtures/builds');
const fixture = (file: string) => readFileSync(path.join(dir, file), 'utf8');
const CARGO = 'cargo/cargo-timing-20261029T061854.142995Z.html';
const GRADLE = 'gradle/profile-2026-10-28-14-03-20.html';

describe('parsers', () => {
  it('reads Cargo units with their real start times', () => {
    const { startMs, tasks } = parseCargoTimings(fixture(CARGO));
    expect(startMs).toBe(Date.parse('2026-10-29T06:18:54.142995Z'));
    expect(tasks.map((t) => [t.name, t.ms])).toEqual([
      ['demo-app v0.1.0 (bin demo-app)', 200],
      ['demo-core v0.1.0', 140],
      ['demo-util v0.1.0', 50],
    ]);
    expect(tasks[1]?.startMs).toBe((startMs as number) + 150);
  });

  it("reads Xcode's build timing summary", () => {
    const tasks = parseXcodeTimingSummary(fixture('xcode/showBuildTimingSummary.txt'));
    expect(tasks.length).toBe(11);
    expect(tasks[0]).toMatchObject({ name: 'SwiftCompile', count: 2, ms: 354 });
    expect(tasks.map((t) => t.ms)).toEqual([...tasks.map((t) => t.ms)].sort((a, b) => b - a));
  });

  it("reads Gradle's profile report, without the per-project totals", () => {
    const tasks = parseGradleProfile(fixture(GRADLE));
    expect(tasks[0]).toEqual({ name: ':app:compileDebugKotlin', ms: 31_208 });
    expect(tasks.find((t) => t.name === ':app:mergeExtDexDebug')?.result).toBe('FROM-CACHE');
    expect(tasks.some((t) => t.name === ':app' || t.name === ':core')).toBe(false);
    expect(tasks).toHaveLength(10);
    expect([
      gradleDuration('1m12.34s'),
      gradleDuration('0.512s'),
      gradleDuration('2h0m1.00s'),
      gradleDuration('0s'),
    ]).toEqual([72_340, 512, 7_201_000, 0]);
  });

  it("reads Bazel's JSON trace: actions only, placed from the build's start", () => {
    const tasks = parseBazelProfile(fixture('bazel/profile.json'), 1_000_000);
    expect(tasks.map((t) => t.name)).toEqual([
      'Compiling app/src/main.cc',
      'Compiling lib/src/stats.cc',
      'Compiling lib/src/report.cc',
      'Linking app/main',
      'Linking lib/libstats.a',
    ]);
    expect(tasks[0]).toMatchObject({ ms: 6100, startMs: 1_002_400 });
  });

  it("reads MSBuild's target performance summary", () => {
    const tasks = parseMsbuildSummary(fixture('msbuild/performance-summary.txt'));
    expect(tasks[0]).toEqual({ name: 'CoreCompile', ms: 1490, count: 1 });
    expect(tasks).toHaveLength(6);
  });

  it('reads the times in report file names', () => {
    expect(cargoTimingTime('cargo-timing-20261029T061854.142995Z.html')).toBe(
      Date.parse('2026-10-29T06:18:54.143Z'),
    );
    expect(gradleProfileTime('profile-2026-10-28-14-03-20.html')).toBe(
      new Date(2026, 9, 28, 14, 3, 20).getTime(),
    );
  });
});

function files(map: Record<string, string>): BuildFiles {
  return {
    read: (file) => map[file],
    list: (d) =>
      Object.keys(map)
        .filter((f) => path.dirname(f) === d)
        .map((f) => path.basename(f)),
  };
}

function session(command: string, startMs: number, endMs: number, output?: string): Session {
  const step: Step = {
    id: 'b',
    parentId: null,
    kind: 'tool',
    tool: 'Bash',
    command,
    startMs,
    endMs,
    flags: [],
    ok: true,
  };
  if (output) step.detail = { output };
  return {
    id: 's',
    agent: 'claude-code',
    sources: ['transcript'],
    cwd: '/Users/user/demo',
    startMs,
    endMs,
    steps: [step],
  };
}

describe("finding a build step's timings", () => {
  const cargoStart = Date.parse('2026-10-29T06:18:54.000Z');
  const gradleStart = new Date(2026, 9, 28, 14, 3, 19).getTime();

  it('finds the Cargo report by the path cargo printed, or by its time', () => {
    const disk = files({
      [`/Users/user/demo/target/cargo-timings/${path.basename(CARGO)}`]: fixture(CARGO),
    });
    const printed = session(
      'cargo build --timings',
      cargoStart,
      cargoStart + 600,
      `Timing report saved to /Users/user/demo/target/cargo-timings/${path.basename(CARGO)}`,
    );
    expect(attachBuildTimings(printed, disk)).toBe(1);
    expect(printed.steps[0]?.build).toMatchObject({ tool: 'cargo', total: 3 });
    const recorded = session(
      'cd /Users/user/demo && cargo build --timings',
      cargoStart,
      cargoStart + 600,
    );
    expect(attachBuildTimings(recorded, disk)).toBe(1);
    const hourLater = session(
      'cargo build --timings',
      cargoStart + 3_600_000,
      cargoStart + 3_601_000,
    );
    expect(attachBuildTimings(hourLater, disk)).toBe(0);
  });

  it('finds the Gradle profile in build/reports/profile, from -p too', () => {
    const disk = files({
      [`/Users/user/demo/android/build/reports/profile/${path.basename(GRADLE)}`]: fixture(GRADLE),
    });
    const s = session(
      './gradlew -p android assembleDebug --profile',
      gradleStart,
      gradleStart + 72_000,
    );
    expect(attachBuildTimings(s, disk)).toBe(1);
    expect(s.steps[0]?.build?.tasks[0]?.name).toBe(':app:compileDebugKotlin');
    expect(
      attachBuildTimings(
        session('./gradlew -p android assembleDebug', gradleStart, gradleStart + 72_000),
        disk,
      ),
    ).toBe(0);
  });

  it('reads Xcode and MSBuild summaries from the output, and Bazel from --profile', () => {
    const xcode = session(
      'xcodebuild -scheme Demo -showBuildTimingSummary build 2>&1 | tail -40',
      0,
      9000,
      fixture('xcode/showBuildTimingSummary.txt'),
    );
    const msbuild = session(
      'dotnet build -clp:PerformanceSummary',
      0,
      3000,
      fixture('msbuild/performance-summary.txt'),
    );
    const bazel = session('bazel build //app:main --profile=/tmp/p.json', 5000, 16_000);
    const disk = files({ '/tmp/p.json': fixture('bazel/profile.json') });
    expect([xcode, msbuild, bazel].map((s) => attachBuildTimings(s, disk))).toEqual([1, 1, 1]);
    expect(bazel.steps[0]?.build?.tasks[0]).toMatchObject({ startMs: 7400 });
  });

  it('nests the slowest tasks under the build bar in the report, and leaves them out when shared', () => {
    const s = session(
      './gradlew -p android assembleDebug --profile',
      gradleStart,
      gradleStart + 72_000,
    );
    attachBuildTimings(
      s,
      files({
        [`/Users/user/demo/android/build/reports/profile/${path.basename(GRADLE)}`]:
          fixture(GRADLE),
      }),
    );
    const analysis = analyze(s, { files: memoryFiles({}) });
    const data = buildReportData(analysis, { home: '/Users/user' });
    const build = data.steps.find((step) => step.kind === 'tool');
    const tasks = data.steps.filter((step) => step.kind === 'build-task');
    expect(build).toMatchObject({ container: true, phase: 'build' });
    expect(tasks).toHaveLength(10);
    expect(tasks[0]).toMatchObject({
      p: build?.i,
      label: ':app:compileDebugKotlin',
      started: false,
      s: 0,
      e: 31_208,
    });
    // Drill-down tasks are details of one step: the build itself is the slow step.
    expect(data.slowest[0]).toBe(build?.i);
    expect(data.slowest.every((i) => data.steps[i]?.kind !== 'build-task')).toBe(true);
    const shared = buildReportData(analysis, { share: true });
    expect(shared.steps.some((step) => step.kind === 'build-task')).toBe(false);
  });
});
