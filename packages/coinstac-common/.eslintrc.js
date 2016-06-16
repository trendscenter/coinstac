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
    'arrow-body-style': 0,
    'func-names': 0,
    'global-require': 0,
    'no-new': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'no-underscore-dangle': 0,
    'no-unused-vars': 0,
    'prefer-arrow-callback': 0,
    'prefer-const': 0,
    'prefer-template': 0,
  }
};
