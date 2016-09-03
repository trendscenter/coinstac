'use strict';

require('./utils/handle-errors');

const cp = require('child_process');
const { getStdDataHandler } = require('./utils/logging');
const path = require('path');

/**
 * Get ready client.
 *
 * @param {Object} params
 * @param {string} params.computationPath
 * @param {Object} [params.data] Declaration data for computation kickoff
 * @param {boolean} params.initiate
 * @param {string} params.username
 * @param {boolean} [params.verbose=false]
 * @returns {Promise}
 */
function getReadyClient({
  computationPath,
  data,
  initiate,
  username,
  verbose,
}) {
  return new Promise((resolve, reject) => {
    const client = cp.fork(path.join(__dirname, 'boot-client.js'), {
      cwd: process.cwd(),
      silent: true,
    });

    function messageHandler(message) {
      if ('ready' in message && message.ready) {
        client.removeListener('message', messageHandler);
        resolve(client);
      } else {
        reject(new Error('Client sent non-ready message first'));
      }
    }

    client.on('exit', code => {
      if (code) {
        throw new Error(`Client process exited with code ${code}`);
      }
    });
    client.on('message', messageHandler);
    client.stderr.on(
      'data',
      getStdDataHandler(client, `USER ${username}`, 'error')
    );

    if (verbose) {
      client.stdout.on('data', getStdDataHandler(client, `USER ${username}`));
    }

    client.send({
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
 * Run clients booting.
 *
 * @param {string} declPath
 * @returns {Promise} Resolves with an array of forked client processes
 */
function run({ computationPath, users, verbose }) {
  return Promise.all(users.map(({ data, username }, index) => {
    return getReadyClient({
      computationPath,
      data,
      initiate: index === 0,
      username,
      verbose
    });
  }));
}

/**
 * Boot clients.
 * @module
 */
module.exports = { run };

