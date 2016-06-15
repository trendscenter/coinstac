const path = require('path');

module.exports = {
  users: [
    { username: 'minionA', userData: { filenames: ['dummy-data-a.json'] } },
    { username: 'minionB', userData: { filenames: ['dummy-data-b.json'] } },
  ],
  computationPath: path.resolve(
    __dirname,
    '../../src/decentralized/process-files/index.js'
  ),
  verbose: true,
};
