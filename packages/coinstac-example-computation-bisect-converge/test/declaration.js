const path = require('path');

module.exports = {
  users: [
    { username: 'jamin', userData: null },
    { username: 'sergey', userData: null },
    { username: 'drew', userData: null },
    { username: 'ross', userData: null },
  ],
  computationPath: path.resolve(__dirname, '../src/index.js'),
  verbose: true,
};
