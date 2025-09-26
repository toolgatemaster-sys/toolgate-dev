const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Add any custom rules here
    },
  },
];
