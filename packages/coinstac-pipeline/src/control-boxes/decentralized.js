'use strict';

module.exports = {
  preIteration(controllerState) {
    if (controllerState.currentOutput
      && controllerState.currentOutput.success
      && controllerState.mode === 'remote') {
      return 'doneRemote';
    } if (controllerState.currentOutput && controllerState.currentOutput.success) {
      return 'done';
    } if (controllerState.remoteInitial) {
      return 'firstServerRemote';
    } if (controllerState.state === 'finished iteration'
    || controllerState.state === 'finished iteration with error') {
      return 'remote';
    }
    return 'nextIteration';
  },
};
