import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';

import { useServerInApi } from './eslint-rules/use-server-in-api.mjs';

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    plugins: {
      security: securityPlugin,
    },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-eval-with-expression': 'error',
    },
  },

  {
    plugins: {
      unicorn: unicornPlugin,
      sonarjs: sonarjsPlugin,
    },
    rules: {
      ...unicornPlugin.configs.recommended.rules,
      ...sonarjsPlugin.configs.recommended.rules,

      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-console-spaces': 'warn',
      'unicorn/no-useless-undefined': 'warn',
      'sonarjs/no-duplicate-string': ['warn', { threshold: 4 }],
      'sonarjs/cognitive-complexity': ['warn', 15],

      /*
       * Verbose style & structure enforcement (non-breaking, mostly warn)
       */
      'arrow-body-style': ['warn', 'always'],
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'warn',
      'max-depth': ['warn', 3],
      'max-params': ['warn', 4],
      'max-statements': ['warn', 15],
      complexity: ['warn', 8],
    },
  },

  {
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: true,
      },
    },

    rules: {
      'import/no-unresolved': 'error',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'warn',
    },
  },

  {
    files: ['**/*.{js,ts,tsx}'],
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-constant-condition': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-css-tags': 'warn',
      '@next/next/no-title-in-document-head': 'warn',
    },
  },

  {
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Test files — relax rules that conflict with jest.mock() factory constraints
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      // jest.mock() factories are hoisted by babel-jest — inner functions cannot be moved to outer scope
      'unicorn/consistent-function-scoping': 'off',
    },
  },

  // E2E spec files — conditional test.skip() inside beforeEach is an intentional pattern
  {
    files: ['e2e/**/*.spec.ts'],
    rules: {
      'sonarjs/no-skipped-tests': 'off',
    },
  },

  // ------------------------------
  // Custom local rules
  // ------------------------------
  {
    plugins: {
      local: { rules: { 'use-server-in-api': useServerInApi } },
    },
    files: ['features/*/api/*.ts', 'features/*/api/*.tsx'],
    rules: {
      'local/use-server-in-api': 'error',
    },
  },

  // ------------------------------
  // FSD layer boundary enforcement
  // Prevents cross-feature imports and upward layer violations
  // ------------------------------
  /*  {
    plugins: {
      boundaries: boundariesPlugin,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'app/!**!/!*' },
        { type: 'widgets', pattern: 'widgets/!**!/!*' },
        { type: 'features', pattern: 'features/!**!/!*' },
        { type: 'entities', pattern: 'entities/!**!/!*' },
        { type: 'shared', pattern: 'shared/!**!/!*' },
      ],
      'boundaries/ignore': ['**!/!*.test.*', '**!/!*.spec.*'],
    },
    rules: {
      // warn for now — 34 existing cross-feature violations need to be fixed first
      // Change to 'error' once all existing violations are resolved
      'boundaries/element-types': [
        'warn',
        {
          default: 'disallow',
          rules: [
            // app can import from anything
            {
              from: 'app',
              allow: ['app', 'widgets', 'features', 'entities', 'shared'],
            },
            // widgets can import from features, entities, shared (not app)
            {
              from: 'widgets',
              allow: ['widgets', 'features', 'entities', 'shared'],
            },
            // features can import from entities and shared only (not other features)
            { from: 'features', allow: ['entities', 'shared'] },
            // entities can import from entities and shared
            { from: 'entities', allow: ['entities', 'shared'] },
            // shared cannot import from any upper layer
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
    },
  },*/

  globalIgnores([
    '.next/**',
    'node_modules/**',
    'out/**',
    'build/**',
    'public/**',
    'coverage/**',
    'playwright-report/**',
    '*.d.ts',
  ]),
]);
