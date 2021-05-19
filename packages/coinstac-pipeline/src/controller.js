'use strict';

const debug = require('debug');
const Emitter = require('events');
const Computation = require('./computation');
const Store = require('./io-store');

const debugProfilePipeline = debug('pipeline:profile-pipeline');

const controllers = {};
controllers.local = require('./control-boxes/local');
controllers.decentralized = require('./control-boxes/decentralized');

module.exports = {
  /**
   * Factory for controller instances
   * @param  {Object} step   pipeline step object
   * @param  {string} runId  unique id for the run
   * @param  {string} opts   options consisting of:
   *                            mode - local or remote
   *                            operatingDirectory - base directory for file operations
   * @return {Object}        a controller instance
   */
  create({
    controller,
    computations,
    inputMap,
  },
  runId,
  {
    clientId,
    imageDirectory,
    logger,
    operatingDirectory,
    owner,
    mode,
  }) {
    const store = Store.init(clientId);
    let computationCache = {};
    let pipelineErrorCallback;
    const currentComputations = computations.map(
      comp => Computation.create({
        clientId,
        spec: comp,
        imageDirectory,
        mode,
        runId,
      })
    );
    const activeControlBox = controllers[controller.type];
    const computationStep = 0;
    const stateEmitter = new Emitter();
    let dockerBaseDir = '';
    if (process.env.CI) {
      // for shared volume in CI context
      dockerBaseDir = operatingDirectory;
    }
    const controllerState = {
      activeComputations: [],
      // docker analogs to the user directories
      // no path resolving as containers and host
      // may not be the same os
      baseDirectory: `${dockerBaseDir}/input/${clientId}/${runId}`,
      outputDirectory: `${dockerBaseDir}/output/${clientId}/${runId}`,
      cacheDirectory: `${dockerBaseDir}/cache/${clientId}/${runId}`,
      transferDirectory: `${dockerBaseDir}/transfer/${clientId}/${runId}`,
      clientId,
      currentBoxCommand: undefined,
      currentComputations,
      initialized: false,
      iteration: undefined,
      mode,
      owner,
      received: Date.now(),
      runType: 'sequential',
      state: undefined,
      stopByUser: undefined,
      success: false,
    };
    const setStateProp = (prop, val) => {
      controllerState[prop] = val;
      stateEmitter.emit('update', controllerState);
    };
    const stopByUserErrorMessage = 'The pipeline run has been stopped by a user';
    let totalCompTime = 0;
    let totalCodeTime = 0;
    debugProfilePipeline.log = l => logger.info(`PROFILING: ${l}`);

    return {
      activeControlBox,
      computationCache,
      computationStep,
      controller,
      controllerState,
      mode,
      runId,
      stateEmitter,
      inputMap,
      operatingDirectory,
      setStateProp,
      pipelineErrorCallback,
      stop: (msg) => {
        setStateProp('stopByUser', 'stop');
        pipelineErrorCallback(new Error(msg || stopByUserErrorMessage));
      },
      /**
       * Starts a controller, which in turn starts a computation, given the correct
       * conditions.
       * @param  {Object}   input         initial input for the computation
       * @param  {Function} remoteHandler a funciton to handle decentralized steps
       * @return {Promise}                resolves to the final computation output
       */
      start: (input, remoteHandler) => {
        setStateProp('state', 'started');
        controllerState.remoteInitial = controllerState.mode === 'remote' ? true : undefined;
        if (!controllerState.initialized) {
          controllerState.runType = activeControlBox.runType || controllerState.runType;
          controllerState.initialized = true;
          controllerState.computationIndex = 0;
          /* eslint-disable max-len */
          controllerState.activeComputations[controllerState.computationIndex] = controllerState.currentComputations[controllerState.computationIndex];
          /* eslint-enable max-len */
          setStateProp('iteration', 0);
        }

        /**
         * Churns a comp iterartion based on current controller state and box output.
         * This can mean a normal iteration, a remote iteration, skipping, etc...
         * @param  {Object}   compInput input for the computation
         * @param  {Function} cb        callback called with results
         * @param  {Function} err       error callback for async operations
         */
        const iterateComp = (overideInput, cb, err) => {
          // TODO: logic for different runTypes (single, parallel, etc)
          let compInput;
          switch (controllerState.currentBoxCommand) {
            case 'nextIteration':
              if (mode === 'remote' && !compInput) {
                compInput = store.getAndRemoveGroup(runId);
              } else {
                compInput = store.getAndRemove(runId, clientId);
              }
              // if there is no store input use the arg input (first iteration)
              compInput = compInput || overideInput;
              setStateProp('iteration', controllerState.iteration + 1);
              setStateProp('state', 'waiting on computation');
              const compStart = Date.now(); // eslint-disable-line no-case-declarations
              const codeTime = compStart - controllerState.received; // eslint-disable-line no-case-declarations,max-len
              totalCodeTime += codeTime;
              debugProfilePipeline(`Recieved to manager start time on ${clientId} took: ${codeTime}ms`);
              return controllerState.activeComputations[controllerState.computationIndex]
                .start(
                  {
                    input: compInput,
                    cache: computationCache,
                    // picks only relevant attribs for comp
                    state: (({
                      baseDirectory,
                      outputDirectory,
                      cacheDirectory,
                      transferDirectory,
                      clientId,
                      iteration,
                      owner,
                    }) => ({
                      baseDirectory,
                      outputDirectory,
                      cacheDirectory,
                      transferDirectory,
                      clientId,
                      iteration,
                      owner,
                    }))(controllerState),
                  },
                  { operatingDirectory }
                )
                .then(({ cache, success, output }) => {
                  const compTime = Date.now() - compStart;
                  totalCompTime += compTime;
                  debugProfilePipeline(`Computation time with overhead on ${clientId} took: ${compTime}ms`);
                  computationCache = Object.assign(computationCache, cache);
                  controllerState.success = !!success;
                  setStateProp('state', 'finished iteration');
                  store.put(runId, clientId, output);
                  cb();
                }).catch(({
                  statusCode, message, name, stack,
                }) => {
                  const iterationError = Object.assign(
                    new Error(),
                    {
                      statusCode,
                      message,
                      error: message,
                      name,
                      stack,
                    }
                  );
                  logger.error(`Pipeline Error: ${iterationError}`);
                  if (controller.type === 'local') {
                    err(iterationError);
                  } else {
                    setStateProp('state', 'finished iteration with error');
                    store.put(runId, clientId, iterationError);
                    cb();
                  }
                });
            case 'nextComputation':
              // TODO: code for multiple comps on one controller
              // controllerState.computationIndex =
              //   controllerState.computationIndex < currentComputations.length ?
              //   controllerState.computationIndex + 1 : controllerState.computationIndex;
              // run =
              //   controllerState.activeComputations[controllerState.computationIndex]
              //   .start(input);
              break;
            case 'remote':
              setStateProp('state', controllerState.mode === 'remote' ? 'waiting on local users' : 'waiting on central node');
              return remoteHandler({
                success: controllerState.success,
                iteration: controllerState.iteration,
                callback: (error, output) => {
                  if (error) return err(error);
                  setStateProp('state', 'finished remote iteration');
                  controllerState.success = !!output.success;
                  controllerState.received = output.debug.received;

                  cb();
                },
              });
            case 'firstServerRemote':
              // TODO: not ideal, figure out better remote start
              // remove noop need
              setStateProp('state', 'waiting on local users');
              return remoteHandler({
                success: controllerState.success,
                noop: true,
                callback: (error, output) => {
                  if (error) return err(error);
                  setStateProp('state', 'finished remote iteration');
                  controllerState.success = !!output.success;
                  controllerState.received = output.debug.received;
                  cb();
                },
              });
            case 'doneRemote':
              setStateProp('state', 'waiting on local users');
              // grab now as it gets removed on send to clients
              const finalOutput = store.get(runId, clientId); // eslint-disable-line no-case-declarations, max-len
              return remoteHandler({
                success: controllerState.success,
                transmitOnly: true,
                iteration: controllerState.iteration,
                callback: (error) => {
                  if (error) return err(error);
                  // final output for remote
                  setStateProp('state', 'finished final remote iteration');
                  cb(finalOutput);
                },
              });
            case 'done':
              // grab final output from store
              compInput = store.getAndRemove(runId, clientId);
              cb(compInput);
              break;
            default:
              throw new Error('unknown controller runType');
          }
        };

        /**
         * The trampoline works by continuously bouncing calls on and off the stack
         * until a result that is not a funciton is returned, ending the fun. This avoids
         * dedicating stack space for successive calls.
         * Credit to Dave's blog: http://www.datchley.name/asynchronous-in-the-browser/
         * @param  {Function} fn function to trampoline
         * @return {Object}      the final result of the funciton calls
         */
        const trampoline = (fn) => {
          return (...args) => {
            let res = fn.apply(this, args);
            while (res && res instanceof Function) {
              res = res();
            }
            return res;
          };
        };

        /**
         * The waterfall allows for running async code in a sequential manner, combined
         * with the trampoline this allows an unlimited number of steps without stack issues.
         * Credit to Dave's blog: http://www.datchley.name/asynchronous-in-the-browser/
         * @param  {Object}   initialInput the object to pass to computation
         * @param  {Function} done         callback
         * @return {Object}                computation's result
         */
        const waterfall = (initialInput, done, err) => {
          const queue = [];

          setStateProp('state', 'running');
          queue.push(iterateComp);
          queue.push(done);

          trampoline(() => {
            return queue.length
              ? function _cb(...args) {
                if (controllerState.stopByUser === 'stop') {
                  err(new Error(stopByUserErrorMessage));
                }
                const fn = queue.shift();
                controllerState.currentBoxCommand = activeControlBox.preIteration(controllerState);
                if ((controllerState.mode === 'local' && controllerState.iteration === 0)
                || (controllerState.mode === 'remote' && controllerState.remoteInitial)) {
                // add initial input to first iteration
                  args.unshift(initialInput);
                } else if (args.length === 0) {
                  // no passed back input
                  // this happens on the last iteration
                  args.push(undefined);
                }

                if (controllerState.currentBoxCommand !== 'done' && controllerState.currentBoxCommand !== 'doneRemote') {
                  const lastCallback = queue.pop();
                  queue.push(iterateComp);
                  // done cb
                  queue.push(lastCallback);
                }

                // necessary if this function call turns out synchronous
                // the stack won't clear and overflow, has limited perf impact
                setImmediate(() => fn.apply(this, args.concat([_cb, err])));
                controllerState.remoteInitial = controllerState.mode === 'remote' ? false : undefined;
              }
              : undefined; // steps complete
          })();
        };

        const p = new Promise((res, rej) => {
          pipelineErrorCallback = (err) => {
            setStateProp('state', 'error');
            controllerState.activeComputations[controllerState.computationIndex].stop()
              .then(() => rej(err))
              .catch(error => rej(error));
          };
          waterfall(input, (result) => {
            setStateProp('state', 'stopped');
            controllerState.activeComputations[controllerState.computationIndex].stop()
              .then(() => {
                debugProfilePipeline(`**************************** ${clientId} totals ***************************`);
                debugProfilePipeline(`Total Computation time with overhead on ${clientId} took: ${totalCompTime}ms`);
                debugProfilePipeline(`Total JS Code time on ${clientId} took: ${totalCodeTime}ms`);
                res(result);
              })
              .catch(error => rej(error));
          }, pipelineErrorCallback);
        });

        return p;
      },
      halt() {},
      pause() {},
      resume() {},
      // TODO: save() {}?,
    };
  },
};
