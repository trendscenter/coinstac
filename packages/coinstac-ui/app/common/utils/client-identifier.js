/**
 * Get a unique client identifier.
 *
 * @todo  Change this to be a username or something more unique.
 */

'use strict';

var os = require('os');

module.exports = os.hostname();
