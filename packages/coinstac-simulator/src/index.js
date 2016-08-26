'use strict';

/**
 * @module simulator
 */
require('./handle-errors');

const path = require('path');
const logger = require('./logger');
const bootComputeServers = require('./boot-compute-servers');
const bootClients = require('./boot-clients');
const dbServer = require('./db-server');
const flatten = require('lodash/flatten');
const noop = require('lodash/noop');
const values = require('lodash/values');
const fileLoader = require('./file-loader');

/**
 * Processes.
 *
 * Storage for child processes.
 *
 * @const {Object}
 * @property {(ChildProcess|null)} db
 * @property {(ChildProcess[]|null)} localhost
 * @property {(ChildProcess|null)} remote
 */
const processes = {
  local: null,
  remote: null,
};

const exportList = {
  /**
   * @description boots the infrastructure required to run a simulation. this
   * includes a db server, computer server, and client processes for each client
   * in the provided simulation declaration
   * @param {string} declPath simulation declaration. @see {@link http://mrn-code.github.io/coinstac-simulator/index.html#how|declaration description}
   * @param {function}
   * @returns {Promise}
   */
  run(declPath) {
    // setup remote db service
    const cwd = process.cwd();
    process.chdir(path.resolve(__dirname, '..'));
    // ^because spawn-pouchdb-server makes naughty assumptions :/
    return dbServer.setup(declPath)
    .then(() => process.chdir(cwd))

    // boot our central compute server
    .then(() => bootComputeServers(declPath))
    .then(computeServers => {
      processes.remote = computeServers[0];
      logger.info('compute server up');
    })

    // boot user machines, and kickoff first computation
    .then(() => bootClients(declPath))
    .then(userProcesses => {
      processes.local = userProcesses;
      logger.info('clients up');
      processes.local.forEach(proc => proc.send({ kickoff: true }));
      return this.teardown();
    });
  },

  /**
   * @private
   * @description tears down all processes. because `setup` both sets up and automatically
   * runs the simulation, teardown should be called immediately after setup
   * calls back.  this is generally unintuitive behavior.  please take note.
   * accepting PRs to break the run trigger out of the setup routing.
   * @returns {Promise}
   */
  teardown() {
    // teardown when computation cycle flagged as complete by
    // remote computation server (whom will exit on `complete`)
    return new Promise((resolve, reject) => {
      processes.remote.on('exit', () => {
        // kill all child processes cleanly after remote server has exited
        Promise.all(
          processes.local.map((proc, ndx) => { // eslint-disable-line
            return new Promise((res, rej) => {
              proc.on('message', (m) => {
                if (m.toredown) { return res(); }
                return rej(new Error('expected toredown message from child_process'));
              });
              proc.send({ teardown: true });
            });
          })
        )
        .then(dbServer.teardown)
        .then(() => resolve())
        .catch((err) => reject(err));
      });
    });
  },
};

// Ensure all processes are killed
process.on('exit', () => {
  dbServer.teardown().catch(noop);
  flatten(values(processes)).forEach(p => p && p.kill());
});

module.exports = Object.assign(exportList, fileLoader);
