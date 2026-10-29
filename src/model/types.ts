export type AgentName = 'claude-code' | 'codex' | 'gemini' | 'opencode';

/** Where a session's steps came from. */
export type SourceKind = 'recorder' | 'transcript' | 'import-cache';

export type StepKind =
  /** A user prompt and everything until the turn ends. */
  | 'turn'
  /** Model time: thinking and writing a reply or a tool call. */
  | 'model'
  /** One tool call. */
  | 'tool'
  /** A subagent's lifetime. Its steps nest under it. */
  | 'subagent'
  /** Between turns: the agent waits for you. */
  | 'idle'
  /** Context compaction. */
  | 'compact'
  /** A background shell started by a tool call, from start to its completion notice. */
  | 'background';

export type StepFlag =
  /** The call needed your approval. */
  | 'approval'
  /** The call was denied. */
  | 'denied'
  /** The call or turn was interrupted. */
  | 'interrupted'
  /** Runs in the background; doesn't block the agent. */
  | 'background'
  /** Ran in a batch with other calls. */
  | 'parallel'
  /** The model call ended in an API error. */
  | 'api-error'
  /** No end event was seen; closed at the next boundary. */
  | 'unfinished'
  /** Model time that ended without a tool call. */
  | 'answer'
  /** A turn started by a background task's completion notice, not by you. */
  | 'notification';

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

/** Transcript-only details. Shown in the full report, never stored by the recorder. */
export interface StepDetail {
  description?: string;
  output?: string;
}

/** A build's slowest tasks, from the build tool's own timing output (see docs/build-drilldown.md). */
export interface BuildTimings {
  /** cargo, xcodebuild, gradle, bazel, msbuild */
  tool: string;
  /** The report file read, or "output" when the step's own output had it. */
  source: string;
  /** Slowest first. Start times only when the tool records them. */
  tasks: Array<{ name: string; ms: number; startMs?: number; count?: number; result?: string }>;
  /** Tasks found, before keeping the slowest. */
  total: number;
}

export interface Step {
  id: string;
  parentId: string | null;
  kind: StepKind;
  tool?: string;
  /** Bash command, with secrets masked and heredoc bodies dropped. */
  command?: string;
  files?: string[];
  startMs: number;
  endMs: number;
  /** Tool result: true ok, false failed, undefined unknown. */
  ok?: boolean;
  flags: StepFlag[];
  /** Subagent that ran this step; absent for the main agent. */
  agentId?: string;
  /** Subagent type, on subagent steps and the Agent calls that start them. */
  agentType?: string;
  /** Model steps: the tool calls this model time produced. */
  produces?: string[];
  /** Tool execution time without the approval wait, when known. */
  runMs?: number;
  /** Time this call waited for your approval, from its start. */
  waitMs?: number;
  exitCode?: number;
  /** Background task ID of a background Bash call, or of a background step. */
  backgroundId?: string;
  model?: string;
  tokens?: TokenUsage;
  detail?: StepDetail;
  /** Build steps run with timing output on: the build's slowest tasks. Report only. */
  build?: BuildTimings;
}

export interface Session {
  id: string;
  agent: AgentName;
  sources: SourceKind[];
  cwd?: string;
  startMs: number;
  endMs: number;
  steps: Step[];
  transcriptPath?: string;
  agentVersion?: string;
  /** First prompt, one line. Transcript only, never stored by the recorder. */
  title?: string;
  diagnostics?: SessionDiagnostics;
}

export interface SessionDiagnostics {
  /** Entry types the importer didn't recognise, with counts. */
  unknownEntries: Record<string, number>;
  /** Lines that weren't valid JSON. */
  badLines: number;
  warnings: string[];
}
