'use strict';

/**
 * @module simulator
 */
require('./utils/handle-errors');

const { fill, flatten, noop, uniqueId, values } = require('lodash');
const bluebird = require('bluebird');
const fs = require('fs');
const path = require('path');

const bootClients = require('./boot-clients');
const bootComputeServers = require('./boot-compute-servers');
const dbServer = require('./db-server');
const fileLoader = require('./file-loader');
const { logger } = require('./utils/logging');

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
   * Get a declaration object.
   * @private
   *
   * @param {string} declarationPath
   * @returns {Promise} Resolves to a declaration object
   */
  getDeclaration(declarationPath) {
    if (typeof declarationPath !== 'string') {
      return Promise.reject(new Error('Requires a declaration path string'));
    }

    return bluebird.promisify(fs.stat)(declarationPath)
      .then(stats => {
        if (!stats.isFile() && !stats.isDirectory()) {
          throw new Error(`Couldn't find declaration ${declarationPath}`);
        }

        /* eslint-disable global-require */
        const declaration = require(declarationPath);
        /* eslint-ensable global-require */

        // Validate declaration's shape
        if (!(declaration instanceof Object)) {
          throw new Error(`Expected declaration ${declarationPath} to be an object`);
        } else if (
          !('computationPath' in declaration) ||
          typeof declaration.computationPath !== 'string'
        ) {
          throw new Error(
            `Expected declaration ${declarationPath} to have a 'computationPath' property`
          );
        } else if (
          !('local' in declaration) || !Array.isArray(declaration.local)
        ) {
          throw new Error(
            `Expected declaration ${declarationPath} to have a 'local' array`
          );
        } else if (
          'remote' in declaration && !(declaration.remote instanceof Object)
        ) {
          throw new Error(
            `Expected declaration ${declarationPath} 'remote' value to be an object.`
          );
        }

        // Resolve local and remote promises
        const local = Promise.all(declaration.local.map(bluebird.props));
        const remote = declaration.remote ?
          bluebird.props(declaration.remote) :
          undefined;


        return Promise.all([
          declaration.computationPath,
          local,
          remote,
          declaration.verbose,
        ]);
      })
      .then(([computationPath, local, remote, verbose]) => {
        return { computationPath, local, remote, verbose };
      });
  },

  /**
   * Get mock usernames for simulation run.
   * @private
   *
   * @param {number} count
   * @returns {string[]}
   */
  getUsernames(count) {
    return fill(Array(count), 'testUser').map(uniqueId);
  },

  /**
   * @description boots the infrastructure required to run a simulation. this
   * includes a db server, computer server, and client processes for each client
   * in the provided simulation declaration
   * @param {string} declPath simulation declaration. @see {@link http://mrn-code.github.io/coinstac-simulator/index.html#how|declaration description}
   * @param {function}
   * @returns {Promise}
   */
  run(declPath) {
    return this.getDeclaration(declPath)
      .then(declaration => {
        const cwd = process.cwd();
        const usernames = this.getUsernames(declaration.local.length);

        process.chdir(path.resolve(__dirname, '..'));
        // ^because spawn-pouchdb-server makes naughty assumptions :/

        return Promise.all([
          cwd,
          declaration,
          usernames,
          dbServer.setup({
            computationPath: declaration.computationPath,
            usernames,
          }),
        ]);
      })
      .then(([cwd, declaration, usernames]) => {
        process.chdir(cwd);

        return Promise.all([
          declaration,
          usernames,
          bootComputeServers.run({
            computationPath: declaration.computationPath,
            data: declaration.remote,
            verbose: declaration.verbose,
          }),
        ]);
      })
      .then(([declaration, usernames, computeServers]) => {
        processes.remote = computeServers[0];
        logger.info('compute server up');

        return bootClients.run({
          computationPath: declaration.computationPath,
          users: declaration.local.map((data, i) => {
            return {
              data,
              username: usernames[i],
            };
          }),
          verbose: declaration.verbose,
        });
      })
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
