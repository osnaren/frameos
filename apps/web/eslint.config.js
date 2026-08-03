// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import importXPlugin from 'eslint-plugin-import-x'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import refreshPlugin from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  ...tanstackConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'react-refresh': refreshPlugin,
      'import-x': importXPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // --- React ---
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      'react/no-unescaped-entities': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': 'off', // R3F uses Three.js JSX elements

      // --- React Refresh ---
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // --- TypeScript ---
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'warn',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',

      // --- Import ordering & hygiene (import-x) ---
      'import/no-cycle': 'off',
      'import/order': 'off',
      'import/consistent-type-specifier-style': 'off',
      'import-x/no-duplicates': ['warn', { 'prefer-inline': true }],
      'import-x/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'react/**', group: 'external', position: 'before' },
            { pattern: '@/**', group: 'internal', position: 'before' },
            { pattern: '#/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['react', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'sort-imports': 'off',

      // --- General best practices ---
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'object-shorthand': ['warn', 'always'],
      'prefer-template': 'warn',
      'no-useless-rename': 'warn',
      'no-throw-literal': 'warn',
      eqeqeq: ['warn', 'always', { null: 'ignore' }],

      // --- TanStack overrides ---
      'pnpm/json-enforce-catalog': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: [
      '.claude/**',
      '.codex-temp/**',
      '.nitro/**',
      '.output/**',
      '.tanstack/**',
      'dist/**',
      'legacy-src/**',
      'eslint.config.js',
      'prettier.config.js',
    ],
  }
)
