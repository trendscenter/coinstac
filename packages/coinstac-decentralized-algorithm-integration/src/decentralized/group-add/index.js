// the following DecentralizedComputation has all members in a consortium count
// together.  that is, each member starts counting from 0, and once everyone has
// counted to the next integer (e.g. 1), then each user is permitted to count to
// the following integer (e.g. 2).  each user waits to hear back from the
// central compute server if it's ok to proceed or not

'use strict';

const _ = require('lodash');
 // @note - see docs on how to use external libs
module.exports = {
  name: 'group-add',
  version: '0.0.1',
  local: {
    type: 'function',
    fn: function (opts) { // eslint-disable-line
      const remoteData = opts.remoteResult ? opts.remoteResult.data : null;
      const userStep = opts.previousData || 0;
      const groupStep = (remoteData && remoteData.step) || 1;
      if (userStep === groupStep) { return null; }
      console.log('...bumping', userStep + 1); // eslint-disable-line
      return userStep + 1;
    },

    /**
     * @todo Remove once covariate inputs aren't required.
     *
     * {@link https://github.com/MRN-Code/coinstac/issues/161}
     */
    inputs: [{
      type: 'covariates',
    }],
  },
  remote: {
    type: 'function',
    fn: function (opts) {  // eslint-disable-line
      // stub some default values
      const _default = { step: 1, userStep: {} };

      // construct our current group data from default and past values
      const result = _.assign({}, _default, opts.previousData);

      // apply user integer counts to our RemoteComputationResult
      opts.userResults.forEach((usrRslt) => {
        result.userStep[usrRslt.username] = usrRslt.data;
      });
      const userStepValues = _.values(result.userStep);
      const allUsersMatch = userStepValues.every(uStep => uStep === result.step);
      const allUsersPresent = userStepValues.length === opts.usernames.length;
      const shouldBumpStep = allUsersMatch && allUsersPresent;

      if (result.step === 3 && allUsersMatch) {
        result.complete = true;
      } else if (shouldBumpStep) {
        result.step += 1;
      }

      console.log(opts.userResults.map((rslt) => ({ // eslint-disable-line
        un: rslt.username,
        data: rslt.data,
      })));
      return result;
    },
  },
};
