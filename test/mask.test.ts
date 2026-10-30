import { describe, expect, it } from 'vitest';
import { cleanCommand, dropHeredocBodies, MASK, maskSecrets } from '../src/model/mask';

describe('maskSecrets', () => {
  it.each([
    ['export GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz0123456789', 'ghp_abcdef'],
    ['API_KEY="s3cr3t-value" node server.js', 's3cr3t-value'],
    ['DB_PASSWORD=hunter2 npm start', 'hunter2'],
    ['curl -H "Authorization: Bearer abc.def.ghi" https://api.example.com', 'abc.def.ghi'],
    ['psql postgres://admin:pa55word@db.internal:5432/app', 'pa55word'],
    ['mysql --password=topsecret -u root', 'topsecret'],
    ['npm publish --token npm_abcdefghijklmnopqrstuvwxyz0123456789AB', 'npm_abcdef'],
    ['echo sk-ant-api03-abcdefghijklmnopqrstuvwxyz', 'sk-ant-api03'],
    ['aws configure set aws_access_key_id AKIAABCDEFGHIJKLMNOP', 'AKIAABCDEFGHIJKLMNOP'],
    ['TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N', 'eyJhbGciOi'],
    [
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA\n-----END RSA PRIVATE KEY-----',
      'MIIEpAIBAAKCAQEA',
    ],
  ])('masks %s', (input, secret) => {
    const masked = maskSecrets(input);
    expect(masked).not.toContain(secret);
    expect(masked).toContain(MASK);
  });

  it.each([
    'pnpm test --run src/foo.test.ts',
    'git log --oneline -5',
    'NODE_ENV=production pnpm build',
    'cargo build --release',
    'grep -rn "token" src/',
    'GH_TOKEN=$(gh auth token) gh run view 1',
    'export API_KEY="$OTHER_KEY" && pnpm test',
    'TOKEN=`cat .token` curl x',
  ])('leaves %s alone', (input) => {
    expect(maskSecrets(input)).toBe(input);
  });
});

describe('flags inside a word', () => {
  it("doesn't take the end of a subcommand's name for a secret flag", () => {
    const command =
      'T=$(gcloud auth application-default print-access-token 2>/dev/null); if [ -n "$T" ]; then echo ok; fi';
    expect(maskSecrets(command)).toBe(command);
    expect(maskSecrets('gh api --token abc123 x')).toBe(`gh api --token ${MASK} x`);
    expect(maskSecrets('cli "--password=hunter2"')).toBe(`cli "--password=${MASK}"`);
  });
});

describe('dropHeredocBodies', () => {
  it('keeps the command and drops the file content', () => {
    const command =
      "cat > src/a.ts <<'EOF'\nexport const a = 1;\nexport const b = 2;\nEOF\npnpm test";
    expect(dropHeredocBodies(command)).toBe("cat > src/a.ts <<'EOF'\n‹2 lines›\nEOF\npnpm test");
  });

  it('handles unquoted and dash forms', () => {
    expect(dropHeredocBodies('python3 - <<PY\nprint(1)\nPY')).toBe('python3 - <<PY\n‹1 line›\nPY');
    expect(dropHeredocBodies('cat <<-END\n\tx\nEND')).toBe('cat <<-END\n‹1 line›\nEND');
  });

  it('leaves commands without heredocs alone', () => {
    expect(dropHeredocBodies('echo "a << b"')).toBe('echo "a << b"');
  });

  it('keeps the lines after a here-string, which has no body', () => {
    const command = 'IFS="|" read A B <<< "$pair"\ncurl -s "$B/health"\necho done';
    expect(dropHeredocBodies(command)).toBe(command);
  });
});

describe('cleanCommand', () => {
  it('caps very long commands', () => {
    expect(cleanCommand('x'.repeat(10_000)).length).toBeLessThan(4100);
  });
});
