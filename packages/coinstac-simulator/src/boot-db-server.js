'use strict';

const chalk = require('chalk');
const cp = require('child_process');
const logger = require('./logger');
const path = require('path');
const dbsOK = chalk.gray;

let srv;

const filtered = (str) => str.match(/deprecated|Warning: a promise/);

module.exports = {
  setup(declPath) {
    return new Promise((res, rej) => {
      const decl = require(declPath);
      const serverName = 'DB-SERVER';
      srv = cp.fork(
        path.resolve(__dirname, './db-server'),
        { cwd: process.cwd(), silent: true }
      );
      srv.on('message', (msg) => {
        if (msg.ready) { return res([srv]); }
        return rej(new Error(msg)); // err if we don't receive ready
      });
      srv.send({ boot: true });
      srv.on('error', (err) => logger.error(`process errored ${err.message}`));
      srv.on('exit', (code) => {
        if (code) {
          throw new Error(`${serverName}: exited with ${code}`);
        }
      });
      srv.stdout.on('data', (data) => {
        if (!decl.verbose) { return; }
        const content = data.slice(0, -1).toString();
        if (filtered(content)) { return; }
        logger.info(dbsOK(`${serverName} [${srv.pid}]: ${content}`));
      });
      srv.stderr.on('data', (data) => {
        const content = data.slice(0, -1).toString();
        if (filtered(content)) { return; }
        logger.error(`${serverName} [${srv.pid}]: ${content}`);
      });
    });
  },

  teardown() {
    return new Promise((res, rej) => {
      srv.on('message', (msg) => {
        if (msg.toredown) {
          return res();
        }
        return rej(
          new Error(`received unexpected message: ${JSON.stringify(msg)}`)
        );
      });
      srv.send({ teardown: true });
    });
  },
};
