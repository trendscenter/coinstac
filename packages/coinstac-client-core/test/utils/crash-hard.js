'use strict';

const crash = (err) => {
  console.error(err); // eslint-disable-line
  process.exit(1);
};

module.exports = {
  setup() {
    if (this._init) { return; }
    this._init = true;
    process.on('uncaughtException', crash);
    process.on('unhandledRejection', crash);
  },
};
