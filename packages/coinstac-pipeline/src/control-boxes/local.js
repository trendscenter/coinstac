'use strict';

module.exports = {
  preIteration(controllerState) {
    if (controllerState.success) {
      return 'done';
    }

    return 'nextIteration';
  },
};
