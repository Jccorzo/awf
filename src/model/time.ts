/** "850 ms", "12.4s", "6m 10s", "1h 02m 13s". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '–';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)}s`;
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** "2026-10-28 23:02" in local time. */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parses "30d", "12h", "90m" into milliseconds. */
export function parseSince(value: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(d|h|m|w)$/.exec(value.trim());
  if (!match) throw new Error(`can't read "${value}": use a number and d, h, m or w, like 30d`);
  const n = Number(match[1]);
  const unit = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 }[
    match[2] as 'm' | 'h' | 'd' | 'w'
  ];
  return n * unit;
}
