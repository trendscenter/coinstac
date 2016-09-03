const path = require('path');

module.exports = {
  computationPath: path.resolve(
    __dirname,
    '../../src/decentralized/process-files/index.js'
  ),
  local: [{
    filenames: ['dummy-data-a.json'],
  }, {
    filenames: ['dummy-data-b.json'],
  }],
  verbose: true,
};
