// PostToolUse hook: run Prettier on the file Claude just edited.
// Kept deliberately light, because awf measures this repo's own sessions.
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const FORMATTED = /\.(ts|tsx|js|mjs|cjs|json|md|ya?ml|css|html)$/;

try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const file = input.tool_input?.file_path;
  const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd;
  const prettier = path.join(root, 'node_modules', '.bin', 'prettier');
  if (file && FORMATTED.test(file) && file.startsWith(root + path.sep) && existsSync(prettier)) {
    spawnSync(prettier, ['--write', '--log-level', 'silent', file], {
      stdio: 'ignore',
      timeout: 10_000,
    });
  }
} catch {
  // Formatting is best effort and must never block the session.
}
