#!/usr/bin/env node
import { createRequire as __awfCreateRequire } from 'node:module';
const require = __awfCreateRequire(import.meta.url);

// src/cli/main.ts
import { parseArgs } from "node:util";

// src/version.ts
var VERSION = "0.1.0";

// src/cli/commands/doctor.ts
import os2 from "node:os";

// src/importers/claude-code/locate.ts
import { existsSync, readdirSync, statSync } from "node:fs";
import path2 from "node:path";

// src/store/paths.ts
import os from "node:os";
import path from "node:path";
function awfHome(env = process.env) {
  return env.AWF_HOME || path.join(os.homedir(), ".awf");
}
function eventsDir(env = process.env) {
  return path.join(awfHome(env), "events");
}
function importedDir(env = process.env) {
  return path.join(awfHome(env), "imported");
}
function claudeProjectsDir(env = process.env) {
  if (env.AWF_CLAUDE_PROJECTS) return env.AWF_CLAUDE_PROJECTS;
  return path.join(env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude"), "projects");
}
function safeId(id) {
  return id.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 128);
}

// src/importers/claude-code/locate.ts
function listTranscripts(env = process.env, sinceMs = -Infinity) {
  const root = claudeProjectsDir(env);
  if (!existsSync(root)) return [];
  const files = [];
  for (const project of readdirSync(root)) {
    const dir = path2.join(root, project);
    let names;
    try {
      if (!statSync(dir).isDirectory()) continue;
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith(".jsonl")) continue;
      const file = path2.join(dir, name);
      try {
        const stat = statSync(file);
        if (!stat.isFile() || stat.mtimeMs < sinceMs) continue;
        files.push({
          id: name.slice(0, -".jsonl".length),
          path: file,
          project,
          mtimeMs: stat.mtimeMs,
          size: stat.size
        });
      } catch {
      }
    }
  }
  return files;
}

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
import { existsSync as existsSync2, readdirSync as readdirSync2, readFileSync, statSync as statSync2 } from "node:fs";
import path3 from "node:path";

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

// src/store/events.ts
function listEventFiles(env = process.env) {
  const dir = eventsDir(env);
  if (!existsSync2(dir)) return [];
  return readdirSync2(dir).filter((name) => name.endsWith(".jsonl")).map((name) => {
    const file = path3.join(dir, name);
    const stat = statSync2(file);
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

// src/store/imported.ts
import {
  existsSync as existsSync3,
  mkdirSync,
  readdirSync as readdirSync3,
  readFileSync as readFileSync2,
  renameSync,
  writeFileSync
} from "node:fs";
import path4 from "node:path";
function cacheFile(id, env = process.env) {
  return path4.join(importedDir(env), `${safeId(id)}.json`);
}
function readImported(id, env = process.env) {
  const file = cacheFile(id, env);
  if (!existsSync3(file)) return void 0;
  try {
    const parsed = JSON.parse(readFileSync2(file, "utf8"));
    return parsed.version === 1 && parsed.session ? parsed : void 0;
  } catch {
    return void 0;
  }
}
function writeImported(entry, env = process.env) {
  const dir = importedDir(env);
  mkdirSync(dir, { recursive: true });
  const file = cacheFile(entry.session.id, env);
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(entry));
  renameSync(tmp, file);
}
function listImportedIds(env = process.env) {
  const dir = importedDir(env);
  if (!existsSync3(dir)) return [];
  return readdirSync3(dir).filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -".json".length));
}
function stripDetail(session) {
  const { title: _title, ...rest } = session;
  return {
    ...rest,
    steps: session.steps.map((step) => {
      const { detail: _detail, ...kept } = step;
      return kept;
    })
  };
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

// src/cli/commands/doctor.ts
var doctorCommand = {
  summary: "Check the recorder and list transcript entries awf does not recognise",
  usage: `Usage: awf doctor [--json]

Shows whether the recorder is writing events, where awf reads and writes, and every transcript entry
type the importer didn't recognise, with the Claude Code versions that wrote it. Run it after a
Claude Code update. It reads what "awf import" stored, so run that first.`,
  options: { json: { type: "boolean" } },
  run(ctx, _args, options) {
    const events = listEventFiles(ctx.env);
    const lastEvent = Math.max(0, ...events.map((f) => f.mtimeMs));
    const transcripts = listTranscripts(ctx.env, ctx.now - 30 * 864e5);
    const imported = listImportedIds(ctx.env);
    const unknown = /* @__PURE__ */ new Map();
    for (const id of imported) {
      const session = readImported(id, ctx.env)?.session;
      for (const [type, count] of Object.entries(session?.diagnostics?.unknownEntries ?? {})) {
        const entry = unknown.get(type) ?? { count: 0, versions: /* @__PURE__ */ new Set() };
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
          { count: u.count, versions: [...u.versions].sort() }
        ])
      )
    };
    if (options.json) {
      ctx.io.out(JSON.stringify(report, null, 2));
      return 0;
    }
    const home = ctx.env.HOME ?? os2.homedir();
    const recorder = events.length === 0 ? "no events yet. Install the plugin: claude plugin install awf@awf" : `${events.length} sessions, last event ${formatDuration(ctx.now - lastEvent)} ago`;
    ctx.io.out(
      [
        `awf ${VERSION} on Node ${process.version}`,
        `Writes:   ${homeRelative(report.awfHome, home)} (events/, imported/)`,
        `Reads:    ${homeRelative(report.claudeProjects, home)} (never changes it)`,
        `Recorder: ${recorder}`,
        `Transcripts changed in the last 30 days: ${transcripts.length}; imported sessions: ${imported.length}`
      ].join("\n")
    );
    if (unknown.size === 0) {
      ctx.io.out(
        imported.length > 0 ? "Unknown transcript entries: none." : 'Run "awf import" to check transcripts.'
      );
    } else {
      ctx.io.out("Unknown transcript entries (skipped; new in a Claude Code update?):");
      ctx.io.out(
        table(
          ["TYPE", "COUNT", "CLAUDE CODE"],
          [...unknown].sort((a, b) => b[1].count - a[1].count).map(([type, u]) => [type, String(u.count), [...u.versions].sort().join(", ")]),
          [1]
        )
      );
    }
    return 0;
  }
};

