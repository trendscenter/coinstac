const auth = require('./auth');
const version = require('./version');
const cloudFiles = require('./cloudFiles');
// Add additional route files below
module.exports = [].concat(auth, version, cloudFiles);
