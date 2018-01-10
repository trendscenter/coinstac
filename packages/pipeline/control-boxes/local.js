'use strict';

module.exports = {
  preIteration(controllerState) {
    if (controllerState.currentOutput && controllerState.currentOutput.success) {
      return 'done';
    }

    return 'nextIteration';
  },
};
