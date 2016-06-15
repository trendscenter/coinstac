'use strict';

const _ = require('lodash');

module.exports = function getMockIpc() {
  return {
    sender: {
      send: function send(cb) {
        if (!_.isFunction(cb)) {
          throw new ReferenceError('provide a callback to the mock');
        }

        return function mockIpcSend() {
          /* eslint-disable prefer-rest-params */
          return cb.apply(this, _.toArray(arguments));
          /* eslint-enable prefer-rest-params */
        };
      },
    },
  };
};
