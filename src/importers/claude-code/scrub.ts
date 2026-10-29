// Scrubs Claude Code transcripts into fixtures that are safe to commit.
// Keeps structure, timestamps, IDs, tool names and commands. Replaces prompts, assistant text,
// thinking, file contents and tool output with placeholders, and masks anything like a secret.
// Strings are dropped unless their key is on the keep list: a new field is scrubbed by default.
import { cleanCommand, maskSecrets } from '../../model/mask';
import { EXIT_CODE } from './format';

export interface ScrubOptions {
  /** The home directory to replace with /Users/user in paths. */
  home: string;
}

const TEXT = '‹text›';

/** String fields kept as they are (after path and secret masking). */
const KEEP = new Set([
  'type',
  'subtype',
  'uuid',
  'parentUuid',
  'logicalParentUuid',
  'leafUuid',
  'sessionId',
  'timestamp',
  'version',
  'id',
  'tool_use_id',
  'requestId',
  'requestRef',
  'model',
  'requestedModel',
  'resolvedModel',
  'role',
  'stop_reason',
  'userType',
  'entrypoint',
  'agentId',
  'agentType',
  'backgroundTaskId',
  'taskId',
  'task_id',
  'status',
  'retrieval_status',
  'subagent_type',
  'operation',
  'trigger',
  'querySource',
  'promptId',
  'prompt_id',
  'sourceToolUseID',
  'sourceToolAssistantUUID',
  'toolUseID',
  'messageId',
  'snapshotMessageId',
  'decision',
  'source',
  'reasonType',
  'ruleSource',
  'kind',
  'level',
  'hookEvent',
  'permissionMode',
  'name',
  'commandName',
  'taskType',
  'task_type',
  'cwd',
  'file_path',
  'filePath',
  'path',
  'notebook_path',
]);

/** Tool input fields kept: what classifying a call needs. */
const INPUT_KEEP = new Set([
  'file_path',
  'path',
  'notebook_path',
  'subagent_type',
  'task_id',
  'bash_id',
]);

/** Fields whose whole value is content: dropped even when they are objects. */
const DROP = new Set([
  'signature',
  'snapshot',
  'backup',
  'originalFile',
  'structuredPatch',
  'shape',
]);

export function makeScrubber(options: ScrubOptions) {
  const home = options.home.replace(/\/+$/, '');
  const encodedHome = home.replace(/[^A-Za-z0-9]/g, '-');
  const user = home.split('/').pop() ?? '';

  const paths = (text: string): string => {
    let out = text.split(home).join('/Users/user').split(encodedHome).join('-Users-user');
    if (user.length > 2) out = out.replace(new RegExp(`\\b${escape(user)}\\b`, 'g'), 'user');
    return out;
  };
  const keep = (text: string) => maskSecrets(paths(text));

  /** A user or assistant text: keeps only the markers the importer reads. */
  const text = (value: string): string => {
    const trimmed = value.trimStart();
    if (trimmed.includes('<task-notification>')) {
      const tag = (name: string) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(trimmed)?.[1];
      const parts = ['task-id', 'tool-use-id', 'status']
        .map((name) => [name, tag(name)] as const)
        .filter(([, v]) => v !== undefined)
        .map(([name, v]) => `<${name}>${keep(v as string)}</${name}>`);
      return `<task-notification>${parts.join('')}<summary>${TEXT}</summary></task-notification>`;
    }
    if (trimmed.startsWith('[Request interrupted')) return trimmed.split('\n')[0] ?? trimmed;
    const command = /^<command-name>([^<]*)<\/command-name>/.exec(trimmed);
    if (command) return `<command-name>${keep(command[1] ?? '')}</command-name>${TEXT}`;
    const tag = /^<([a-z][a-z0-9_-]*)[\s>]/i.exec(trimmed);
    if (tag) return `<${tag[1]}>${TEXT}</${tag[1]}>`;
    return TEXT;
  };

  /** Tool output: the first line survives only if it is an exit code or a background task ID. */
  const output = (value: string): string => {
    const first = value.split('\n')[0] ?? '';
    if (EXIT_CODE.test(first)) return `${first}\n‹output›`;
    const bg = /^(Command running in background with ID: [A-Za-z0-9_-]+)/.exec(first);
    if (bg) return `${bg[1]}. ‹output›`;
    return '‹output›';
  };

  const scrub = (value: unknown, key: string): unknown => {
    if (typeof value === 'string') {
      if (key === 'command') return keep(cleanCommand(value));
      return KEEP.has(key) ? keep(value) : TEXT;
    }
    if (Array.isArray(value)) return value.map((item) => scrub(item, key));
    if (value === null || typeof value !== 'object') return value;
    const object = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(object)) {
      if (DROP.has(k)) continue;
      if (object.type === 'thinking' && k === 'thinking') out[k] = '‹thinking›';
      else if (object.type === 'text' && k === 'text' && typeof v === 'string') out[k] = text(v);
      else if (object.type === 'tool_result' && k === 'content') out[k] = scrubResult(v);
      else if (object.type === 'image' && k === 'source') out[k] = { type: 'base64', data: '' };
      else if (k === 'content' && typeof v === 'string') out[k] = text(v);
      else if (k === 'toolUseResult' && typeof v === 'string') out[k] = output(v);
      else if (k === 'gitBranch' && typeof v === 'string') out[k] = 'main';
      else if (object.type === 'tool_use' && k === 'input') out[k] = scrubInput(v);
      else if (k === 'wireToolInputs' && v && typeof v === 'object') {
        // Copies of tool inputs, keyed by tool_use ID.
        out[k] = Object.fromEntries(
          Object.entries(v).map(([id, input]) => [id, scrubInput(input)]),
        );
      } else out[k] = scrub(v, k);
    }
    return out;
  };

  /** A tool call's input: only what the importer reads survives; every other string is dropped. */
  const scrubInput = (input: unknown): unknown => {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) return {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (typeof v === 'string') {
        if (k === 'command') out[k] = keep(cleanCommand(v));
        else if (INPUT_KEEP.has(k)) out[k] = keep(v);
        else out[k] = TEXT;
      } else if (typeof v === 'boolean' || typeof v === 'number') {
        out[k] = v;
      } else {
        out[k] = TEXT;
      }
    }
    return out;
  };

  const scrubResult = (content: unknown): unknown => {
    if (typeof content === 'string') return output(content);
    if (!Array.isArray(content)) return '‹output›';
    return content.map((block) => {
      const b = block as Record<string, unknown>;
      if (b?.type === 'text' && typeof b.text === 'string')
        return { type: 'text', text: output(b.text) };
      return { type: b?.type ?? 'unknown' };
    });
  };

  return {
    entry: (entry: Record<string, unknown>) => scrub(entry, '') as Record<string, unknown>,
    line: (line: string): string => {
      if (!line.trim()) return line;
      try {
        return JSON.stringify(scrub(JSON.parse(line), ''));
      } catch {
        return '‹bad line›';
      }
    },
    paths,
  };
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
