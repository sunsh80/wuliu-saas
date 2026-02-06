// eslint.config.js

import js from '@eslint/js';
import pluginWeapp from 'eslint-plugin-weapp';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.wxml', '**/*.wxss'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': 'warn',
      'no-irregular-whitespace': 'error',
    },
  },
  pluginWeapp.configs.recommended,
];