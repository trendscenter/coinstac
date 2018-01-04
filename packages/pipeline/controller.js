'use strict';

const Computation = require('./computation');
const Emitter = require('events');

const controllers = {};
controllers.single = require('./control-boxes/single');
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
    const activeControlBox = controllers[controller];
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
         * [iterateComp description]
         * @param  {[type]}   compInput [description]
         * @param  {Function} cb        [description]
         * @return {[type]}             [description]
         */
        const iterateComp = (input, cb) => {
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
              controllerState.state = 'waiting on remote';
              return remoteHandler(controllerState.currentOutput)
              .then((output) => {
                controllerState.state = 'finished remote iteration';
                cb(output.output);
              });
            case 'firstServerRemote':
              // TODO: not ideal, figure out better remote start
              // remove noop need
              controllerState.state = 'waiting on remote';
              return remoteHandler(controllerState.currentOutput, true)
              .then((output) => {
                controllerState.state = 'finished remote iteration';
                cb(output.output);
              });
            case 'done':
              cb(input);
              break;
            default:
              throw new Error('unknown controller runType');
          }
        };
        queue.push(iterateComp);

        /**
         * [trampoline description]
         * @param  {Function} fn [description]
         * @return {[type]}      [description]
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
         * [waterfall description]
         * @param  {[type]}   initialInput [description]
         * @param  {[type]}   steps        [description]
         * @param  {Function} done         [description]
         * @return {[type]}                [description]
         */
        const waterfall = (initialInput, steps, done) => {
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

              if (controllerState.currentBoxCommand !== 'done') {
                const lastCallback = steps.pop();
                steps.push(iterateComp);
                steps.push(lastCallback);
              }
              // necessary if this function call turns out synchronous
              // the stack won't clear and overflow, has limited perf impact
              process.nextTick(() => fn.apply(this, argsArray.concat(_cb)));
              controllerState.remoteInitial = controllerState.mode === 'remote' ? false : undefined;
            } :
            undefined;  // steps complete
          })(input);
        };

        const p = new Promise((res) => {
          waterfall(input, queue, (result) => {
            controllerState.state = 'stopped';
            res(result);
          });
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
