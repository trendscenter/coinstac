'use strict';

const Controller = require('./controller');
const Emitter = require('events');

module.exports = {
  create({ steps }, runId, { mode, operatingDirectory, clientId }) {
    const cache = {};
    let currentStep;

    const stateEmitter = new Emitter();


    const pipelineSteps = steps.map(step =>
      Controller.create(step, runId, { mode, operatingDirectory, clientId }));

    const prepCache = (pipelineSpec) => {
      pipelineSpec.forEach((step) => {
        for (let [key, val] of Object.entries(step.inputMap)) { // eslint-disable-line no-restricted-syntax, no-unused-vars, max-len, prefer-const
          if (val.fromCache) {
            cache[val.fromCache.step] = Object.assign(
              {},
              cache[val.fromCache.step],
              { [val.fromCache.variable]: undefined }
            );
          }
        }
      });
    };


    // remote doesn't get any step input, happens all client side
    if (mode !== 'remote') {
      prepCache(steps);
    }
    return {
      cache,
      currentStep,
      id: runId,
      mode,
      stateEmitter,
      pipelineSteps,
      run(remoteHandler) {
        const packageState = () => {
          const ctrs = this.pipelineSteps[this.currentStep].controllerState;
          return {
            currentIteration: ctrs.iteration,
            controllerState: ctrs.state,
            pipelineStep: this.currentStep,
            mode: this.mode,
            totalSteps: this.pipelineSteps.length,
          };
        };

        const setStateProp = (prop, val) => {
          this[prop] = val;
          stateEmitter.emit('update', packageState());
        };

        pipelineSteps.forEach(
          (step) => {
            step.stateEmitter.on('update', () => stateEmitter.emit('update', packageState()));
          }
        );

        const loadCache = (output, step) => {
          if (cache[step]) {
            for (let [key] of Object.entries(cache[step])) { // eslint-disable-line no-restricted-syntax, max-len, prefer-const
              cache[step][key] = output[key];
            }
          }
        };
        const loadInput = (step) => {
          const output = {};
          for (let [key, val] of Object.entries(step.inputMap)) { // eslint-disable-line no-restricted-syntax, max-len, prefer-const
            if (val.fromCache) {
              output[key] = cache[val.fromCache.step][val.fromCache.variable];
            } else {
              output[key] = val.value;
            }
          }
          return output;
        };
        return pipelineSteps.reduce((prom, step, index) => {
          setStateProp('currentStep', index);
          return prom.then(() => step.start(this.mode === 'remote' ? {} : loadInput(step), remoteHandler))
          .then((output) => {
            loadCache(output, index);
            return output;
          });
        }, Promise.resolve());
      },
    };
  },
};
