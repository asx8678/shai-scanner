import js from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // ── Style (lenient — matches existing codebase) ──
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],

      // ── Best practices ──
      eqeqeq: ['warn', 'smart'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-template': 'off',
      'no-throw-literal': 'error',
      'no-useless-assignment': 'warn',

      // ── Node.js specifics ──
      'no-process-exit': 'off',

      // ── False-positive suppressions ──
      'no-control-regex': 'off',
      'no-unused-private-class-members': 'off',
    },
  },
  prettierConfig,
  {
    ignores: [
      'node_modules/**',
      'test/**',
      'docs/**',
      'marketing/**',
      'templates/**',
      'tutorials/**',
      '**/*.md',
      '**/*.html',
      '**/*.json',
      'scripts/**',
      'examples/**',
      '.github/**',
      '**/*.yml',
      '**/*.yaml',
      'package-lock.json',
    ],
  },
];
