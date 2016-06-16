'use strict';

require('trace'); // active long stack trace
require('clarify'); // Exclude node internal calls from the stack

const Pouchy = require('pouchy');
Pouchy.plugin(require('pouchdb-adapter-memory'));

const fail = function (err) {
  const isLikelyBecausePouchDBServerHasNoTeardownHooks = (
    err && (
      err.code === 'ECONNREFUSED' ||
      err.code === 'ECONNRESET' ||
      err.message.match(/destroyed/) ||
      (err.message.match(/hang up/) && err.status === 400)
    )
  );
  if (isLikelyBecausePouchDBServerHasNoTeardownHooks) {
    // destroyed? huh? here: @ref https://github.com/pouchdb/express-pouchdb/issues/316
    // not enough time in the day to patch this.
    return;
  }
  const emptyError = new Error([
    'expected an Error instance.  this means that an uncaughtExpection',
    'occurred, and subsequently a falsy value was thrown vs the Error',
  ].join(' '));
  err = err || emptyError;

  console.error(err); // eslint-disable-line
  console.error(err.stack); // eslint-disable-line
  process.exit(1);
};

process.on('uncaughtExpection', fail);
process.on('unhandledRejection', fail);
Error.stackTraceLimit = Infinity;
