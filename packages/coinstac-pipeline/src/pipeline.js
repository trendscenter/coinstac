'use strict';

const Controller = require('./controller');

module.exports = {
  create({ steps }, runId, { mode, operatingDirectory }) {
    const cache = {};
    let currentStep;

    const pipelineSteps = steps.map(
      step => Controller.create(step, runId, { mode, operatingDirectory })
    );

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
    prepCache(steps);
    return {
      cache,
      currentStep,
      id: runId,
      mode,
      pipelineSteps,
      run(remoteHandler) {
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
          this.currentStep = index;
          // runInput = index > 0 ? runInput : inputMap[index];
          return prom.then(() => step.start(loadInput(step), remoteHandler))
          .then((output) => {
            loadCache(output, index);
            return output;
          });
        }, Promise.resolve());
      },
    };
  },
};
