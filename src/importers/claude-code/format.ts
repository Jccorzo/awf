// What awf knows about Claude Code's transcript format. See docs/transcript-format.md.
// The format is internal to Claude Code and changes between versions, so anything not listed here
// is counted as unknown and reported by `awf import` and `awf doctor`, never fatal.

/** Entry types awf reads. */
export const READ_TYPES = new Set([
  'user',
  'assistant',
  'system',
  'queue-operation',
  'attachment',
  'api-request',
]);

/** Entry types awf knows and skips: metadata, UI state, request logs, file history. */
export const SKIPPED_TYPES = new Set([
  'summary',
  'last-prompt',
  'ai-title',
  'custom-title',
  'agent-name',
  'mode',
  'permission-mode',
  'atis-latch',
  'cost-state',
  'pr-link',
  'file-history-snapshot',
  'file-history-delta',
  'api-request-blob',
  'api-request-shape',
  'bridge-session',
  'relocated',
  'frame-link',
  'artifact-autoreact-ledger',
  'artifact-comment-monitor',
  'tools-used',
  'fork-context-ref',
  'continued-in',
  'progress',
]);

/** `system` subtypes awf knows. */
export const SYSTEM_SUBTYPES = new Set([
  'turn_duration',
  'stop_hook_summary',
  'away_summary',
  'api_error',
  'compact_boundary',
  'local_command',
  'informational',
  'agents_killed',
  'bridge_status',
]);

/** Content block types awf knows. */
export const BLOCK_TYPES = new Set([
  'text',
  'thinking',
  'redacted_thinking',
  'tool_use',
  'tool_result',
  'image',
  'document',
  'server_tool_use',
  'web_search_tool_result',
]);

export type Entry = Record<string, unknown>;
export type Block = Record<string, unknown>;

export function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function obj(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function timestampMs(entry: Entry): number | undefined {
  const raw = str(entry.timestamp);
  if (!raw) return undefined;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : undefined;
}

export function contentBlocks(entry: Entry): Block[] {
  const content = obj(entry.message)?.content;
  return Array.isArray(content) ? content.filter((b): b is Block => !!obj(b)) : [];
}

/** The text of a user or assistant message: a plain string, or its text blocks joined. */
export function messageText(entry: Entry): string {
  const content = obj(entry.message)?.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((b) => (obj(b)?.type === 'text' ? String(obj(b)?.text ?? '') : ''))
    .filter(Boolean)
    .join('\n');
}

/** The text of a tool_result block's content. */
export function resultText(block: Block): string {
  const content = block.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((b) => (obj(b)?.type === 'text' ? String(obj(b)?.text ?? '') : ''))
    .filter(Boolean)
    .join('\n');
}

export type PromptKind = 'human' | 'notification' | 'none';

/**
 * Whether a user entry starts a turn. Newer versions say so in `origin.kind`; older ones are told
 * apart by their leading tag: slash commands and plain text are yours, reminders and command output aren't.
 */
export function promptKind(entry: Entry): PromptKind {
  if (entry.isCompactSummary === true || entry.isVisibleInTranscriptOnly === true) return 'none';
  if (contentBlocks(entry).some((b) => b.type === 'tool_result')) return 'none';
  const text = messageText(entry).trimStart();
  if (text.startsWith('[Request interrupted')) return 'none';
  const origin = str(obj(entry.origin)?.kind);
  if (origin) return origin === 'human' ? 'human' : 'notification';
  if (entry.isMeta === true || !text) return 'none';
  if (text.startsWith('<task-notification>')) return 'notification';
  if (!text.startsWith('<')) return 'human';
  if (text.startsWith('<command-name>') || text.startsWith('<pasted_content')) return 'human';
  return 'none';
}

export interface TaskNotification {
  taskId?: string;
  toolUseId?: string;
  status?: string;
  ms: number;
}

/** Reads the IDs and status out of a `<task-notification>` block; ignores its summary and result. */
export function parseNotification(text: string, ms: number): TaskNotification | undefined {
  if (!text.includes('<task-notification>')) return undefined;
  const tag = (name: string) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(text)?.[1]?.trim();
  const notice: TaskNotification = { ms };
  const taskId = tag('task-id');
  const toolUseId = tag('tool-use-id');
  const status = tag('status');
  if (taskId) notice.taskId = taskId;
  if (toolUseId) notice.toolUseId = toolUseId;
  if (status) notice.status = status;
  return notice;
}

export const EXIT_CODE = /^(?:Error: )?Exit code (\d+)/;

/**
 * Whether a tool call's ID is Claude's own. Each belongs to one model response, so two sessions
 * holding one hold the same history. The recorder's `tool:1` and other agents' IDs say nothing.
 */
export function isClaudeCall(id: string): boolean {
  return id.startsWith('toolu_');
}
