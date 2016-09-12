const path = require('path');

module.exports = {
  computationPath: path.resolve(
    __dirname,
    '../../src/decentralized/computation-error-handled/index.js'
  ),
  local: Array(2),
  verbose: true,
};
