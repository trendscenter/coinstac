const values = require('lodash/values');

// PART 1 - scaffold
module.exports = {
  name: 'group-add',
  version: '0.0.1',
  local: {
    // hidden for clarity (PART 1 -4)
  },
  remote: {
    type: 'function',
    fn(opts, cb) {
      // PART 6
      // stub some default values for the remote step and userSteps
      const _default = { step: 1, userStep: {} };

      // construct our current state from default _and_ past values
      const result = Object.assign({}, _default, opts.previousData);

      // apply user integer counts to our RemoteComputationResult
      opts.userResults.forEach((usrRslt) => {
        result.userStep[usrRslt.username] = usrRslt.data;
      });

      // PART 7
      // compute some basic data regarding the state of all
      // of our users who have contributed
      const userStepValues = values(result.userStep); // e.g. [1, 1, 1]
      const allUsersMatch = userStepValues.every(uStep => uStep === result.step);
      const allUsersPresent = userStepValues.length === opts.usernames.length;
      const shouldBumpStep = allUsersMatch && allUsersPresent;

      // PART 8
      // - test for our halting condition and exit, OR
      // - command users to count higher
      if (result.step === 3 && allUsersMatch) {
        result.complete = true;
      } else if (shouldBumpStep) {
        result.step += 1;
      }
      cb(null, result);
    },
  },
};
