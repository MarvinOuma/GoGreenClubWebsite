import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

const rules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^[A-Z]', caughtErrors: 'none' }],
};

export default [
  { ignores: ['dist/**', 'dist-emulator/**', 'playwright-report/**', 'test-results/**'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { react, 'react-hooks': hooks },
    rules: {
      ...rules,
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['functions/**/*.{js,cjs,mjs}', 'tests/**/*.{js,mjs}', '*.config.js'],
    languageOptions: { globals: globals.node },
    rules,
  },
  { files: ['tests/browser.spec.js'], languageOptions: { globals: globals.browser } },
];
