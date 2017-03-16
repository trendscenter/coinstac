// the following DecentralizedComputation simulates running a computation
// which filenames are passed in from the user, and the computation reads and
// acts on them.
'use strict';
module.exports = {
  name: 'process-files',
  version: '0.0.1',
  cwd: __dirname,
  local: {
    type: 'cmd',
    cmd: 'node',
    args: ['./process-data.js'],
    verbose: true,

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
    // simply stores each user file content to the remote result.  Exits
    // when it sees that it has received a file from each user!
    // @NOTE _never pass full file content back from user processes_. This
    // could be a severe privacy usage violation.  Further COINSTAC may limit
    // how much content you are permitted to store per result
    type: 'function',
    fn: function (opts) { // eslint-disable-line
      const current = opts.previousData || {};
      opts.userResults.forEach(u => {
        current[u.username] = u.data;
      });
      const allUsersPresent = opts.userResults.length === opts.usernames.length;
      if (allUsersPresent) { current.complete = true; }
      console.log(current); // eslint-disable-line
      return current;
    },
  },
};
