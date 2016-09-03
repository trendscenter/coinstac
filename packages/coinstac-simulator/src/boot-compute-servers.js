'use strict';

/**
 * @private
 * @module boot-compute-servers
 */

require('./utils/handle-errors');

const cp = require('child_process');
const path = require('path');
const { logger, getStdDataHandler } = require('./utils/logging');

/**
 * Run boot compute servers.
 *
 * @param {Object} params
 * @param {string} params.computationPath
 * @param {Object} [params.data] Remote portion of declaration, intended for
 * seeding the server.
 * @param {boolean} [params.verbose=false] Enable verbose logging
 * @returns {Promise} Resolves to an array of compute servers.
 */
function run({
  computationPath,
  data,
  verbose,
}) {
  return new Promise((res, rej) => {
    const serverName = 'COMPUTE-SERVER'; // just one server ATM...
    const server = cp.fork(
      path.join(__dirname, 'boot-compute-server.js'),
      {
        cwd: process.cwd(),
        silent: true,
      }
    );
    server.on('message', (msg) => {
      if (msg.ready) { return res([server]); }
      return rej(new Error(msg)); // err if we don't receive ready
    });

    server.on('error', (err) => logger.error(`process errored ${err.message}`));
    server.on('exit', (code) => {
      if (code) {
        throw new Error(`${serverName} [${process.pid}]: exited with ${code}`);
      }
    });

    if (verbose) {
      server.stdout.on('data', getStdDataHandler(server, serverName));
    }

    server.stderr.on('data', getStdDataHandler(server, serverName, 'error'));

    server.send({
      boot: {
        computationPath,
        data,
      },
    });
  });
}

module.exports = { run };

