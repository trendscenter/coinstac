'use strict';

const Controller = require('./controller');

module.exports = {
  create({ steps, inputMap, mode }, runId) {
    let currentStep;
    steps = steps.map(step => Controller.create(step, runId, mode));
    return {
      id: runId,
      inputMap,
      mode,
      currentStep,
      steps,
      run(remoteHandler) {
        let runInput;
        return steps.reduce((prom, step, index) => {
          this.currentStep = index;
          runInput = index > 0 ? runInput : inputMap[index];
          return prom.then(() => step.start(runInput, remoteHandler))
          .then((output) => {
            runInput = output;
            return output;
          });
        }, Promise.resolve());
      },
    };
  },
};
