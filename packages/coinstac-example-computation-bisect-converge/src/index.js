'use strict';
// the following DecentralizedComputation has each member initially "guess" the
// number that the remote compute server is "thinking."


module.exports = {
  name: 'bisect-converge',
  version: '0.0.1',
  cwd: __dirname,
  plugins: ['group-step'],
  local: [
    // guess first integer
    {
      type: 'cmd',
      cmd: 'python',
      args: ['./generate-random-int.py'],
      verbose: true,
    },
    // attempt to converge to server target, using "hints" from the remote
    {
      type: 'function',
      fn: function (opts) { // eslint-disable-line
        if (
          !opts.remoteResult.data || // no data from server yet (kickoff)
          opts.remoteResult.data.target === undefined
        ) { return null; }
        const lastGuess = opts.previousData;
        let currGuess = opts.previousData;
        const target = opts.remoteResult.data.target;
        currGuess = ((target - currGuess) / 2) + currGuess;
        console.log('old', lastGuess, 'new', currGuess); // eslint-disable-line
        return currGuess;
      },
      verbose: true,
    },
  ],
  remote: [
    // declare first integer
    {
      type: 'cmd',
      cmd: 'python',
      args: ['./generate-random-int.py'],
      verbose: true,
    }, {
      type: 'function',
      fn: function (opts) { // eslint-disable-line
        let target;
        if (typeof opts.previousData === 'number') {
          target = parseInt(opts.previousData, 10);
        }
        let result = {};
        let convergeCount = 0;
        if (target >= 0) {
          // on first run, target is a random number from the python
          // computation above
          result.target = target;
        } else {
          // on second run+, our result is an object
          result = opts.previousData;
          target = result.target;
        }
        result = Object.assign({}, { state: {} }, result);
        opts.userResults.forEach((usrRslt) => {
          const userGuess = usrRslt.data;
          if (userGuess === null || userGuess === undefined) { return; }
          const delta = Math.abs(userGuess / target);
          // console.log(`${usrRslt.username} in: ${userGuess} target: ${target} delta: ${delta}`)
          if (delta > 0.95 && delta < 1.05) {
            ++convergeCount;
          }
        });
        const allConverged = convergeCount === opts.usernames.length;

        if (allConverged) {
          result.complete = true;
          console.log(
            `all users converged on ${target}`,
            opts.userResults.map((uR) => ({ final: uR.data, username: uR.username }))
          );
        }
        return result;
      },
      verbose: true,
    },
  ],
};
