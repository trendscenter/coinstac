// the following demonstrates how errors are propogated through the system

'use strict';

module.exports = {
  name: 'computation-errors',
  version: '0.0.1',
  cwd: __dirname,
  local: {
    type: 'cmd',
    cmd: 'python',
    args: ['./handled-error.py'],
    verbose: true,
  },
  remote: {
    type: 'function',
    fn: function (opts) { // eslint-disable-line
      const current = opts.previousData || {};
      opts.userResults.forEach((u) => {
        if (u.error) {
          throw new Error('error should have been handled in local script.');
        }
      });
      if (opts.userResults.length === opts.usernames.length) {
        current.complete = true;
      }
      return current;
    },
  },
};
