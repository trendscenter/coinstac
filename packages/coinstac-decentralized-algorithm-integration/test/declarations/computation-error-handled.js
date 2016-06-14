const path = require('path');

module.exports = {
  users: [
    { username: 'sandeep' },
    { username: 'prema' },
  ],
  computationPath: path.resolve(
    __dirname,
    '../../src/decentralized/computation-error-handled/index.js'
  ),
  verbose: true,
};
