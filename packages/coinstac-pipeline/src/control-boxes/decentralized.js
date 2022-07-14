'use strict';

module.exports = {
  preIteration(controllerState) {
    if (controllerState.success
      && controllerState.mode === 'remote') {
      return 'doneRemote';
    } if (controllerState.success) {
      return 'done';
    } if (controllerState.initial
      && controllerState.mode === 'remote') {
      return 'firstServerRemote';
    } if (controllerState.state === 'Finished iteration'
    || controllerState.state === 'Iteration finished with an error') {
      return 'remote';
    }
    return 'nextIteration';
  },
};
