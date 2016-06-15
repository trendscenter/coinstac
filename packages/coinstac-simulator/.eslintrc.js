module.exports = {
  parserOptions: {
      ecmaVersion: 6,
      ecmaFeatures: {
          jsx: true
      },
  },
  extends: 'airbnb',
  env: {
    node: true,
    commonjs: true,
    mocha: true,
    es6: true
  },
  rules: {
    strict: [0, 'global'], // required for node, configurable for browser, https://github.com/eslint/eslint/issues/2785#issuecomment-113254153
    'no-underscore-dangle': 0,
    'consistent-return': 0,
    'global-require': 0,
    'no-shadow': 0,
  }
};
