'use strict';

/**
 * @private
 * @module remote
 */

require('./utils/handle-errors');

const Consortium = require('coinstac-common').models.Consortium;
const config = require('./utils/config.js');
const getComputationRegistryStub =
  require('./utils/get-computation-registry-stub.js');
const { getChildProcessLogger } = require('./utils/logging');

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
  const server = new CoinstacServer({
    dbUrl: `http://localhost:${config['pouch-db-server'].port}`,
    inMemory: true,
  });

  // Override method to stub computation registry
  server.getComputationRegistry = function getStub() {
    return Promise.resolve(getComputationRegistryStub(computationPath));
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

          /**
           * @todo PouchDB's internal request queue doesn't send document saves
           * if `server.stop` isn't delayed on the Node.js event queue.
           * Determine a better way to ensure `PouchDB#save` fired.
           */
          setTimeout(
            () => {
              server.stop().then(() => process.exit());
            },
            1000
          );
        }
      );
      remotePipelineRunnerPool.events.on('error', logger.error);

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
