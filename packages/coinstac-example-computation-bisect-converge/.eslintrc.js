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
    'consistent-return': 0,
    'no-param-reassign': 0,
    'prefer-arrow-callback': 0,
    'arrow-body-style': 0,
    'react/jsx-no-bind': 0,
    'import/no-unresolved': 0,
    'no-underscore-dangle': 0, // allow pouchdb/pouchy convention to sustain
    'react/prefer-stateless-function': 0,
    'quote-props': 0,
  }
};
