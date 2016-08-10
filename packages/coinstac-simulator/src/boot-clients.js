'use strict';

/**
 * @private
 * @module boot-clients
 */

require('./handle-errors')();
const cp = require('child_process');
const chalk = require('chalk');
const path = require('path');
const logger = require('./logger');
const userChatOK = chalk.magenta;

module.exports = function bootClients(declPath) {
  const decl = require(declPath); // eslint-disable-line global-require
  const usernames = typeof decl.users[0] === 'string' ?
    decl.users :
    decl.users.map(user => user.username);
  return Promise.all(
    usernames.map((username) => { // eslint-disable-line
      return new Promise((res, rej) => {
        const userProcess = cp.fork(
          path.resolve(__dirname, './boot-client'),
          { cwd: process.cwd(), silent: true }
        );
        userProcess.on('message', (m) => {
          if (m.ready) { return res(userProcess); }
          if (m.toredown) { return; } // handled by `run.js`
          rej(m); // err if we don't receive ready
        });
        userProcess.send({ boot: { declPath, username } });
        userProcess.on('exit', (code) => {
          if (code) { throw new Error(`user process exited with ${code}`); }
        });
        userProcess.stdout.on('data', (data) => {
          if (!decl.verbose) { return; }
          const content = data.slice(0, -1);
          logger.info(userChatOK(`USER ${username} [${userProcess.pid}]: ${content}`));
        });
        userProcess.stderr.on('data', (data) => {
          const content = data.slice(0, -1);
          logger.error(`USER ${username} [${userProcess.pid}]: ${content}`);
        });
      });
    })
  );
};
