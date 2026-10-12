'use strict';

/**
 * eslint.config.js – ESLint 9 flat config for the API and its tests.
 * Globals are listed inline so no extra packages are needed.
 */

const js = require('@eslint/js');

const nodeGlobals = {
  require: 'readonly', module: 'writable', exports: 'writable', process: 'readonly',
  __dirname: 'readonly', __filename: 'readonly', console: 'readonly', Buffer: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly',
};

const jestGlobals = {
  describe: 'readonly', test: 'readonly', it: 'readonly', expect: 'readonly', jest: 'readonly',
  beforeAll: 'readonly', afterAll: 'readonly', beforeEach: 'readonly', afterEach: 'readonly',
};

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: nodeGlobals },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: jestGlobals },
  },
];
