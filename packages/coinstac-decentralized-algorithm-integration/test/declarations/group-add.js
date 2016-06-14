const path = require('path');

module.exports = {
  users: [
        { username: 'brittny', userData: null },
        { username: 'runtang', userData: null },
        { username: 'vince', userData: null },
        { username: 'margaret', userData: null },
  ],
  computationPath: path.resolve(
    __dirname,
    '../../src/decentralized/group-add/index.js'
  ),
  verbose: true,
};