// src/cli/commands/import.ts
import os3 from "node:os";
import path7 from "node:path";

// src/importers/claude-code/import.ts
import { existsSync as existsSync4, readdirSync as readdirSync4, readFileSync as readFileSync3 } from "node:fs";
import path5 from "node:path";

// src/model/mask.ts
var MASK = "\u2039masked\u203A";
var SECRET_NAME = "[A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|PASSPHRASE|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|CLIENT_?SECRET|CREDENTIALS?|AUTH|SESSION_?KEY|COOKIE)[A-Za-z0-9_]*";
var PATTERNS = [
  // Private key blocks
  [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
    `-----BEGIN PRIVATE KEY----- ${MASK} -----END PRIVATE KEY-----`
  ],
  // Authorization headers, before the generic rule so the scheme word survives
  [
    /\b(Authorization|Proxy-Authorization)(\s*:\s*)(?:(Bearer|Basic|Token|Bot)\s+)?(?!‹)[^\s"']+/gi,
    `$1$2$3 ${MASK}`
  ],
  [/\b(x-api-key|api-key|x-auth-token|x-access-token)(\s*:\s*)(?!‹)[^\s"']+/gi, `$1$2${MASK}`],
  // NAME=value and NAME: value for secret-looking names, in env assignments, exports and config lines
  [
    new RegExp(
      `\\b(${SECRET_NAME})(\\s*[=:]\\s*)(?!\u2039|(?:Bearer|Basic|Token|Bot)\\s+\u2039)("[^"]*"|'[^']*'|[^\\s"';&|]+)`,
      "gi"
    ),
    `$1$2${MASK}`
  ],
  // Credentials in connection strings: scheme://user:password@host
  [/\b([a-z][a-z0-9+.-]*:\/\/[^:/\s@"']+:)([^@\s"']+)(@)/gi, `$1${MASK}$3`],
  // CLI flags that take a secret
  [
    /(--?(?:password|passwd|pass|token|api-key|apikey|secret|access-key|secret-key|auth-token|client-secret)(?:=|\s+))("[^"]*"|'[^']*'|[^\s"']+)/gi,
    `$1${MASK}`
  ],
  // Well-known token formats
  [/\bsk-ant-[A-Za-z0-9_-]{10,}/g, MASK],
  [/\bsk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}/g, MASK],
  [/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{10,}/g, MASK],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/g, MASK],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/g, MASK],
  [/\bglpat-[A-Za-z0-9_-]{16,}/g, MASK],
  [/\bxox[abposr]-[A-Za-z0-9-]{10,}/g, MASK],
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, MASK],
  [/\bAIza[0-9A-Za-z_-]{30,}/g, MASK],
  [/\bnpm_[A-Za-z0-9]{30,}/g, MASK],
  [/\bya29\.[A-Za-z0-9_-]{20,}/g, MASK],
  [/\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, MASK]
];
function maskSecrets(text) {
  let out = text;
  for (const [pattern, replacement] of PATTERNS) out = out.replace(pattern, replacement);
  return out;
}
function dropHeredocBodies(command) {
  if (!command.includes("<<")) return command;
  const lines = command.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    out.push(line);
    const tags = [...line.matchAll(/<<-?\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][A-Za-z0-9_]*))/g)].map((m) => m[1] ?? m[2] ?? m[3]).filter((tag) => Boolean(tag));
    for (const tag of tags) {
      let body = 0;
      while (i + 1 < lines.length && (lines[i + 1] ?? "").trim() !== tag) {
        i++;
        body++;
      }
      if (body > 0) out.push(`\u2039${body} line${body === 1 ? "" : "s"}\u203A`);
      if (i + 1 < lines.length) {
        i++;
        out.push(lines[i] ?? "");
      }
    }
  }
  return out.join("\n");
}
var MAX_COMMAND = 4e3;
function cleanCommand(command) {
  const cleaned = maskSecrets(dropHeredocBodies(command));
  return cleaned.length > MAX_COMMAND ? cleaned.slice(0, MAX_COMMAND) + " \u2039\u2026\u203A" : cleaned;
}

