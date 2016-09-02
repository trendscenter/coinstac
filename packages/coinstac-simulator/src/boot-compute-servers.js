'use strict';

/**
 * @private
 * @module boot-compute-servers
 */

require('./utils/handle-errors');

const cp = require('child_process');
const path = require('path');
const { logger, getProcessLogger } = require('./utils/logging');

module.exports = function bootComputeServers(declPath) {
  return new Promise((res, rej) => {
    const decl = require(declPath); // eslint-disable-line global-require
    const serverName = 'COMPUTE-SERVER'; // just one server ATM...
    const srv = cp.fork(
      path.resolve(__dirname, './boot-compute-server'),
      { cwd: process.cwd(), silent: true }
    );
    srv.on('message', (msg) => {
      if (msg.ready) { return res([srv]); }
      return rej(new Error(msg)); // err if we don't receive ready
    });
    srv.send({ boot: { declPath } });

    server.on('error', (err) => logger.error(`process errored ${err.message}`));
    server.on('exit', (code) => {
      if (code) {
        throw new Error(`${serverName} [${process.pid}]: exited with ${code}`);
      }
    });

    if (verbose) {
      server.stdout.on('data', getProcessLogger(server, serverName));
    }

    server.stderr.on('data', getProcessLogger(server, serverName, 'error'));
    });
  });
};
