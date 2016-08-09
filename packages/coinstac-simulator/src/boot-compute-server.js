'use strict';

require('./handle-errors')();
const poolInitializer = require('./pool-initializer');
const common = require('coinstac-common');
const stubComputationToRegistry = require('./stub-computation-to-registry');
const RemotePipelineRunnerPool = common.models.pipeline.runner.pool.RemotePipelineRunnerPool;
const logger = require('./logger');
const lifecycle = require('./lifecycle-runner');

/**
 * @private
 * @module boot-compute-server
 */

/**
 * @function bootCentralComputeServer
 * pooler will auto-listen to consortium change events
 * @note central compute server will run in _this_ process
 * @returns {Promise}
 */
const boot = function boot(opts) {
  const decl = require(opts.declPath); // eslint-disable-line global-require
  const dComp = require(decl.computationPath); // eslint-disable-line global-require
  const optsPatch = { dbRegistry: { isRemote: true } };
  let pool;
  return poolInitializer.getPoolOpts(optsPatch)
  .then((opts) => { pool = new RemotePipelineRunnerPool(opts); })
  .then(() => {
    pool.events.on('error', (err) => logger.error(err.message));
    pool.events.on('computation:complete', (runId) => {
      logger.info('computation complete, run', runId);
      return lifecycle('postRun', 'server', decl)
      // .then(() => pool.destroy()) // pool destroying is nice, but who cares. it's in mem only.
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err.message); // eslint-disable-line
        process.exit(1);
      });
    });
  })
  .then(() => lifecycle('preRun', 'server', decl))
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

// @NOTE the following is useful for debugging when running just a single process
// vs letting the runner fire this as a child process
// boot({
//     decl: {
//       usernames: [
//             'chris',
//             'runtang',
//             'vince',
//             'margaret'
//         ],
//         computationPath: require('path').resolve(__dirname, '../src/distributed/group-add'),
//         verbose: true
//     },
// }, (err, r) => {
//     if (err) throw err
//     console.log('ok');
// });
