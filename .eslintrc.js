module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2017,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true,
    },
  },
  extends: 'airbnb',
  env: {
    node: true,
    commonjs: true,
    mocha: true,
    es6: true,
    browser: true,
  },

  /**
   * {@link https://github.com/benmosher/eslint-plugin-import/issues/275}
   * {@link https://github.com/benmosher/eslint-plugin-import#importcore-modules}
   */
  settings: {
    'import/core-modules': ['electron'],
  },
  rules: {
    strict: [0, 'global'], // required for node, configurable for browser, https://github.com/eslint/eslint/issues/2785#issuecomment-113254153
    'arrow-body-style': 0,
    'consistent-return': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'no-underscore-dangle': 0,
    'react/forbid-prop-types': 0,
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    }],
  },
};
