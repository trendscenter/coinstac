
const config = require('../config/default');

let local;
try {
  local = require('../config/local'); // eslint-disable-line import/no-absolute-path, import/no-unresolved, global-require
} catch (e) {
  local = {};
}

module.exports = Object.assign({}, config, local);
