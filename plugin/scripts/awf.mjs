#!/usr/bin/env node
import { createRequire as __awfCreateRequire } from 'node:module';
const require = __awfCreateRequire(import.meta.url);

// src/cli/main.ts
import { parseArgs } from "node:util";

// src/version.ts
var VERSION = "0.1.0";

// src/cli/commands/sessions.ts
import os2 from "node:os";

// src/model/time.ts
function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "\u2013";
  if (ms < 1e3) return `${Math.round(ms)} ms`;
  if (ms < 1e4) return `${(ms / 1e3).toFixed(1)}s`;
  const totalSeconds = Math.round(ms / 1e3);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function formatClock(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function parseSince(value) {
  const match = /^(\d+(?:\.\d+)?)\s*(d|h|m|w)$/.exec(value.trim());
  if (!match) throw new Error(`can't read "${value}": use a number and d, h, m or w, like 30d`);
  const n = Number(match[1]);
  const unit = { m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[match[2]];
  return n * unit;
}

// src/store/events.ts
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path2 from "node:path";

// src/recorder/steps.ts
var AGENT_TOOLS = /* @__PURE__ */ new Set(["Agent", "Task"]);
var BACKGROUND_AGENT_MS = 1e3;
function eventsToSession(sessionId, events) {
  const sorted = events.map((event, index) => ({ event, index })).sort((a, b) => a.event.t - b.event.t || a.index - b.index).map((x) => x.event);
  const builder = new Builder(sessionId);
  for (const event of sorted) builder.handle(event);
  return builder.finish();
}
var Builder = class {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.main = this.newCtx(void 0, null);
    this.ctxs.set("main", this.main);
  }
  sessionId;
  steps = [];
  ctxs = /* @__PURE__ */ new Map();
  main;
  inputHash = /* @__PURE__ */ new Map();
  approvalAt = /* @__PURE__ */ new Map();
  agentCalls = [];
  linkedCalls = /* @__PURE__ */ new Set();
  subagents = /* @__PURE__ */ new Map();
  compactions = [];
  turn = null;
  compaction = null;
  lastTurnEnd = null;
  startMs = Infinity;
  endMs = -Infinity;
  cwd;
  transcriptPath;
  counter = 0;
  handle(e) {
    this.startMs = Math.min(this.startMs, e.t);
    this.endMs = Math.max(this.endMs, e.t);
    if (e.cwd && !this.cwd) this.cwd = e.cwd;
    if (e.tp) this.transcriptPath = e.tp;
    switch (e.e) {
      case "UserPromptSubmit":
        this.startTurn(e);
        break;
      case "PreToolUse":
        this.preTool(e);
        break;
      case "PermissionRequest":
        this.permission(e);
        break;
      case "PermissionDenied":
        this.denied(e);
        break;
      case "PostToolUse":
      case "PostToolUseFailure":
        this.postTool(e);
        break;
      case "PostToolBatch":
        this.batchDone(e);
        break;
      case "SubagentStart":
        this.subagentStart(e);
        break;
      case "SubagentStop":
        this.subagentStop(e);
        break;
      case "Stop":
      case "StopFailure":
        this.stop(e);
        break;
      case "PreCompact":
        this.compactStart(e.t);
        break;
      case "PostCompact":
        this.compactEnd(e.t);
        break;
      case "SessionEnd":
        this.closeAll(e.t);
        break;
    }
  }
  finish() {
    if (!Number.isFinite(this.startMs)) return this.session(0, 0);
    this.closeAll(this.endMs);
    for (const step of this.steps) {
      if (step.endMs < step.startMs) step.endMs = step.startMs;
    }
    for (const sub of this.subagents.values()) {
      const call = this.agentCalls.find((c) => c.id === sub.parentId);
      if (call && call.endMs + BACKGROUND_AGENT_MS < sub.endMs && !sub.flags.includes("background")) {
        sub.flags.push("background");
      }
    }
    if (this.steps.length === 0) return this.session(this.startMs, this.endMs);
    return this.session(
      Math.min(...this.steps.map((s) => s.startMs)),
      Math.max(...this.steps.map((s) => s.endMs))
    );
  }
  session(startMs, endMs) {
    const session = {
      id: this.sessionId,
      agent: "claude-code",
      sources: ["recorder"],
      startMs,
      endMs,
      steps: this.steps
    };
    if (this.cwd) session.cwd = this.cwd;
    if (this.transcriptPath) session.transcriptPath = this.transcriptPath;
    return session;
  }
  newCtx(agentId, parentId) {
    return {
      agentId,
      parentId,
      modelStart: null,
      modelParts: [],
      lastModel: null,
      batchOpen: false,
      open: /* @__PURE__ */ new Map(),
      lastToolEnd: null
    };
  }
  id(prefix) {
    return `${prefix}:${++this.counter}`;
  }
  push(step) {
    this.steps.push(step);
    return step;
  }
  /** The context an event belongs to; a subagent's context is created on first sight. */
  ctxFor(e) {
    if (!e.aid) return this.main;
    const existing = this.ctxs.get(e.aid);
    if (existing) return existing;
    this.openSubagent(e.aid, e.at, e.t);
    return this.ctxs.get(e.aid);
  }
  openTurn(t, flags = []) {
    if (this.lastTurnEnd !== null && t > this.lastTurnEnd) this.addIdle(this.lastTurnEnd, t);
    this.turn = this.push({
      id: this.id("turn"),
      parentId: null,
      kind: "turn",
      startMs: t,
      endMs: t,
      flags
    });
    this.main.parentId = this.turn.id;
    this.main.modelParts = [];
    this.main.lastModel = null;
    this.main.batchOpen = false;
    this.main.lastToolEnd = null;
  }
  /** Idle time between turns, with compactions carved out of it. */
  addIdle(from, to) {
    let cursor = from;
    const cuts = this.compactions.filter((c) => c.parentId === null && c.endMs > from && c.startMs < to).sort((a, b) => a.startMs - b.startMs);
    for (const cut of cuts) {
      if (cut.startMs > cursor) this.pushIdle(cursor, cut.startMs);
      cursor = Math.max(cursor, cut.endMs);
    }
    if (to > cursor) this.pushIdle(cursor, to);
  }
  pushIdle(from, to) {
    this.push({
      id: this.id("idle"),
      parentId: null,
      kind: "idle",
      startMs: from,
      endMs: to,
      flags: []
    });
  }
  startTurn(e) {
    if (this.turn) {
      this.closeModel(this.main, e.t, ["interrupted"]);
      this.closeOpenTools(this.main, e.t, "interrupted");
      this.closeTurn(e.t);
    }
    this.openTurn(e.t, e.src === "task-notification" ? ["notification"] : []);
    this.main.modelStart = e.t;
  }
  ensureTurn(t) {
    if (!this.turn) this.openTurn(t);
  }
  closeTurn(t) {
    if (!this.turn) return;
    this.turn.endMs = Math.max(this.turn.endMs, t);
    this.lastTurnEnd = this.turn.endMs;
    this.turn = null;
  }
  /** Ends the current stretch of model time. Returns its steps (more than one if a compaction cut it). */
  closeModel(ctx, t, flags) {
    const segments = ctx.modelParts;
    ctx.modelParts = [];
    if (ctx.modelStart !== null && t >= ctx.modelStart) {
      segments.push(this.modelStep(ctx, ctx.modelStart, t));
    }
    ctx.modelStart = null;
    for (const segment of segments) {
      for (const flag of flags) if (!segment.flags.includes(flag)) segment.flags.push(flag);
    }
    return segments;
  }
  modelStep(ctx, start, end) {
    const step = {
      id: this.id("model"),
      parentId: ctx.parentId,
      kind: "model",
      startMs: start,
      endMs: end,
      flags: []
    };
    if (ctx.agentId) step.agentId = ctx.agentId;
    return this.push(step);
  }
  preTool(e) {
    const ctx = this.ctxFor(e);
    if (!ctx.agentId) this.ensureTurn(e.t);
    let producers = [];
    if (ctx.modelStart !== null || ctx.modelParts.length > 0) {
      producers = this.closeModel(ctx, e.t, []);
    } else if (ctx.batchOpen && ctx.lastModel) {
      producers = [ctx.lastModel];
    }
    const step = {
      id: e.tuid ?? this.id("tool"),
      parentId: ctx.parentId,
      kind: "tool",
      startMs: e.t,
      endMs: e.t,
      flags: e.bg ? ["background"] : []
    };
    if (e.tool) step.tool = e.tool;
    if (e.cmd) step.command = e.cmd;
    if (e.files) step.files = e.files;
    if (e.sub) step.agentType = e.sub;
    if (ctx.agentId) step.agentId = ctx.agentId;
    for (const producer of producers) (producer.produces ??= []).push(step.id);
    if (producers.length > 0) ctx.lastModel = producers[producers.length - 1] ?? null;
    this.push(step);
    this.inputHash.set(step, e.ih);
    ctx.open.set(step.id, step);
    ctx.batchOpen = true;
    if (e.tool && AGENT_TOOLS.has(e.tool)) this.agentCalls.push(step);
  }
  findOpen(id) {
    for (const ctx of this.ctxs.values()) {
      const step = ctx.open.get(id);
      if (step) return { ctx, step };
    }
    return void 0;
  }
  permission(e) {
    const ctx = this.ctxFor(e);
    const candidates = [...ctx.open.values()].filter((s) => s.tool === e.tool).reverse();
    const step = candidates.find((s) => this.inputHash.get(s) === e.ih) ?? candidates[0];
    if (!step) return;
    if (!step.flags.includes("approval")) step.flags.push("approval");
    this.approvalAt.set(step, e.t);
  }
  denied(e) {
    const found = e.tuid ? this.findOpen(e.tuid) : void 0;
    if (!found) return;
    found.step.endMs = e.t;
    found.step.ok = false;
    found.step.flags.push("denied");
    this.toolClosed(found.ctx, found.step, e.t);
  }
  postTool(e) {
    const found = e.tuid ? this.findOpen(e.tuid) : void 0;
    let ctx;
    let step;
    if (found) {
      ({ ctx, step } = found);
    } else {
      ctx = this.ctxFor(e);
      if (!ctx.agentId) this.ensureTurn(e.t);
      if (ctx.modelStart !== null) this.closeModel(ctx, e.t - (e.dur ?? 0), []);
      step = this.push({
        id: e.tuid ?? this.id("tool"),
        parentId: ctx.parentId,
        kind: "tool",
        startMs: e.t - (e.dur ?? 0),
        endMs: e.t,
        flags: []
      });
      if (e.tool) step.tool = e.tool;
      if (ctx.agentId) step.agentId = ctx.agentId;
      ctx.open.set(step.id, step);
    }
    step.endMs = Math.max(step.startMs, e.t);
    step.ok = e.ok === true && !e.intr;
    if (e.intr && !step.flags.includes("interrupted")) step.flags.push("interrupted");
    if (e.dur !== void 0) step.runMs = Math.min(e.dur, step.endMs - step.startMs);
    if (e.code !== void 0) step.exitCode = e.code;
    if (e.bgid) step.backgroundId = e.bgid;
    if (e.child) this.linkSubagent(e.child, step);
    const approvedAt = this.approvalAt.get(step);
    if (approvedAt !== void 0) {
      const total = step.endMs - step.startMs;
      step.waitMs = step.runMs !== void 0 ? total - step.runMs : Math.max(0, step.endMs - approvedAt);
    }
    this.toolClosed(ctx, step, e.t);
  }
  toolClosed(ctx, step, t) {
    ctx.open.delete(step.id);
    ctx.lastToolEnd = Math.max(ctx.lastToolEnd ?? t, t);
    if (ctx.open.size === 0) ctx.modelStart = t;
  }
  batchDone(e) {
    const ctx = this.ctxFor(e);
    const ids = new Set(e.ids ?? []);
    if (ids.size > 1) {
      for (const step of this.steps) {
        if (step.kind === "tool" && ids.has(step.id) && !step.flags.includes("parallel")) {
          step.flags.push("parallel");
        }
      }
    }
    ctx.batchOpen = false;
    if (ctx.open.size === 0 && ctx.modelStart === null) ctx.modelStart = ctx.lastToolEnd ?? e.t;
  }
  openSubagent(agentId, agentType, t) {
    const existing = this.subagents.get(agentId);
    if (existing) return existing;
    const unlinked = [...this.agentCalls].reverse().filter((c) => !this.linkedCalls.has(c.id));
    const call = unlinked.find((c) => c.agentType === agentType) ?? unlinked[0];
    const step = {
      id: `agent:${agentId}`,
      parentId: call?.id ?? this.turn?.id ?? null,
      kind: "subagent",
      startMs: t,
      endMs: t,
      flags: call?.flags.includes("background") ? ["background"] : [],
      agentId
    };
    if (agentType) step.agentType = agentType;
    if (call) this.linkedCalls.add(call.id);
    this.subagents.set(agentId, step);
    this.ctxs.set(agentId, this.newCtx(agentId, step.id));
    return this.push(step);
  }
  /** PostToolUse of an Agent call names the subagent it ran; fix the link if the guess was wrong. */
  linkSubagent(agentId, call) {
    const sub = this.subagents.get(agentId);
    if (!sub || sub.parentId === call.id) return;
    if (sub.parentId) this.linkedCalls.delete(sub.parentId);
    this.linkedCalls.add(call.id);
    sub.parentId = call.id;
  }
  subagentStart(e) {
    if (!e.aid) return;
    const seen = this.ctxs.has(e.aid);
    const sub = this.openSubagent(e.aid, e.at, e.t);
    const ctx = this.ctxs.get(e.aid);
    if (!seen && ctx) ctx.modelStart = e.t;
    sub.startMs = Math.min(sub.startMs, e.t);
  }
  subagentStop(e) {
    if (!e.aid) return;
    const ctx = this.ctxs.get(e.aid);
    const sub = this.subagents.get(e.aid);
    if (ctx) {
      this.closeModel(ctx, e.t, ["answer"]);
      this.closeOpenTools(ctx, e.t, "unfinished");
    }
    if (sub) sub.endMs = Math.max(sub.endMs, e.t);
  }
  stop(e) {
    const flags = e.e === "StopFailure" ? ["answer", "api-error"] : ["answer"];
    this.closeModel(this.main, e.t, flags);
    this.closeOpenTools(this.main, e.t, "unfinished");
    this.closeTurn(e.t);
  }
  compactStart(t) {
    if (this.turn && this.main.modelStart !== null) {
      this.main.modelParts.push(this.modelStep(this.main, this.main.modelStart, t));
      this.main.modelStart = null;
    }
    this.compaction = this.push({
      id: this.id("compact"),
      parentId: this.turn?.id ?? null,
      kind: "compact",
      startMs: t,
      endMs: t,
      flags: []
    });
    this.compactions.push(this.compaction);
  }
  compactEnd(t) {
    if (!this.compaction) return;
    this.compaction.endMs = t;
    this.compaction = null;
    if (this.turn && this.main.open.size === 0) this.main.modelStart = t;
  }
  closeOpenTools(ctx, t, flag) {
    for (const step of ctx.open.values()) {
      step.endMs = Math.max(step.startMs, t);
      if (!step.flags.includes(flag)) step.flags.push(flag);
    }
    ctx.open.clear();
  }
  /** Session end, or end of data: close everything still open at t. */
  closeAll(t) {
    if (this.compaction) this.compactEnd(t);
    for (const [key, ctx] of this.ctxs) {
      if (key === "main") continue;
      this.closeModel(ctx, t, ["unfinished"]);
      this.closeOpenTools(ctx, t, "unfinished");
      const sub = this.subagents.get(key);
      if (sub && sub.endMs === sub.startMs && t > sub.startMs) sub.endMs = t;
    }
    if (this.turn) {
      this.closeModel(this.main, t, ["unfinished"]);
      this.closeOpenTools(this.main, t, "unfinished");
      this.closeTurn(t);
    }
  }
};

// src/store/paths.ts
import os from "node:os";
import path from "node:path";
function awfHome(env = process.env) {
  return env.AWF_HOME || path.join(os.homedir(), ".awf");
}
function eventsDir(env = process.env) {
  return path.join(awfHome(env), "events");
}

// src/store/events.ts
function listEventFiles(env = process.env) {
  const dir = eventsDir(env);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith(".jsonl")).map((name) => {
    const file = path2.join(dir, name);
    const stat = statSync(file);
    return {
      id: name.slice(0, -".jsonl".length),
      path: file,
      mtimeMs: stat.mtimeMs,
      size: stat.size
    };
  });
}
function readEvents(file) {
  const events = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event && typeof event.e === "string" && typeof event.t === "number") events.push(event);
    } catch {
    }
  }
  return events;
}
function loadRecordedSession(file) {
  return eventsToSession(file.id, readEvents(file.path));
}

