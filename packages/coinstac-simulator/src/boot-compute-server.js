'use strict';

require('./utils/handle-errors');

const poolInitializer = require('./pool-initializer');
const common = require('coinstac-common');
const stubComputationToRegistry = require('./stub-computation-to-registry');
const RemotePipelineRunnerPool = common.models.pipeline.runner.pool.RemotePipelineRunnerPool;
const { getChildProcessLogger } = require('./utils/logging');

const logger = getChildProcessLogger();

/**
 * @private
 * @module boot-compute-server
 */

/**
 * @function bootCentralComputeServer
 * pooler will auto-listen to consortium change events
 *
 * @todo Figure out how to use `params.data` in this…scenario.
 *
 * @params {Object} params
 * @params {string} params.computationPath
 * @params {Object} [params.data]
 * @returns {Promise}
 */
const boot = function boot({ computationPath, data }) { // eslint-disable-line no-unused-vars
  const dComp = require(computationPath); // eslint-disable-line global-require
  const optsPatch = { dbRegistry: { isRemote: true } };
  let pool;
  return poolInitializer.getPoolOpts(optsPatch)
  .then((opts) => { pool = new RemotePipelineRunnerPool(opts); })
  .then(() => {
    pool.events.on('error', error => {
      logger.error(error);
      // TODO: Exit on pool error?
      // process.exit(1);
    });
    pool.events.on('computation:complete', (runId) => {
      logger.info('computation complete, run', runId);
      // .then(() => pool.destroy()) // pool destroying is nice, but who cares. it's in mem only.
      process.exit(0);
    });
  })
  .then(() => pool.init())
  .then(() => stubComputationToRegistry({
    computation: dComp,
    registry: pool.computationRegistry,
  }));
};

// boot with data provided by `boot-clients`
process.on('message', (opts) => {
  if (opts.boot) {
    boot(opts.boot)
    .then((result) => process.send({ ready: true, result }));
  } else {
    throw new Error([
      'message from parent process has no matching command',
      JSON.stringify(opts),
    ].join(' '));
  }
});
