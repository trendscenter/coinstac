'use strict';

const Computation = require('./computation');
const Emitter = require('events');

const controllers = {};
controllers.single = require('./control-boxes/single');

module.exports = {
  create({ controller, computations }, runId) {
    let cache = {};
    const currentComputations = computations.map(comp => Computation.create(comp));
    const activeControlBox = controllers[controller];
    const computationStep = 0;
    const iterationEmitter = new Emitter();
    const controllerState = {
      initialized: false,
      runMode: 'sequential',
      activeComputations: [],
      computationIndex: undefined,
      iteration: undefined,
      currentOutput: undefined,
      currentBoxCommand: undefined,
      currentComputations,
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
      runId,
      iterationEmitter,
      setIteration,
      start: (input) => {
        const queue = [];

        if (!controllerState.initialized) {
          controllerState.runMode = activeControlBox.runMode || controllerState.runMode;
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
        const iterateComp = (compInput, cb) => {
          // TODO: logic for different runModes (single, parallel, etc)
          switch (controllerState.currentBoxCommand) {
            case 'nextIteration':
              setIteration(controllerState.iteration + 1);

              return controllerState.activeComputations[controllerState.computationIndex]
              .start(Object.assign({}, compInput, { cache, state: controllerState }))
              .then((output) => {
                cache = Object.assign(cache, output.cache);
                controllerState.currentOutput = { output: output.output, success: output.success };
                cb({ input: output.output });
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
              break;
            case 'done':
              cb(compInput);
              break;
            default:
              throw new Error('unknown controller runMode');
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
         * @param  {[type]}   input [description]
         * @param  {[type]}   steps [description]
         * @param  {Function} done  [description]
         * @return {[type]}         [description]
         */
        const waterfall = (input, steps, done) => {
          steps.push(done);
          trampoline(() => {
            return steps.length ?
            function _cb(...args) {
              const argsArray = [].slice.call(args);
              const fn = steps.shift();
              controllerState.currentBoxCommand = activeControlBox.preIteration(controllerState);

              if (controllerState.iteration === 0) {
                // add initial input to first iteration
                argsArray.unshift(input);
              }

              if (controllerState.currentBoxCommand !== 'done') {
                const lastCallback = steps.pop();
                steps.push(iterateComp);
                steps.push(lastCallback);
              }
              process.nextTick(() => fn.apply(this, argsArray.concat(_cb)));
            } :
            undefined;  // steps complete
          })(input);
        };

        const p = new Promise((res) => {
          waterfall(input, queue, (result) => {
            res(result.input);
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
