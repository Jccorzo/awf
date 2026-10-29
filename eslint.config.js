import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// awf never talks to the network. These modules and globals are banned anywhere in src/.
const NETWORK_MODULES = [
  'http',
  'https',
  'http2',
  'net',
  'tls',
  'dgram',
  'dns',
  'undici',
  'node-fetch',
  'cross-fetch',
  'axios',
  'got',
  'ws',
  'request',
  'superagent',
];
const NETWORK_GLOBALS = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'];
const MESSAGE = 'awf makes no network calls (see CLAUDE.md).';
const MODULE_PATTERN = `/^(node:)?(${NETWORK_MODULES.join('|')})(\\/.*)?$/`;

export const noNetworkRules = {
  'no-restricted-imports': [
    'error',
    {
      paths: NETWORK_MODULES.flatMap((name) => [name, `node:${name}`]).map((name) => ({
        name,
        message: MESSAGE,
      })),
      patterns: [
        {
          group: NETWORK_MODULES.flatMap((name) => [`${name}/*`, `node:${name}/*`]),
          message: MESSAGE,
        },
      ],
    },
  ],
  'no-restricted-globals': [
    'error',
    ...NETWORK_GLOBALS.map((name) => ({ name, message: MESSAGE })),
  ],
  'no-restricted-properties': [
    'error',
    ...['globalThis', 'window', 'self', 'global'].flatMap((object) =>
      NETWORK_GLOBALS.map((property) => ({ object, property, message: MESSAGE })),
    ),
    { object: 'navigator', property: 'sendBeacon', message: MESSAGE },
  ],
  'no-restricted-syntax': [
    'error',
    { selector: `ImportExpression[source.value=${MODULE_PATTERN}]`, message: MESSAGE },
    {
      selector: `CallExpression[callee.name='require'][arguments.0.value=${MODULE_PATTERN}]`,
      message: MESSAGE,
    },
  ],
};

export default [
  {
    ignores: [
      'dist/',
      'plugin/scripts/',
      'node_modules/',
      'coverage/',
      'fixtures/',
      'test-results/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: noNetworkRules,
  },
  {
    files: ['src/report/client/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