// src/cli/table.ts
function table(header, rows, right = []) {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)));
  const line = (cells) => cells.map(
    (cell, i) => right.includes(i) ? cell.padStart(widths[i] ?? 0) : cell.padEnd(widths[i] ?? 0)
  ).join("  ").trimEnd();
  return [line(header), ...rows.map(line)].join("\n");
}
function homeRelative(file, home) {
  if (!file) return "";
  return home && (file === home || file.startsWith(home + "/")) ? "~" + file.slice(home.length) : file;
}

// src/cli/commands/sessions.ts
function sessionRow(session) {
  const idleMs = session.steps.filter((s) => s.kind === "idle").reduce((sum, s) => sum + (s.endMs - s.startMs), 0);
  const durationMs = Math.max(0, session.endMs - session.startMs);
  const row = {
    id: session.id,
    startMs: session.startMs,
    endMs: session.endMs,
    durationMs,
    activeMs: Math.max(0, durationMs - idleMs),
    turns: session.steps.filter((s) => s.kind === "turn").length,
    toolCalls: session.steps.filter((s) => s.kind === "tool").length,
    sources: session.sources
  };
  if (session.cwd) row.cwd = session.cwd;
  return row;
}
var sessionsCommand = {
  summary: "List recorded sessions with start time and duration",
  usage: `Usage: awf sessions [--since 30d] [--json]

Lists the sessions the recorder captured, newest first.
  --since <age>   only sessions that started within this age (30d, 12h)
  --json          print JSON`,
  options: {
    since: { type: "string" },
    json: { type: "boolean" }
  },
  run(ctx, _args, options) {
    const since = typeof options.since === "string" ? ctx.now - parseSince(options.since) : -Infinity;
    const rows = listEventFiles(ctx.env).map((file) => sessionRow(loadRecordedSession(file))).filter((row) => row.startMs >= since && row.endMs > 0).sort((a, b) => b.startMs - a.startMs);
    if (options.json) {
      ctx.io.out(JSON.stringify(rows, null, 2));
      return 0;
    }
    if (rows.length === 0) {
      ctx.io.out(
        "No recorded sessions yet. Install the awf plugin, then run a Claude Code session."
      );
      return 0;
    }
    const home = ctx.env.HOME ?? os2.homedir();
    ctx.io.out(
      table(
        ["SESSION", "STARTED", "DURATION", "ACTIVE", "TURNS", "TOOLS", "PROJECT"],
        rows.map((r) => [
          r.id.slice(0, 8),
          formatClock(r.startMs),
          formatDuration(r.durationMs),
          formatDuration(r.activeMs),
          String(r.turns),
          String(r.toolCalls),
          homeRelative(r.cwd, home)
        ]),
        [2, 3, 4, 5]
      )
    );
    return 0;
  }
};

