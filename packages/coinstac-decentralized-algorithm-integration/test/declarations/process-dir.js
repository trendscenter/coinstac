const path = require('path');

module.exports = {
  users: [
    { username: 'jill', userData: { dirs: ['jills-data'] } },
    { username: 'chris', userData: { dirs: ['chris-data'] } },
  ],
  computationPath: path.resolve(
    __dirname,
    '../../src/decentralized/process-dir/index.js'
  ),
  verbose: true,
};
