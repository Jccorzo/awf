/** Renders rows as aligned columns. Columns listed in `right` are right-aligned. */
export function table(header: string[], rows: string[][], right: number[] = []): string {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)));
  const line = (cells: string[]) =>
    cells
      .map((cell, i) =>
        right.includes(i) ? cell.padStart(widths[i] ?? 0) : cell.padEnd(widths[i] ?? 0),
      )
      .join('  ')
      .trimEnd();
  return [line(header), ...rows.map(line)].join('\n');
}

export function homeRelative(file: string | undefined, home: string): string {
  if (!file) return '';
  return home && (file === home || file.startsWith(home + '/'))
    ? '~' + file.slice(home.length)
    : file;
}
