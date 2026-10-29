import { ESLint } from 'eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function lintAsSource(code: string): Promise<string[]> {
  const eslint = new ESLint({ cwd: root });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(root, 'src/__network_sample__.ts'),
  });
  return (result?.messages ?? []).map((m) => `${m.ruleId}: ${m.message}`);
}

describe('no-network lint rule', () => {
  it.each([
    ["import http from 'node:http';\nexport default http;", 'no-restricted-imports'],
    ["import { request } from 'https';\nexport default request;", 'no-restricted-imports'],
    ["import net from 'net';\nexport default net;", 'no-restricted-imports'],
    ["export const get = () => fetch('https://example.com');", 'no-restricted-globals'],
    [
      "export const get = () => globalThis.fetch('https://example.com');",
      'no-restricted-properties',
    ],
    ["export const load = () => import('node:https');", 'no-restricted-syntax'],
    ["export const ws = new WebSocket('wss://example.com');", 'no-restricted-globals'],
  ])('fails on %s', async (code, rule) => {
    const messages = await lintAsSource(code);
    expect(messages.some((m) => m.startsWith(rule))).toBe(true);
  });

  it('passes on a file without network code', async () => {
    const messages = await lintAsSource(
      "import { readFileSync } from 'node:fs';\nexport const read = (p: string) => readFileSync(p, 'utf8');",
    );
    expect(messages).toEqual([]);
  });
});
