'use strict';

/**
 * @private
 * @module db-server
 */

require('./handle-errors');

const pdbs = require('spawn-pouchdb-server');
const cp = require('child_process');
const pdbsConfig = require('./.pouchdb-server-config');
const cloneDeep = require('lodash/cloneDeep');

const me = {};

/**
 * @function setup
 * @description boots a pouchdb-server, a dbRegistry instance, and
 * a computation registry instance.  these utilities are commonly
 * required for PipelineRunnerPool testing
 * @returns {Promise}
 */
const setup = () => { // eslint-disable-line
  return new Promise((res, rej) => {
    try { cp.execSync('pkill -f pouchdb-server'); } catch (err) {} // eslint-disable-line
    // @note ^^^ helpful to uncomment when tests are failing

    // spawn-pouchdb-server mutates user input >:(
    // https://github.com/hoodiehq/spawn-pouchdb-server/pull/33
    pdbs(cloneDeep(pdbsConfig), (err, srv) => {
      if (err) { return rej(err); }
      me.server = srv;
      return res(srv);
    });
  });
};

const teardown = () => { // eslint-disable-line
  return new Promise((res, rej) => {
    me.server.stop((err) => {
      if (err) { return rej(err); }
      return res();
    });
  });
};

process.on('message', (opts) => {
  if (opts.boot) {
    return setup(opts.boot)
    .then(() => process.send({ ready: true }));
  } else if (opts.teardown) {
    return teardown()
    .then(() => {
      process.send({ toredown: true });
      process.exit(0);
    });
  }
  throw new Error([
    'message from parent process has no matching command',
    JSON.stringify(opts),
  ].join(' '));
});
