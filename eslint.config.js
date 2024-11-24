import config from '@antfu/eslint-config';

export default config({
  formatters: {
    // css: true,
    // html: true,
  },
  ignores: ['daisyui/**'],
  jsonc: true,
  markdown: true,
  stylistic: {
    indent: 2,
    quotes: 'single'
  },
  typescript: {
    typescript: {
      tsconfigPath: 'tsconfig.json'
    }
  }
}, {
  rules: {
    'curly': ['error', 'all'],
    'no-console': ['warn', { allow: ['debug'] }],
    'one-var': [
      'error',
      {
        const: 'consecutive',
        let: 'always',
        separateRequires: true,
        var: 'always'
      }
    ],
    'perfectionist/sort-array-includes': 'error',
    'perfectionist/sort-classes': 'error',
    'perfectionist/sort-enums': 'error',
    'perfectionist/sort-exports': 'error',
    'perfectionist/sort-interfaces': 'error',
    'perfectionist/sort-intersection-types': 'error',
    'perfectionist/sort-maps': 'error',
    'perfectionist/sort-named-exports': 'error',
    'perfectionist/sort-object-types': 'error',
    'perfectionist/sort-objects': 'error',
    'perfectionist/sort-union-types': 'error',
    'style/arrow-parens': ['error', 'always'],
    'style/brace-style': ['error', '1tbs'],
    'style/comma-dangle': ['error', 'never'],
    'style/semi': ['error', 'always']
  }
});
