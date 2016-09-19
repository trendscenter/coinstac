'use strict';

const get = require('lodash/get');
const set = require('lodash/set');
const values = require('lodash/values');

/** @todo Test group-step */
/* istanbul ignore next */
module.exports = {
  preRun: {
    local: function groupStepLocal(runInputs, compResult, hooks) {
      const userStep = get(compResult, 'pluginState[\'group-step\'].step') || 0;
      const groupStep = get(runInputs, 'remoteResult.pluginState[\'group-step\'].step') || 1;
      if (userStep === groupStep) {
        hooks.cancelRun();
      } else {
        hooks.forceSave();
        set(compResult, 'pluginState[\'group-step\'].step', userStep + 1);
      }
      return runInputs;
    },
    remote: function groupStepRemote(runInputs, compResult, hooks) {
      let err;
      // stub some default values
      const _default = { step: 1, userStep: {} };
      // construct our current group data from default and past values
      const state = get(compResult, 'pluginState[\'group-step\']') || _default;
      // apply user integer counts to our RemoteComputationResult
      runInputs.userResults.forEach((usrRslt) => {
        const userStep = get(usrRslt, 'pluginState[\'group-step\'].step');
        state.userStep[usrRslt.username] = userStep;
      });
      const userStepValues = values(state.userStep);
      const allUsersMatch = userStepValues.every((uStep) => uStep === userStepValues[0]);
      const allUsersLatest = userStepValues.every((uStep) => uStep === state.step);
      const allUsersPresent = userStepValues.length === runInputs.usernames.length;
      const shouldBumpStep = allUsersMatch && allUsersPresent && allUsersLatest;
      let waitForOtherUsers = false;
      if (!allUsersPresent || !allUsersLatest || !allUsersMatch) {
        waitForOtherUsers = true;
      }
      if (shouldBumpStep) {
        hooks.forceSave();
        state.step += 1;
      } else if (waitForOtherUsers) {
        hooks.cancelRun();
        hooks.forceSave();
      }
      set(compResult, 'pluginState[\'group-step\']', state);
      if (err) {
        throw err;
      }
    },
  },
  postRun: {
    // local  - noop. preRun bumps the step
    // remote - noop. preRun bumps the step
  },
};
