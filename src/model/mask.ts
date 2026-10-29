// Secret masking for commands and output. Used by the recorder and the report.
// It errs on the side of masking: a masked harmless value costs little, a leaked token costs a lot.

export const MASK = '‹masked›';

const SECRET_NAME =
  '[A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|PASSPHRASE|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|CLIENT_?SECRET|CREDENTIALS?|AUTH|SESSION_?KEY|COOKIE)[A-Za-z0-9_]*';

const PATTERNS: Array<[RegExp, string]> = [
  // Private key blocks
  [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
    `-----BEGIN PRIVATE KEY----- ${MASK} -----END PRIVATE KEY-----`,
  ],
  // Authorization headers, before the generic rule so the scheme word survives
  [
    /\b(Authorization|Proxy-Authorization)(\s*:\s*)(?:(Bearer|Basic|Token|Bot)\s+)?(?!‹)[^\s"']+/gi,
    `$1$2$3 ${MASK}`,
  ],
  [/\b(x-api-key|api-key|x-auth-token|x-access-token)(\s*:\s*)(?!‹)[^\s"']+/gi, `$1$2${MASK}`],
  // NAME=value and NAME: value for secret-looking names, in env assignments, exports and config lines
  [
    new RegExp(
      `\\b(${SECRET_NAME})(\\s*[=:]\\s*)(?!‹|(?:Bearer|Basic|Token|Bot)\\s+‹)("[^"]*"|'[^']*'|[^\\s"';&|]+)`,
      'gi',
    ),
    `$1$2${MASK}`,
  ],
  // Credentials in connection strings: scheme://user:password@host
  [/\b([a-z][a-z0-9+.-]*:\/\/[^:/\s@"']+:)([^@\s"']+)(@)/gi, `$1${MASK}$3`],
  // CLI flags that take a secret
  [
    /(--?(?:password|passwd|pass|token|api-key|apikey|secret|access-key|secret-key|auth-token|client-secret)(?:=|\s+))("[^"]*"|'[^']*'|[^\s"']+)/gi,
    `$1${MASK}`,
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
  [/\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, MASK],
];

export function maskSecrets(text: string): string {
  let out = text;
  for (const [pattern, replacement] of PATTERNS) out = out.replace(pattern, replacement);
  return out;
}

/**
 * Drops heredoc bodies from a shell command, keeping the command around them.
 * `cat > a.ts <<'EOF' ... EOF` becomes `cat > a.ts <<'EOF' ‹12 lines› EOF`: the body is file content.
 */
export function dropHeredocBodies(command: string): string {
  if (!command.includes('<<')) return command;
  const lines = command.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    out.push(line);
    const tags = [...line.matchAll(/<<-?\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][A-Za-z0-9_]*))/g)]
      .map((m) => m[1] ?? m[2] ?? m[3])
      .filter((tag): tag is string => Boolean(tag));
    for (const tag of tags) {
      let body = 0;
      while (i + 1 < lines.length && (lines[i + 1] ?? '').trim() !== tag) {
        i++;
        body++;
      }
      if (body > 0) out.push(`‹${body} line${body === 1 ? '' : 's'}›`);
      if (i + 1 < lines.length) {
        i++;
        out.push(lines[i] ?? '');
      }
    }
  }
  return out.join('\n');
}

const MAX_COMMAND = 4000;

/** What the recorder stores for a Bash command. */
export function cleanCommand(command: string): string {
  const cleaned = maskSecrets(dropHeredocBodies(command));
  return cleaned.length > MAX_COMMAND ? cleaned.slice(0, MAX_COMMAND) + ' ‹…›' : cleaned;
}