// src/cli/main.ts
var defaultIo = {
  out: (text) => process.stdout.write(text + "\n"),
  err: (text) => process.stderr.write(text + "\n")
};
var COMMANDS = {
  sessions: sessionsCommand
};
function usage() {
  const width = Math.max(...Object.keys(COMMANDS).map((name) => name.length));
  const lines = Object.entries(COMMANDS).map(
    ([name, command]) => `  ${name.padEnd(width)}  ${command.summary}`
  );
  return [
    `awf ${VERSION}: where a coding agent's time went, by phase.`,
    "",
    "Usage: awf <command> [options]",
    "",
    "Commands:",
    ...lines,
    "",
    'Run "awf <command> --help" for its options. Every command takes --json.'
  ].join("\n");
}
async function main(argv, io = defaultIo, env = process.env, cwd = process.cwd(), now = Date.now()) {
  const [name, ...rest] = argv;
  if (name === "--version" || name === "-v") {
    io.out(VERSION);
    return 0;
  }
  if (!name || name === "--help" || name === "-h" || name === "help") {
    io.out(usage());
    return 0;
  }
  const command = COMMANDS[name];
  if (!command) {
    io.err(`awf: unknown command "${name}". Run "awf --help".`);
    return 2;
  }
  let parsed;
  try {
    parsed = parseArgs({
      args: rest,
      options: { ...command.options, help: { type: "boolean", short: "h" } },
      allowPositionals: true,
      strict: true
    });
  } catch (error) {
    io.err(`awf ${name}: ${error instanceof Error ? error.message : String(error)}`);
    io.err(command.usage);
    return 2;
  }
  if (parsed.values.help) {
    io.out(command.usage);
    return 0;
  }
  try {
    return await command.run({ io, env, cwd, now }, parsed.positionals, parsed.values);
  } catch (error) {
    io.err(`awf ${name}: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

// src/cli/bin.ts
main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    process.stderr.write(`awf: ${error instanceof Error ? error.message : String(error)}
`);
    process.exitCode = 1;
  }
);
