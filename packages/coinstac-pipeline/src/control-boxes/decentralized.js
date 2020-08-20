'use strict';

module.exports = {
  preIteration(controllerState) {
    if (controllerState.success
      && controllerState.mode === 'remote') {
      return 'doneRemote';
    } if (controllerState.success) {
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
