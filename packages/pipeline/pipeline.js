'use strict';

const Controller = require('./controller');

module.exports = {
  create({ steps, inputMap }, runId, { mode, operatingDirectory }) {
    let currentStep;
    steps = steps.map(step => Controller.create(step, runId, { mode, operatingDirectory }));
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
