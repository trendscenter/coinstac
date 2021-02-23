'use strict';

let logger = console.log;

module.exports = {
  logger,
  setLogger(overideLogger) { this.logger = overideLogger; },
  setTimeoutPromise(delay) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  },
};
