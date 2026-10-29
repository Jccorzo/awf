# Build drill-down

When a build step ran its tool with timing output on, the report nests the build's slowest tasks (up to 12) under the build bar. awf only reads what the tool already wrote: the step's output (from the transcript), or the report file the tool saved. Shared reports (`--share`) leave the tasks out, since task names are the project's.

| Tool    | Turn it on                                                                | Where awf finds it                                                                                                                | Start times                                            |
| ------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Xcode   | `xcodebuild … -showBuildTimingSummary`                                    | The "Build Timing Summary" in the step's output                                                                                   | No: grouped by task kind, drawn from the build's start |
| Gradle  | `./gradlew … --profile`                                                   | `build/reports/profile/profile-<time>.html` (the path Gradle printed, or the file whose time falls in the step; `-p` is followed) | No: drawn from the build's start                       |
| Cargo   | `cargo build --timings`                                                   | `target/cargo-timings/cargo-timing-<time>.html` (the path Cargo printed, or by time; `--manifest-path` is followed)               | Yes                                                    |
| Bazel   | `bazel build … --profile=<file>`                                          | That file (`.gz` is unpacked); its "action processing" events                                                                     | Yes, from the step's start                             |
| MSBuild | `dotnet build -clp:PerformanceSummary`, `msbuild -clp:PerformanceSummary` | The "Target Performance Summary" in the step's output                                                                             | No                                                     |

Tasks without start times are drawn from the build's start with a dashed bar: their lengths compare, their positions don't, and tasks that ran in parallel can add up to more than the build.

**Fixtures.** Cargo and Xcode are real output from a small workspace and a Swift package, paths scrubbed. Gradle, Bazel and MSBuild are hand-made from the formats, since those tools weren't installed where awf was built: replace them with real files when you can.

**Not read.** MSBuild's binary log (`-bl`): its format is versioned and binary, and there was no real log to test a reader against. Use `-clp:PerformanceSummary` instead.
