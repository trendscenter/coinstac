const { get } = require('lodash');
const app = require('ampersand-app');

/* eslint-disable no-console */
/**
 * log utility used in the event that an error occurred before application could
 * fully boot and use the desired app-level logger.
 * @param {*}
 * @returns {undefined}
 */
const unfinishedBootLog = { error(content) { console.error(content); } };

module.exports = function logUnhandledError(opts) {
  opts = opts || {};
  return (err) => {
    const logger = get(app, 'logger') || unfinishedBootLog;
    if (logger === unfinishedBootLog) {
      console.error('error occurred before application had finished booting');
      console.error(err);
      process.exit(1);
    }
    if (opts.processType === 'render') {
      console.error(err);
      console.error(err.stack);
    }
    throw err;
  };
};
/* eslint-enable no-console */
