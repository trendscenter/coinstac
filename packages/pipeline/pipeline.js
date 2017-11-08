'use strict';

const Controller = require('./controller');

module.exports = {
  create({ steps, inputMap }, runId) {
    let stepIndex;
    steps = steps.map(step => Controller.create(step, runId));
    return {
      stepIndex,
      steps,
      inputMap,
      run() {
        let runInput;
        // TODO: remote n stuff
        return steps.reduce((prom, step, index) => {
          stepIndex = index;
          runInput = index > 0 ? runInput : inputMap[index];
          return prom.then(() => step.start(runInput))
          .then((output) => {
            runInput = output;
            return output;
          });
        }, Promise.resolve());
      },
    };
  },
};
