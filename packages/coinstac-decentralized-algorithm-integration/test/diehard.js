const fail = function fail(err) {
  const emptyError = new Error([
    'expected an Error instance.  this means that an uncaughtExpection',
    'occurred, and subsequently a falsy value was thrown vs the Error',
  ].join(' '));
  const error = err || emptyError;
  console.error(error);
  console.error(error.stack);
  process.exit(1);
};

module.exports = function registerErrorHandlers() {
  process.on('uncaughtExpection', fail);
  process.on('unhandledRejection', fail);
  Error.stackTraceLimit = Infinity;
};
