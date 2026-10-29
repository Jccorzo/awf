/**
 * Compiles a file glob to a regex tested against a path with forward slashes.
 * Supports **, *, ? and {a,b}. A pattern starting with **\/ matches at any depth, including the root.
 */
export function globToRegExp(glob: string): RegExp {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i] as string;
    if (c === '*') {
      if (glob[i + 1] === '*') {
        const slash = glob[i + 2] === '/';
        out += slash ? '(?:.*/)?' : '.*';
        i += slash ? 2 : 1;
      } else {
        out += '[^/]*';
      }
    } else if (c === '?') {
      out += '[^/]';
    } else if (c === '{') {
      const end = glob.indexOf('}', i);
      if (end === -1) {
        out += '\\{';
        continue;
      }
      const options = glob
        .slice(i + 1, end)
        .split(',')
        .map(escapeLiteral);
      out += `(?:${options.join('|')})`;
      i = end;
    } else {
      out += escapeLiteral(c);
    }
  }
  return new RegExp(`(?:^|/)${out}$`);
}

function escapeLiteral(text: string): string {
  return text.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

export function matchesAny(file: string, patterns: RegExp[]): boolean {
  const normal = file.replace(/\\/g, '/');
  return patterns.some((p) => p.test(normal));
}
