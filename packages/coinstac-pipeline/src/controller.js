'use strict';

const Computation = require('./computation');
const Emitter = require('events');

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
  create({ controller, computations, inputMap }, runId, { operatingDirectory, mode }) {
    let cache = {};
    const currentComputations = computations.map(comp => Computation.create(comp, mode));
    const activeControlBox = controllers[controller.options.type];
    const computationStep = 0;
    const iterationEmitter = new Emitter();
    const controllerState = {
      activeComputations: [],
      baseDirectory: `/input/${runId}`,
      outputDirectory: `/output/${runId}`,
      cacheDirectory: `/cache/${runId}`,
      currentBoxCommand: undefined,
      currentComputations,
      currentOutput: undefined,
      initialized: false,
      iteration: undefined,
      mode,
      runType: 'sequential',
      state: undefined,
    };
    const setIteration = (iteration) => {
      controllerState.iteration = iteration;
      iterationEmitter.emit('update', iteration, cache, controllerState.currentOutput);
    };

    return {
      activeControlBox,
      cache,
      computationStep,
      controllerState,
      mode,
      runId,
      iterationEmitter,
      inputMap,
      operatingDirectory,
      setIteration,
      /**
       * Starts a controller, which in turn starts a computation, given the correct
       * conditions.
       * @param  {Object}   input         initial input for the computation
       * @param  {Function} remoteHandler a funciton to handle decentralized steps
       * @return {Promise}                resolves to the final computation output
       */
      start: (input, remoteHandler) => {
        const queue = [];
        controllerState.state = 'started';
        controllerState.remoteInitial = controllerState.mode === 'remote' ? true : undefined;
        if (!controllerState.initialized) {
          controllerState.runType = activeControlBox.runType || controllerState.runType;
          controllerState.initialized = true;
          controllerState.computationIndex = 0;
          controllerState.activeComputations[controllerState.computationIndex] =
            controllerState.currentComputations[controllerState.computationIndex];
          setIteration(0);
        }

        /**
         * Churns a comp iterartion based on current controller state and box output.
         * This can mean a normal iteration, a remote iteration, skipping, etc...
         * @param  {Object}   compInput input for the computation
         * @param  {Function} cb        callback called with results
         * @param  {Function} err       error callback for async operations
         */
        const iterateComp = (input, cb, err) => {
          // TODO: logic for different runTypes (single, parallel, etc)
          switch (controllerState.currentBoxCommand) {
            case 'nextIteration':
              setIteration(controllerState.iteration + 1);
              controllerState.state = 'waiting on computation';

              return controllerState.activeComputations[controllerState.computationIndex]
              .start(
                { input, cache, state: controllerState },
                { baseDirectory: operatingDirectory }
               )
              .then((output) => {
                cache = Object.assign(cache, output.cache);
                controllerState.currentOutput = { output: output.output, success: output.success };
                controllerState.state = 'finished iteration';
                cb(output.output);
              }).catch(error => err(error));
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
              controllerState.state = 'waiting on remote';
              return remoteHandler({ input: controllerState.currentOutput })
              .then((output) => {
                controllerState.state = 'finished remote iteration';
                controllerState.currentOutput = { output: output.output, success: output.success };
                cb(output.output);
              }).catch(error => err(error));
            case 'firstServerRemote':
              // TODO: not ideal, figure out better remote start
              // remove noop need
              controllerState.state = 'waiting on remote';
              return remoteHandler({ input: controllerState.currentOutput, noop: true })
              .then((output) => {
                controllerState.state = 'finished remote iteration';
                controllerState.currentOutput = { output: output.output, success: output.success };
                cb(output.output);
              }).catch(error => err(error));
            case 'doneRemote':
              controllerState.state = 'waiting on remote';
              // we want the success output, grabbing the last currentOutput is fine
              // Note that input arg === controllerState.currentOutput.output at this point
              return remoteHandler({ input: controllerState.currentOutput, transmitOnly: true })
              .then(() => {
                controllerState.state = 'finished final remote iteration';
                cb(input);
              }).catch(error => err(error));
            case 'done':
              cb(input);
              break;
            default:
              throw new Error('unknown controller runType');
          }
        };
        queue.push(iterateComp);

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
         * @param  {Array}    steps        the dynamic array for the waterfall
         * @param  {Function} done         callback
         * @return {Object}                computation's result
         */
        const waterfall = (initialInput, steps, done, err) => {
          controllerState.state = 'running';
          steps.push(done);
          trampoline(() => {
            return steps.length ?
            function _cb(...args) {
              const argsArray = [].slice.call(args);
              const fn = steps.shift();
              controllerState.currentBoxCommand = activeControlBox.preIteration(controllerState);

              if ((controllerState.mode === 'local' && controllerState.iteration === 0) ||
                (controllerState.mode === 'remote' && controllerState.remoteInitial)) {
                // add initial input to first iteration
                argsArray.unshift(input);
              }
              if (controllerState.currentBoxCommand !== 'done' && controllerState.currentBoxCommand !== 'doneRemote') {
                const lastCallback = steps.pop();
                steps.push(iterateComp);
                steps.push(lastCallback);
              }
              // necessary if this function call turns out synchronous
              // the stack won't clear and overflow, has limited perf impact
              process.nextTick(() => fn.apply(this, argsArray.concat([_cb, err])));
              controllerState.remoteInitial = controllerState.mode === 'remote' ? false : undefined;
            } :
            undefined;  // steps complete
          })(input);
        };

        const p = new Promise((res, rej) => {
          waterfall(input, queue, (result) => {
            controllerState.state = 'stopped';
            res(result);
          }, rej);
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
