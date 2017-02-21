'use strict';

/**
 * @private
 * @module boot-remote
 */

require('./utils/handle-errors');

const cp = require('child_process');
const path = require('path');
const { logger, getStdDataHandler } = require('./utils/logging');

/**
 * Run remote process booting.
 *
 * @param {Object} params
 * @param {Array[]} params.activeComputationInputs
 * @param {string} params.computationPath
 * @param {Object} [params.data] Remote portion of declaration, intended for
 * seeding the remote process.
 * @param {string[]} params.usernames
 * @param {boolean} [params.verbose=false] Enable verbose logging
 * @returns {Promise} Resolves to a booted remote process.
 */
function run({
  activeComputationInputs,
  computationPath,
  data,
  usernames,
  verbose,
}) {
  return new Promise((res, rej) => {
    const remoteProcessName = 'REMOTE';
    const remoteProcess = cp.fork(
      path.join(__dirname, 'remote.js'),
      {
        cwd: path.dirname(computationPath),
        silent: true,
      }
    );
    remoteProcess.on('message', (msg) => {
      if (msg.ready) { return res(remoteProcess); }
      return rej(new Error(msg)); // err if we don't receive ready
    });

    remoteProcess.on('error', (err) => {
      logger.error(`process errored ${err.message}`);
    });
    remoteProcess.on('exit', (code) => {
      if (code) {
        throw new Error(
          `${remoteProcessName} [${process.pid}]: exited with ${code}`
        );
      }
    });

    if (verbose) {
      remoteProcess.stdout.on(
        'data',
        getStdDataHandler(remoteProcess, remoteProcessName)
      );
    }

    remoteProcess.stderr.on(
      'data',
      getStdDataHandler(remoteProcess, remoteProcessName, 'error')
    );

    remoteProcess.send({
      boot: {
        activeComputationInputs,
        computationPath,
        data,
        usernames,
      },
    });
  });
}

module.exports = { run };
