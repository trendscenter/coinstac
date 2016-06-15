'use strict';

module.exports = {
  name: 'group-step-seeding',
  version: '0.0.1',
  plugins: ['group-step'],
  local: [
    {
      type: 'function',
      fn: function notifyParticipation(opts) {
        console.log(`${opts.username} preprocessing done`);
        return [1, 2, 3];
      },
      verbose: true,
    },
    {
      type: 'function',
      fn: function (opts) {
        const remote = opts.remoteResult.data;
        if (remote !== 2) {
          throw new Error('expected seed average of 2');
        }
        console.log(`yea, i saw that everyone's average is ${remote}`);
        return true;
      },
      verbose: true,
    },
  ],
  remote: [
    {
      type: 'function',
      fn: function doSeeding(opts) {
        const avg = (arr) => arr.reduce((p, i) => i + p, 0) / arr.length;
        const r = opts.userResults.reduce((p, uR) => p + avg(uR.data), 0) / opts.userResults.length;
        console.log([
          `I've computed everyone's average: ${r}. By using the group-step`,
          'plugin, I can make sure that everyone get\'s some base data from me',
          'before they go about doing some computation/analysis.',
        ].join(' '));
        return r;
      },
      verbose: true,
    },
    {
      type: 'function',
      fn(opts) {
        console.log('boom baby.');
        return { complete: true };
      },
    },
  ],
};
