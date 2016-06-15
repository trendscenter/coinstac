const get = require('lodash/get');

// PART 1 - scaffold
module.exports = {
  name: 'group-add',
  version: '0.0.1',
  local: {
    // hidden for clarity (PART 1 -4)
  },
  remote: {
    type: 'function',
    fn: function (opts, cb) {
      // PART 6
      // stub some default values for the remote step and userSteps
      const _default = { step: 1, userStep: {} };

      // construct our current state from default _and_ past values
      const result = Object.assign({}, _default, opts.previousData);

      // apply user integer counts to our RemoteComputationResult
      opts.userResults.forEach((usrRslt) => {
        result.userStep[usrRslt.username] = usrRslt.data;
      });

      // ...
    },
  },
};
