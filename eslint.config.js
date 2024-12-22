import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

// eslint-disable-next-line no-underscore-dangle
const fileName = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const dirName = path.dirname(fileName);
const compat = new FlatCompat({
  baseDirectory: dirName,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...compat.extends(
    // 'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
    'plugin:react/jsx-runtime'
  ),
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    ignores: ['dist/**', 'node_modules/**', 'build/**'],
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      prettier,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      'react-refresh': reactRefresh,
    },

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.eslint.json',
        tsconfigRootDir: dirName,
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        alias: {
          map: [
            ['@photofolio-src', './src'],
            ['@assets', './src/assets'],
            ['@styles', './src/styles'],
            ['@components', './src/components'],
            ['@data', './src/data'],
            ['@hooks', './src/hooks'],
            ['@lib', './src/lib'],
            ['@pages', './src/pages'],
            ['@ctypes', './src/types'],
            ['@reusables', './src/reusables'],
            ['@utils', './src/utils'],
          ],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      'react-refresh/only-export-components': 'error',
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'react/jsx-filename-extension': [2, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
      // 'react/function-component-definition': ['error', { namedComponents: 'arrow-function' }],
      'import/prefer-default-export': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['warn'],
      'no-underscore-dangle': ['error', { allow: ['__filename'] }],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'react/jsx-uses-react': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
];
