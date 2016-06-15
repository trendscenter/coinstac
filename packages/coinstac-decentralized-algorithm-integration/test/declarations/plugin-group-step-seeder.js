const path = require('path');

module.exports = {
  users: [
    { username: 'john', userData: null },
    { username: 'joseph', userData: null },
  ],
  computationPath: path.resolve(
    __dirname,
    '../../src/decentralized/plugin-group-step-seeder/index.js'
  ),
  verbose: true,
};
