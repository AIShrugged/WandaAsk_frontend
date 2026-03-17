import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';

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
      jsdoc: jsdocPlugin,
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

      /*
       * Encourage vertical spacing
       */
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'const', next: '*' },
        { blankLine: 'always', prev: '*', next: 'if' },
      ],

      /*
       * JSDoc requirements (warn only, safe for existing codebase)
       */
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
          },
        },
      ],
      'jsdoc/require-param': 'warn',
      'jsdoc/require-returns': 'warn',
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
