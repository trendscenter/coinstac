var _ = require('lodash');
var app = require('ampersand-app');

/**
 * log utility used in the event that an error occurred before application could
 * fully boot and use the desired app-level logger.
 * @param {*}
 * @returns {undefined}
 */
var unfinishedBootLog = { error: function(content) { console.error(content); } };

module.exports = function(opts) {
    opts = opts || {};
    return function(err) {
        var logger = _.get(app, 'logger') || unfinishedBootLog;
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
