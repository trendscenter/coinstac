const get = require('lodash/get');

// PART 1 - scaffold
module.exports = {
  name: 'group-add',
  version: '0.0.1',
  local: {
    type: 'function',
    fn: function (opts, cb) { // eslint-disable-line
      // PART 2
      // get group result if it exists yet
      const remoteData = get(opts, 'remoteResult.data');
      // get my current step, or default it to zero
      const userStep = opts.previousData || 0;

      // PART 3
      // determine if the user's step === the step permitted
      // by the remote compute server
      const groupStep = get(remoteData, 'step') || 1;
      if (userStep === groupStep) { return cb(); }

      // ...
    },
  },
  remote: {
    // add pipeline here
  },
};
