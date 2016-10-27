'use strict';

/**
 * @private
 * @module remote
 */

require('./utils/handle-errors');

const common = require('coinstac-common');
const getPoolConfig = require('./utils/get-pool-config');
const RemotePipelineRunnerPool = common.models.pipeline.runner.pool.RemotePipelineRunnerPool;
const { getChildProcessLogger } = require('./utils/logging');

const logger = getChildProcessLogger();

/**
 * Boot remote process.
 *
 * @todo Figure out how to use `params.data` in this scenario.
 *
 * @params {Object} params
 * @params {string} params.computationPath
 * @params {Object} [params.data]
 * @returns {Promise}
 */
function boot({ computationPath, data }) { // eslint-disable-line no-unused-vars
  let pool;

  logger.verbose('Booting…');

  return getPoolConfig({
    computationPath,
    isLocal: false,
  })
  .then((opts) => {
    pool = new RemotePipelineRunnerPool(opts);
    pool.events.on('computation:start', runId => {
      logger.verbose(`Run ${runId} starting`);
    });
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

    logger.verbose('Initializing RemotePipelineRunnerPool');
    return pool.init();
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
