'use strict';

/**
 * @module simulator
 */

const path = require('path');
const handleAsyncErrors = require('./handle-errors')(); // eslint-disable-line
const logger = require('./logger');
const bootComputeServers = require('./boot-compute-servers');
const bootClients = require('./boot-clients');
const dbServer = require('./db-server');
const seedCentralDB = require('./seed-central-db');

const processes = {};

module.exports = {
  /**
   * @description boots the infrastructure required to run a simulation. this
   * includes a db server, computer server, and client processes for each client
   * in the provided simulation declaration
   * @param {string} declPath simulation declaration. @see {@link http://mrn-code.github.io/coinstac-simulator/index.html#how|declaration description}
   * @param {function}
   * @returns {Promise}
   */
  setup(declPath) {
    // setup remote db service
    const cwd = process.cwd();
    process.chdir(path.resolve(__dirname, '..'));
    // ^because spawn-pouchdb-server makes naughty assumptions :/
    return dbServer.setup()
    .then((srv) => { processes.db = srv; })
    .then(() => logger.info('db server up'))
    .then(() => process.chdir(cwd))
    // seed central db with dummy conortium and computation data
    .then(() => seedCentralDB.seed(declPath))
    .then(() => logger.info('db seeded'))
    // boot our central compute server
    .then(() => bootComputeServers(declPath))
    .then((computeServers) => { processes.remote = computeServers[0]; })
    .then(() => logger.info('compute server up'))
    // boot user machines, and kickoff first computation
    .then(() => bootClients(declPath))
    .then((userProcesses) => { processes.local = userProcesses; })
    .then(() => logger.info('clients up'))
    .then(() => processes.local.forEach((proc) => proc.send({ kickoff: true })));
  },

  /**
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
          processes.local.map((proc) => { // eslint-disable-line
            return new Promise((res, rej) => {
              proc.on('message', (m) => {
                if (m.toredown) { return res(); }
                return rej(new Error('expected toredown message from child_process'));
              });
              proc.send({ teardown: true });
            });
          })
        )
        .then(() => dbServer.teardown())
        .then(() => resolve())
        .catch((err) => reject(err));
      });
    });
  },
};
