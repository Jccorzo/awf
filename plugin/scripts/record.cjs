// awf recorder hook. Built from src/recorder/hook.ts by scripts/build.mjs; do not edit.
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/recorder/hook.ts
var import_node_fs = require("node:fs");
var import_node_path2 = __toESM(require("node:path"), 1);

// src/store/paths.ts
var import_node_os = __toESM(require("node:os"), 1);
var import_node_path = __toESM(require("node:path"), 1);
function awfHome(env = process.env) {
  return env.AWF_HOME || import_node_path.default.join(import_node_os.default.homedir(), ".awf");
}
function eventsDir(env = process.env) {
  return import_node_path.default.join(awfHome(env), "events");
}
function safeId(id) {
  return id.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 128);
}

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
  // NAME=value and NAME: value for secret-looking names, in env assignments, exports and config lines.
  // A value that is a variable or a command substitution ($TOKEN, $(gh auth token)) holds no secret
  // in the text, and masking it would break the command.
  [
    new RegExp(
      `\\b(${SECRET_NAME})(\\s*[=:]\\s*)(?!\u2039|(?:Bearer|Basic|Token|Bot)\\s+\u2039|["']?[$\`])("[^"]*"|'[^']*'|[^\\s"';&|]+)`,
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

// src/recorder/event.ts
function str(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function obj(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function hashText(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
var ACTION_NAME = /^[A-Za-z][\w.-]{0,63}$/;
var MAX_ACTIONS = 50;
function toolActions(tool, input) {
  if (!tool.startsWith("mcp__")) return void 0;
  const short = tool.slice(tool.lastIndexOf("__") + 2);
  const named = (name, action2) => {
    const n = str(name);
    if (!n || !ACTION_NAME.test(n)) return void 0;
    const a = str(action2);
    return a && ACTION_NAME.test(a) ? `${n}:${a}` : n;
  };
  if (short.endsWith("batch") && Array.isArray(input.actions)) {
    const out = [];
    for (const item of input.actions.slice(0, MAX_ACTIONS)) {
      const call = obj(item);
      if (!call) continue;
      const action2 = call.name !== void 0 ? named(call.name, obj(call.input)?.action) : named(call.action, void 0);
      if (action2) out.push(action2);
    }
    return out.length > 0 ? out : void 0;
  }
  const action = named(short, input.action);
  return action?.includes(":") ? [action] : void 0;
}
var FILE_KEYS = ["file_path", "notebook_path", "path"];
var WITH_CWD = /* @__PURE__ */ new Set(["SessionStart", "UserPromptSubmit", "SessionEnd"]);
var WITH_TRANSCRIPT = /* @__PURE__ */ new Set(["SessionStart", "UserPromptSubmit", "Stop", "SessionEnd"]);
function toEvent(input, t) {
  const e = str(input.hook_event_name);
  const sid = str(input.session_id);
  if (!e || !sid) return null;
  const ev = { v: 1, e, t, sid };
  const aid = str(input.agent_id);
  if (aid) ev.aid = aid;
  const at = str(input.agent_type);
  if (at) ev.at = at;
  const pid = str(input.prompt_id);
  if (pid) ev.pid = pid;
  const tool = str(input.tool_name);
  if (tool) ev.tool = tool;
  const tuid = str(input.tool_use_id);
  if (tuid) ev.tuid = tuid;
  if (WITH_CWD.has(e) && str(input.cwd)) ev.cwd = str(input.cwd);
  if (WITH_TRANSCRIPT.has(e) && str(input.transcript_path)) ev.tp = str(input.transcript_path);
  const toolInput = obj(input.tool_input);
  if (toolInput && (e === "PreToolUse" || e === "PermissionRequest")) {
    ev.ih = hashText(JSON.stringify(toolInput));
  }
  if (toolInput && e === "PreToolUse") {
    const command = str(toolInput.command);
    if (command) ev.cmd = cleanCommand(command);
    const files = FILE_KEYS.map((key) => str(toolInput[key])).filter((f) => !!f);
    if (files.length > 0) ev.files = files;
    if (toolInput.run_in_background === true) ev.bg = true;
    const sub = str(toolInput.subagent_type);
    if (sub) ev.sub = sub;
    const act = tool ? toolActions(tool, toolInput) : void 0;
    if (act) ev.act = act;
    const ref = str(toolInput.task_id) ?? str(toolInput.bash_id) ?? str(toolInput.shell_id);
    if (ref) ev.bgid = ref;
  }
  switch (e) {
    case "UserPromptSubmit": {
      const pm = str(input.permission_mode);
      if (pm) ev.pm = pm;
      if (/^\s*<task-notification>/.test(str(input.prompt) ?? "")) ev.src = "task-notification";
      break;
    }
    case "PostToolUse":
    case "PostToolUseFailure": {
      ev.ok = e === "PostToolUse";
      if (typeof input.duration_ms === "number") ev.dur = Math.round(input.duration_ms);
      if (input.is_interrupt === true) ev.intr = true;
      const response = obj(input.tool_response);
      if (response) {
        const child = str(response.agentId);
        if (child) ev.child = child;
        const bgid = str(response.backgroundTaskId);
        if (bgid) ev.bgid = bgid;
        if (response.interrupted === true) ev.intr = true;
      }
      const error = str(input.error);
      const code = error ? /^(?:Error: )?Exit code (\d+)/.exec(error) : null;
      if (code) ev.code = Number(code[1]);
      break;
    }
    case "PostToolBatch": {
      if (Array.isArray(input.tool_calls)) {
        ev.ids = input.tool_calls.map((call) => str(obj(call)?.tool_use_id)).filter((id) => !!id);
      }
      break;
    }
    case "SessionStart": {
      const src = str(input.source);
      if (src) ev.src = src;
      const model = str(input.model) ?? str(obj(input.model)?.id);
      if (model) ev.model = model;
      break;
    }
    case "SessionEnd": {
      const reason = str(input.reason);
      if (reason) ev.reason = reason;
      break;
    }
    case "StopFailure": {
      const err = str(input.error);
      if (err) ev.err = err;
      break;
    }
    case "Stop": {
      if (Array.isArray(input.background_tasks) && input.background_tasks.length > 0) {
        ev.bgt = input.background_tasks.slice(0, 20).map((task) => {
          const t2 = obj(task) ?? {};
          const command = str(t2.command);
          return {
            id: str(t2.id) ?? "?",
            ...str(t2.type) ? { type: str(t2.type) } : {},
            ...command ? { cmd: cleanCommand(command) } : {}
          };
        });
      }
      break;
    }
    case "PreCompact":
    case "PostCompact": {
      const trigger = str(input.trigger);
      if (trigger) ev.trigger = trigger;
      break;
    }
    case "SubagentStop": {
      const atp = str(input.agent_transcript_path);
      if (atp) ev.atp = atp;
      break;
    }
  }
  return ev;
}

// src/recorder/hook.ts
var startedAt = Math.round(performance.timeOrigin);
try {
  if (!process.env.AWF_DISABLE) {
    const input = JSON.parse((0, import_node_fs.readFileSync)(0, "utf8"));
    const event = toEvent(input, startedAt);
    if (event) {
      const dir = eventsDir();
      (0, import_node_fs.mkdirSync)(dir, { recursive: true });
      (0, import_node_fs.appendFileSync)(import_node_path2.default.join(dir, `${safeId(event.sid)}.jsonl`), JSON.stringify(event) + "\n");
    }
  }
} catch {
}