// src/importers/claude-code/format.ts
var READ_TYPES = /* @__PURE__ */ new Set(["user", "assistant", "system", "queue-operation", "attachment"]);
var SKIPPED_TYPES = /* @__PURE__ */ new Set([
  "summary",
  "last-prompt",
  "ai-title",
  "custom-title",
  "agent-name",
  "mode",
  "permission-mode",
  "atis-latch",
  "cost-state",
  "pr-link",
  "file-history-snapshot",
  "file-history-delta",
  "api-request",
  "api-request-blob",
  "api-request-shape",
  "bridge-session",
  "relocated",
  "frame-link",
  "artifact-autoreact-ledger",
  "artifact-comment-monitor",
  "tools-used",
  "fork-context-ref",
  "progress"
]);
var SYSTEM_SUBTYPES = /* @__PURE__ */ new Set([
  "turn_duration",
  "stop_hook_summary",
  "away_summary",
  "api_error",
  "compact_boundary",
  "local_command",
  "informational",
  "agents_killed",
  "bridge_status"
]);
var BLOCK_TYPES = /* @__PURE__ */ new Set([
  "text",
  "thinking",
  "redacted_thinking",
  "tool_use",
  "tool_result",
  "image",
  "document",
  "server_tool_use",
  "web_search_tool_result"
]);
function str(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function obj(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function timestampMs(entry) {
  const raw = str(entry.timestamp);
  if (!raw) return void 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : void 0;
}
function contentBlocks(entry) {
  const content = obj(entry.message)?.content;
  return Array.isArray(content) ? content.filter((b) => !!obj(b)) : [];
}
function messageText(entry) {
  const content = obj(entry.message)?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((b) => obj(b)?.type === "text" ? String(obj(b)?.text ?? "") : "").filter(Boolean).join("\n");
}
function resultText(block) {
  const content = block.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((b) => obj(b)?.type === "text" ? String(obj(b)?.text ?? "") : "").filter(Boolean).join("\n");
}
function promptKind(entry) {
  if (entry.isCompactSummary === true || entry.isVisibleInTranscriptOnly === true) return "none";
  if (contentBlocks(entry).some((b) => b.type === "tool_result")) return "none";
  const text = messageText(entry).trimStart();
  if (text.startsWith("[Request interrupted")) return "none";
  const origin = str(obj(entry.origin)?.kind);
  if (origin) return origin === "human" ? "human" : "notification";
  if (entry.isMeta === true || !text) return "none";
  if (text.startsWith("<task-notification>")) return "notification";
  if (!text.startsWith("<")) return "human";
  if (text.startsWith("<command-name>") || text.startsWith("<pasted_content")) return "human";
  return "none";
}
function parseNotification(text, ms) {
  if (!text.includes("<task-notification>")) return void 0;
  const tag = (name) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(text)?.[1]?.trim();
  const notice = { ms };
  const taskId = tag("task-id");
  const toolUseId = tag("tool-use-id");
  const status = tag("status");
  if (taskId) notice.taskId = taskId;
  if (toolUseId) notice.toolUseId = toolUseId;
  if (status) notice.status = status;
  return notice;
}
var EXIT_CODE = /^(?:Error: )?Exit code (\d+)/;

// src/importers/claude-code/import.ts
var FILE_KEYS = ["file_path", "notebook_path", "path"];
var MAX_OUTPUT = 4e3;
function importClaudeCodeTranscript(file, options = {}) {
  const sessionId = path5.basename(file, ".jsonl");
  const reader = new TranscriptReader(options);
  reader.readMain(readLines(file));
  const subDir = path5.join(path5.dirname(file), sessionId, "subagents");
  if (existsSync4(subDir)) {
    for (const name of readdirSync4(subDir).sort()) {
      const match = /^agent-(.+)\.jsonl$/.exec(name);
      if (match?.[1]) reader.readSubagent(match[1], readLines(path5.join(subDir, name)));
    }
  }
  return reader.build(sessionId, file);
}
function readLines(file) {
  return readFileSync3(file, "utf8").split("\n");
}
var TranscriptReader = class {
  constructor(options) {
    this.options = options;
  }
  options;
  events = [];
  diagnostics = {
    unknownEntries: {},
    badLines: 0,
    warnings: []
  };
  toolUses = /* @__PURE__ */ new Map();
  messages = /* @__PURE__ */ new Map();
  details = /* @__PURE__ */ new Map();
  startEvents = /* @__PURE__ */ new Map();
  /** Calls of each assistant message still waiting for a result, to know when its batch is done. */
  batches = /* @__PURE__ */ new Map();
  notifications = [];
  /** Subagent type per agent ID, from the Agent call that ran it. */
  agentTypes = /* @__PURE__ */ new Map();
  turnOpen = false;
  turnStart = 0;
  lastActivity = 0;
  turnEndMark;
  cwd;
  version;
  title;
  count(key) {
    this.diagnostics.unknownEntries[key] = (this.diagnostics.unknownEntries[key] ?? 0) + 1;
  }
  emit(event) {
    this.events.push({ v: 1, sid: "", ...event });
  }
  parse(lines) {
    const entries = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (obj(entry)) entries.push(entry);
        else this.diagnostics.badLines++;
      } catch {
        this.diagnostics.badLines++;
      }
    }
    return entries;
  }
  /** Checks an entry's type, notes its version and cwd; returns false for entries to skip. */
  accept(entry) {
    const type = str(entry.type) ?? "<no type>";
    const version = str(entry.version);
    if (version && (!this.version || compareVersions(version, this.version) > 0))
      this.version = version;
    if (!this.cwd && str(entry.cwd)) this.cwd = str(entry.cwd);
    if (SKIPPED_TYPES.has(type)) return false;
    if (!READ_TYPES.has(type)) {
      this.count(type);
      return false;
    }
    return true;
  }
  readMain(lines) {
    for (const entry of this.parse(lines)) {
      if (!this.accept(entry)) continue;
      const ms = timestampMs(entry);
      if (ms === void 0) continue;
      const agentId = entry.isSidechain === true ? str(entry.agentId) ?? "sidechain" : void 0;
      switch (entry.type) {
        case "user":
          this.user(entry, ms, agentId);
          break;
        case "assistant":
          this.assistant(entry, ms, agentId);
          break;
        case "system":
          this.system(entry, ms);
          break;
        case "queue-operation":
        case "attachment": {
          const text = entry.type === "attachment" ? JSON.stringify(entry.attachment ?? "") : str(entry.content) ?? "";
          const notice = parseNotification(text, ms);
          if (notice && (entry.type === "attachment" || entry.operation === "enqueue")) {
            this.notifications.push(notice);
          }
          break;
        }
      }
    }
    if (this.turnOpen) this.closeTurn();
  }
  readSubagent(agentId, lines) {
    const entries = this.parse(lines).filter((e) => this.accept(e) && timestampMs(e) !== void 0);
    const first = entries[0];
    const last = entries[entries.length - 1];
    if (!first || !last) return;
    const at = this.agentTypes.get(agentId) ?? str(first.agentType);
    this.emit({
      e: "SubagentStart",
      t: timestampMs(first),
      aid: agentId,
      ...at ? { at } : {}
    });
    for (const entry of entries) {
      const ms = timestampMs(entry);
      if (entry.type === "user") this.toolResults(entry, ms, agentId);
      else if (entry.type === "assistant") this.assistant(entry, ms, agentId);
    }
    this.emit({ e: "SubagentStop", t: timestampMs(last), aid: agentId });
  }
  user(entry, ms, agentId) {
    if (agentId) {
      this.toolResults(entry, ms, agentId);
      return;
    }
    const kind = promptKind(entry);
    if (kind === "none") {
      if (messageText(entry).startsWith("[Request interrupted"))
        this.lastActivity = Math.max(this.lastActivity, ms);
      this.toolResults(entry, ms, void 0);
      return;
    }
    if (this.turnOpen) this.closeTurn();
    const text = messageText(entry);
    if (kind === "notification") {
      const notice = parseNotification(text, ms);
      if (notice) this.notifications.push(notice);
    } else if (this.options.detail && !this.title) {
      this.title = oneLine(text);
    }
    this.emit({
      e: "UserPromptSubmit",
      t: ms,
      ...kind === "notification" ? { src: "task-notification" } : {}
    });
    this.turnOpen = true;
    this.turnStart = ms;
    this.lastActivity = ms;
    this.turnEndMark = void 0;
  }
  closeTurn() {
    const end = this.turnEndMark !== void 0 && this.turnEndMark >= this.lastActivity ? this.turnEndMark : this.lastActivity;
    this.emit({ e: "Stop", t: Math.max(end, this.turnStart) });
    this.turnOpen = false;
  }
  toolResults(entry, ms, agentId) {
    const result = obj(entry.toolUseResult);
    const decision = obj(entry.permissionDecision);
    for (const block of contentBlocks(entry)) {
      if (block.type !== "tool_result") {
        if (!BLOCK_TYPES.has(String(block.type))) this.count(`block:${String(block.type)}`);
        continue;
      }
      const tuid = str(block.tool_use_id);
      if (!tuid) continue;
      if (!agentId) this.lastActivity = Math.max(this.lastActivity, ms);
      const text = resultText(block);
      const failed = block.is_error === true;
      const source = str(decision?.source) ?? "";
      const use = this.toolUses.get(tuid);
      if (source.startsWith("user")) {
        const startEvent = this.startEvents.get(tuid);
        if (startEvent)
          this.emit({
            e: "PermissionRequest",
            t: startEvent.t,
            tool: startEvent.tool,
            ih: tuid,
            ...agentId ? { aid: agentId } : {}
          });
      }
      if (str(decision?.decision) === "reject") {
        this.emit({ e: "PermissionDenied", t: ms, tuid, ...agentId ? { aid: agentId } : {} });
        this.resolveBatch(use, tuid, ms);
        continue;
      }
      const code = failed ? EXIT_CODE.exec(text) : null;
      const event = {
        e: failed ? "PostToolUseFailure" : "PostToolUse",
        t: ms,
        tuid,
        ok: !failed
      };
      if (use) event.tool = use.name;
      if (agentId) event.aid = agentId;
      if (code) event.code = Number(code[1]);
      if (result?.interrupted === true) event.intr = true;
      const child = str(result?.agentId);
      if (child && use && (use.name === "Agent" || use.name === "Task")) {
        event.child = child;
        const type = str(result?.agentType);
        if (type && !this.agentTypes.has(child)) this.agentTypes.set(child, type);
      }
      const bgid = str(result?.backgroundTaskId);
      if (bgid) event.bgid = bgid;
      this.emit(event);
      this.resolveBatch(use, tuid, ms);
      if (this.options.detail) {
        const detail = this.details.get(tuid) ?? {};
        if (text) detail.output = clip(maskSecrets(text));
        this.details.set(tuid, detail);
      }
    }
  }
  /** When the last call of an assistant message has its result, the batch is done (like PostToolBatch). */
  resolveBatch(use, tuid, ms) {
    const batch = use?.messageId ? this.batches.get(use.messageId) : void 0;
    if (!batch || !batch.pending.delete(tuid)) return;
    batch.lastMs = Math.max(batch.lastMs, ms);
    if (batch.pending.size === 0) {
      this.emit({
        e: "PostToolBatch",
        t: batch.lastMs,
        ids: batch.ids,
        ...batch.agentId ? { aid: batch.agentId } : {}
      });
    }
  }
  assistant(entry, ms, agentId) {
    const message = obj(entry.message) ?? {};
    const messageId = str(message.id) ?? str(entry.uuid);
    if (!agentId) this.lastActivity = Math.max(this.lastActivity, ms);
    if (messageId) {
      const known = this.messages.get(messageId);
      const record = known ?? { lastMs: ms };
      record.lastMs = Math.max(record.lastMs, ms);
      if (agentId) record.agentId = agentId;
      const model = str(message.model);
      if (model && model !== "<synthetic>") record.model = model;
      const usage2 = obj(message.usage);
      if (usage2) record.tokens = tokens(usage2);
      this.messages.set(messageId, record);
    }
    if (entry.isApiErrorMessage === true && !agentId) {
      this.emit({ e: "StopFailure", t: ms, err: "api_error" });
      this.turnOpen = false;
      return;
    }
    for (const block of contentBlocks(entry)) {
      if (!BLOCK_TYPES.has(String(block.type))) this.count(`block:${String(block.type)}`);
      if (block.type !== "tool_use") continue;
      const tuid = str(block.id);
      const name = str(block.name);
      if (!tuid || !name) continue;
      const input = obj(block.input) ?? {};
      const event = {
        e: "PreToolUse",
        t: ms,
        tool: name,
        tuid,
        ih: tuid
      };
      const command = str(input.command);
      if (command) event.cmd = cleanCommand(command);
      const files = FILE_KEYS.map((key) => str(input[key])).filter((f) => !!f);
      if (files.length > 0) event.files = files;
      if (input.run_in_background === true) event.bg = true;
      const sub = str(input.subagent_type);
      if (sub) event.sub = sub;
      if (agentId) event.aid = agentId;
      this.emit(event);
      this.startEvents.set(tuid, this.events[this.events.length - 1]);
      const use = { name };
      if (messageId) {
        use.messageId = messageId;
        const batch = this.batches.get(messageId) ?? {
          ids: [],
          pending: /* @__PURE__ */ new Set(),
          lastMs: ms
        };
        if (agentId) batch.agentId = agentId;
        batch.ids.push(tuid);
        batch.pending.add(tuid);
        this.batches.set(messageId, batch);
      }
      if (agentId) use.agentId = agentId;
      this.toolUses.set(tuid, use);
      if (this.options.detail) {
        const description = str(input.description);
        if (description) this.details.set(tuid, { description: oneLine(description) });
      }
    }
  }
  system(entry, ms) {
    const subtype = str(entry.subtype) ?? "<none>";
    if (!SYSTEM_SUBTYPES.has(subtype)) {
      this.count(`system:${subtype}`);
      return;
    }
    if (subtype === "turn_duration" || subtype === "stop_hook_summary") {
      this.turnEndMark = Math.max(this.turnEndMark ?? 0, ms);
    } else if (subtype === "compact_boundary") {
      const meta = obj(entry.compactMetadata) ?? {};
      const duration = typeof meta.durationMs === "number" ? meta.durationMs : 0;
      const trigger = str(meta.trigger);
      this.emit({ e: "PreCompact", t: ms - duration, ...trigger ? { trigger } : {} });
      this.emit({ e: "PostCompact", t: ms, ...trigger ? { trigger } : {} });
    }
  }
  build(sessionId, file) {
    const session = eventsToSession(sessionId, this.events);
    session.sources = ["transcript"];
    session.transcriptPath = file;
    if (this.cwd) session.cwd = this.cwd;
    if (this.version) session.agentVersion = this.version;
    if (this.title) session.title = this.title;
    session.diagnostics = this.diagnostics;
    this.addBackgroundSteps(session);
    this.addModelDetails(session);
    if (this.options.detail) {
      for (const step of session.steps) {
        const detail = this.details.get(step.id);
        if (detail) step.detail = detail;
      }
    }
    if (session.steps.length > 0) {
      session.startMs = Math.min(...session.steps.map((s) => s.startMs));
      session.endMs = Math.max(...session.steps.map((s) => s.endMs));
    }
    return session;
  }
  /** A background shell runs from its call until its completion notice. */
  addBackgroundSteps(session) {
    for (const call of session.steps.filter((s) => s.kind === "tool" && s.backgroundId)) {
      const notice = this.notifications.filter(
        (n) => (n.taskId === call.backgroundId || n.toolUseId === call.id) && n.ms >= call.startMs
      ).sort((a, b) => a.ms - b.ms)[0];
      if (!notice || notice.ms < call.startMs) continue;
      const step = {
        id: `bg:${call.backgroundId}`,
        parentId: call.id,
        kind: "background",
        startMs: call.startMs,
        endMs: notice.ms,
        flags: ["background"],
        backgroundId: call.backgroundId
      };
      if (call.tool) step.tool = call.tool;
      if (call.command) step.command = call.command;
      if (call.agentId) step.agentId = call.agentId;
      if (notice.status) step.ok = notice.status === "completed";
      session.steps.push(step);
    }
  }
  /** The model and tokens of the model call behind each model step. */
  addModelDetails(session) {
    const byAgent = /* @__PURE__ */ new Map();
    for (const message of this.messages.values()) {
      const key = message.agentId ?? "";
      byAgent.set(key, [...byAgent.get(key) ?? [], message]);
    }
    for (const step of session.steps) {
      if (step.kind !== "model") continue;
      const produced = step.produces?.[0];
      const use = produced ? this.toolUses.get(produced) : void 0;
      let message = use?.messageId ? this.messages.get(use.messageId) : void 0;
      if (!message && !produced) {
        message = (byAgent.get(step.agentId ?? "") ?? []).filter((m) => m.lastMs >= step.startMs && m.lastMs <= step.endMs + 1).sort((a, b) => b.lastMs - a.lastMs)[0];
      }
      if (message?.model) step.model = message.model;
      if (message?.tokens) step.tokens = message.tokens;
    }
  }
};
function tokens(usage2) {
  const n = (key) => typeof usage2[key] === "number" ? usage2[key] : 0;
  return {
    input: n("input_tokens"),
    output: n("output_tokens"),
    cacheRead: n("cache_read_input_tokens"),
    cacheWrite: n("cache_creation_input_tokens")
  };
}
function oneLine(text) {
  const plain = text.replace(/<(system-reminder|local-command-caveat|command-message)>[\s\S]*?<\/\1>/g, " ").replace(/<command-name>([^<]*)<\/command-name>/g, "$1 ").replace(/<\/?[a-z][a-z0-9_-]*(?:\s[^>]*)?>/gi, " ").replace(/\s+/g, " ").trim();
  const masked = maskSecrets(plain);
  return masked.length > 160 ? masked.slice(0, 157) + "\u2026" : masked;
}
function clip(text) {
  if (text.length <= MAX_OUTPUT) return text;
  const head = text.slice(0, 1500);
  const tail = text.slice(-2400);
  return `${head}
\u2026 ${text.length - head.length - tail.length} characters cut \u2026
${tail}`;
}
function compareVersions(a, b) {
  const pa = a.split(/[.-]/).map((x) => Number.parseInt(x, 10) || 0);
  const pb = b.split(/[.-]/).map((x) => Number.parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// src/store/sessions.ts
import path6 from "node:path";
function sessionIndex(env = process.env) {
  const index = /* @__PURE__ */ new Map();
  const entry = (id) => {
    let ref = index.get(id);
    if (!ref) index.set(id, ref = { id });
    return ref;
  };
  for (const file of listEventFiles(env)) entry(file.id).events = file;
  for (const id of listImportedIds(env)) entry(id).imported = true;
  for (const file of listTranscripts(env)) entry(file.id).transcript = file;
  return index;
}
function projectKey(dir) {
  return path6.resolve(dir).replace(/[^A-Za-z0-9]/g, "-");
}

// src/cli/commands/import.ts
function inProject(folder, dir) {
  if (!dir) return true;
  const key = projectKey(dir);
  return folder === key || folder.startsWith(key + "-");
}
var importCommand = {
  summary: "Import past sessions from Claude Code transcripts (read-only)",
  usage: `Usage: awf import [--since 30d] [--project <dir>] [--force] [--dry-run] [--json]

Reads every transcript under ~/.claude/projects/ (read-only) and keeps the timings in ~/.awf/imported/,
so your history survives Claude Code deleting transcripts after 30 days. Prints the sessions, steps
and any transcript entries awf doesn't recognise.
  --since <age>     only transcripts changed within this age
  --project <dir>   only sessions started in this folder or below it
  --force           re-import transcripts that haven't changed
  --dry-run         read and report, but write nothing
  --json            print JSON`,
  options: {
    since: { type: "string" },
    project: { type: "string" },
    force: { type: "boolean" },
    "dry-run": { type: "boolean" },
    json: { type: "boolean" }
  },
  run(ctx, _args, options) {
    const since = typeof options.since === "string" ? ctx.now - parseSince(options.since) : -Infinity;
    const project = typeof options.project === "string" ? path7.resolve(ctx.cwd, options.project) : void 0;
    const files = listTranscripts(ctx.env, since).filter((f) => inProject(f.project, project));
    const report = {
      transcripts: files.length,
      imported: 0,
      unchanged: 0,
      steps: 0,
      toolCalls: 0,
      unknownEntries: {},
      badLines: 0,
      versions: [],
      errors: []
    };
    const versions = /* @__PURE__ */ new Set();
    for (const file of files) {
      let session;
      const cached = options.force ? void 0 : readImported(file.id, ctx.env);
      if (cached && cached.source.mtimeMs === file.mtimeMs && cached.source.size === file.size) {
        session = cached.session;
        report.unchanged++;
      } else {
        try {
          session = importClaudeCodeTranscript(file.path);
        } catch (error) {
          report.errors.push({
            file: file.path,
            message: error instanceof Error ? error.message : String(error)
          });
          continue;
        }
        if (!options["dry-run"]) {
          writeImported(
            {
              version: 1,
              source: { path: file.path, mtimeMs: file.mtimeMs, size: file.size },
              session: stripDetail(session)
            },
            ctx.env
          );
        }
        report.imported++;
      }
      report.steps += session.steps.length;
      report.toolCalls += session.steps.filter((s) => s.kind === "tool").length;
      report.badLines += session.diagnostics?.badLines ?? 0;
      if (session.agentVersion) versions.add(session.agentVersion);
      for (const [type, count] of Object.entries(session.diagnostics?.unknownEntries ?? {})) {
        const entry = report.unknownEntries[type] ??= { count: 0, versions: [] };
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
    const home = ctx.env.HOME ?? os3.homedir();
    const verb = options["dry-run"] ? "Read" : "Imported";
    ctx.io.out(
      `${verb} ${report.transcripts - report.errors.length} of ${report.transcripts} sessions from ${homeRelative(claudeProjectsDir(ctx.env), home)} (${report.imported} new or changed, ${report.unchanged} unchanged): ${report.steps.toLocaleString("en-US")} steps, ${report.toolCalls.toLocaleString("en-US")} tool calls.`
    );
    if (report.versions.length > 0) {
      ctx.io.out(
        `Claude Code versions: ${report.versions[0]} to ${report.versions[report.versions.length - 1]}.`
      );
    }
    const unknown = Object.entries(report.unknownEntries).sort((a, b) => b[1].count - a[1].count);
    if (unknown.length === 0) {
      ctx.io.out("Unknown entries: none.");
    } else {
      ctx.io.out(`Unknown entries (${unknown.length} types, counted and skipped):`);
      ctx.io.out(
        table(
          ["TYPE", "COUNT", "CLAUDE CODE"],
          unknown.map(([type, u]) => [type, String(u.count), u.versions.sort().join(", ")]),
          [1]
        )
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
  }
};

// src/cli/commands/sessions.ts
import os4 from "node:os";
import path8 from "node:path";
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
function inFolder(cwd, dir) {
  if (!dir) return true;
  return !!cwd && (cwd === dir || cwd.startsWith(dir + path8.sep));
}
function listSessionRows(env) {
  const rows = [];
  for (const ref of sessionIndex(env).values()) {
    const recorded = ref.events ? eventsToSession(ref.id, readEvents(ref.events.path)) : void 0;
    const imported = ref.imported ? readImported(ref.id, env)?.session : void 0;
    const base = recorded ?? imported;
    if (!base || base.steps.length === 0) continue;
    const row = sessionRow(base);
    row.sources = [...recorded ? ["hooks"] : [], ...imported ? ["transcript"] : []];
    if (!row.cwd && imported?.cwd) row.cwd = imported.cwd;
    rows.push(row);
  }
  return rows.sort((a, b) => b.startMs - a.startMs);
}
var sessionsCommand = {
  summary: "List sessions with start time and duration",
  usage: `Usage: awf sessions [--since 30d] [--project <dir>] [--json]

Lists sessions newest first: those the recorder captured and those "awf import" read from transcripts.
  --since <age>     only sessions that started within this age (30d, 12h)
  --project <dir>   only sessions started in this folder or below it
  --json            print JSON`,
  options: {
    since: { type: "string" },
    project: { type: "string" },
    json: { type: "boolean" }
  },
  run(ctx, _args, options) {
    const since = typeof options.since === "string" ? ctx.now - parseSince(options.since) : -Infinity;
    const project = typeof options.project === "string" ? path8.resolve(ctx.cwd, options.project) : void 0;
    const rows = listSessionRows(ctx.env).filter(
      (row) => row.startMs >= since && inFolder(row.cwd, project)
    );
    if (options.json) {
      ctx.io.out(JSON.stringify(rows, null, 2));
      return 0;
    }
    if (rows.length === 0) {
      ctx.io.out(
        'No sessions yet. Install the awf plugin to record new sessions, or run "awf import" to read past ones.'
      );
      return 0;
    }
    const home = ctx.env.HOME ?? os4.homedir();
    ctx.io.out(
      table(
        ["SESSION", "STARTED", "DURATION", "ACTIVE", "TURNS", "TOOLS", "SOURCE", "PROJECT"],
        rows.map((r) => [
          r.id.slice(0, 8),
          formatClock(r.startMs),
          formatDuration(r.durationMs),
          formatDuration(r.activeMs),
          String(r.turns),
          String(r.toolCalls),
          r.sources.join("+"),
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
  sessions: sessionsCommand,
  import: importCommand,
  doctor: doctorCommand
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
