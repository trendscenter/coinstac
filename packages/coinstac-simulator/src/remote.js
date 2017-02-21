'use strict';

/**
 * @private
 * @module remote
 */

require('./utils/handle-errors');

const { Consortium, DecentralizedComputation } = require('coinstac-common');
const CoinstacServer = require('coinstac-server-core/src/coinstac-server.js');
const config = require('./utils/config.js');
const { getChildProcessLogger } = require('./utils/logging');
const path = require('path');

const logger = getChildProcessLogger();

/**
 * Boot remote process.
 *
 * @todo Figure out how to use `params.data` in this scenario.
 *
 * @params {Object} params
 * @params {Array[]} params.activeComputationInputs Computation inputs to
 * set on the consortium's `activeComputationInputs` property
 * @params {string} params.computationPath
 * @params {Object} params.data
 * @params {string[]} params.usernames
 * @returns {Promise}
 */
function boot({
  activeComputationInputs,
  computationPath,
  data, // eslint-disable-line no-unused-vars
  usernames,
}) {
  const definition = require(computationPath); // eslint-disable-line global-require

  const server = new CoinstacServer({
    dbUrl: `http://localhost:${config['pouch-db-server'].port}`,
    inMemory: true,
  });

  const computation = new DecentralizedComputation(Object.assign({
    cwd: path.dirname(computationPath),
    meta: {
      description: definition.name,
      name: definition.name,
    },
    repository: {
      url: `http://github.com/${definition.name}`,
    },
  }, definition));

  // Override method to stub computation registry
  server.getComputationRegistry = function getComputationRegistryStub() {
    return Promise.resolve({
      add() {
        return computation;
      },
      all() {
        return [computation];
      },
    });
  };

  // Re-assign logger to get simulator-centric logging
  server.logger = logger;

  logger.verbose('Booting…');

  return server.start()
    .then((remotePipelineRunnerPool) => {
      remotePipelineRunnerPool.events.on(
        'computation:markedComplete',
        () => {
          logger.verbose('Shutting down server...');
          return server.stop().then(() => process.exit());
        }
      );

      return server.dbRegistry.get('computations').all();
    })
    .then((computationDocs) => {
      /**
       * Usually a client creates a consortia. The server does it here to make
       * simulation setup easier.
       */
      const consortium = new Consortium({
        _id: `testconsortiumid${Date.now()}`,
        activeComputationId: computationDocs[0]._id,
        activeComputationInputs,
        description: 'test-default-consortium',
        label: 'test-default-consortium',
        owners: usernames,
        users: usernames,
      });

      return server.dbRegistry
        .get('consortia')
        .save(consortium.serialize());
    });
}

// boot with data provided by src/boot-remote.js
process.on('message', (opts) => {
  if (opts.boot) {
    boot(opts.boot)
    .then(() => process.send({ ready: true }));
  } else {
    throw new Error([
      'message from parent process has no matching command',
      JSON.stringify(opts),
    ].join(' '));
  }
});
