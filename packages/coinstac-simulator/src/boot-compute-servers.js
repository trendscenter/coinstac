'use strict';

/**
 * @private
 * @module boot-compute-servers
 */

require('./handle-errors')();
const cp = require('child_process');
const chalk = require('chalk');
const path = require('path');
const logger = require('./logger');
const userChatOK = chalk.blue;

module.exports = function bootComputeServers(declPath) {
  return new Promise((res, rej) => {
    const decl = require(declPath);
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
    srv.on('error', (err) => logger.error(`process errored ${err.message}`));
    srv.on('exit', (code) => {
      if (code) {
        throw new Error(`${serverName} [${process.pid}]: exited with ${code}`);
      }
    });
    srv.stdout.on('data', (data) => {
      if (!decl.verbose) { return; }
      const content = data.slice(0, -1);
      logger.info(userChatOK(`${serverName} [${srv.pid}]: ${content}`));
    });
    srv.stderr.on('data', (data) => {
      const content = data.slice(0, -1);
      logger.error(`${serverName} [${srv.pid}]: ${content}`);
    });
  });
};
