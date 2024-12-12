/* eslint-disable import/no-extraneous-dependencies */
import react from 'eslint-plugin-react';
import prettier from 'eslint-plugin-prettier';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import importPlugin from 'eslint-plugin-import';
// import jsconfig from './jsconfig.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...compat.extends(
    'airbnb',
    'airbnb/hooks',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended'
  ),
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    plugins: {
      react,
      prettier,
      import: importPlugin,
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
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
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-props-no-spreading': 'off',
      'import/prefer-default-export': 'off',
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'no-underscore-dangle': ['error', { allow: ['__dirname', '__filename'] }],
    },
  },
];
