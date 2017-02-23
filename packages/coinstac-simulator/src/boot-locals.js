'use strict';

require('./utils/handle-errors');

const cp = require('child_process');
const { getStdDataHandler } = require('./utils/logging');
const path = require('path');

/**
 * Get a ready local process.
 *
 * @param {Object} params
 * @param {string} params.computationPath
 * @param {Object} [params.data] Declaration data for computation kickoff
 * @param {boolean} params.initiate
 * @param {string} params.username
 * @param {boolean} [params.verbose=false]
 * @returns {Promise}
 */
function getReadyLocalProcess({
  computationPath,
  data,
  initiate,
  username,
  verbose,
}) {
  return new Promise((resolve, reject) => {
    const localProcess = cp.fork(path.join(__dirname, 'local.js'), {
      cwd: path.dirname(computationPath),
      execArgv: process.execArgv.filter(arg => !arg.includes('--debug')),
      silent: true,
    });

    function messageHandler(message) {
      if ('ready' in message && message.ready) {
        localProcess.removeListener('message', messageHandler);
        resolve(localProcess);
      } else {
        reject(new Error('Local process sent non-ready message first'));
      }
    }

    localProcess.on('exit', code => {
      if (code) {
        throw new Error(`Local process exited with code ${code}`);
      }
    });
    localProcess.on('message', messageHandler);
    localProcess.stderr.on(
      'data',
      getStdDataHandler(localProcess, `LOCAL ${username}`, 'error')
    );

    if (verbose) {
      localProcess.stdout.on(
        'data',
        getStdDataHandler(localProcess, `LOCAL ${username}`)
      );
    }

    localProcess.send({
      boot: {
        computationPath,
        data,
        initiate,
        username,
      },
    });
  });
}

/**
 * Run local processes booting.
 *
 * @param {string} declPath
 * @returns {Promise} Resolves with an array of forked local processes
 */
function run({ computationPath, users, verbose }) {
  return Promise.all(users.map(({ data, username }, index) => {
    return getReadyLocalProcess({
      computationPath,
      data,
      initiate: index === 0,
      username,
      verbose,
    });
  }));
}

/**
 * Boot local processes.
 * @module
 */
module.exports = { run };

