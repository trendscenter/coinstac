'use strict';

module.exports = { // eslint-disable-line
  name: 'process-dir',
  version: '0.0.1',
  cwd: __dirname,
  local: {
    type: 'cmd',
    cmd: 'python',
    args: ['./echo-my-data.py'],
    verbose: true,
  },
  remote: {
    type: 'function',
    fn(opts) {
      const data = opts.previousData || {};
      opts.userResults.forEach(rslt => (data[rslt.username] = rslt.data));
      if (data && Object.keys(data).length === opts.usernames.length) {
        data.complete = true;
      }
      console.error(data); // eslint-disable-line
      return data;
    },
  },
};
