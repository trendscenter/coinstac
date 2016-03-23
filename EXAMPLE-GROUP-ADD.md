# example - group-add

## description
`group-add` is a very simple DecentralizedComputation.  It asks each user to
count to the next integer.  One user will first count to `1` to kickoff the
computation run, and all other users will wait until they "hear" from the remote
compute server that they are allowed to count to `1` as well.  The remote
compute server will declare a current `step`, and users may only count to the
next integer when their step is less than the server's declared step.
The server increases the step once everyone participating have all counted to
the same number.

Easy right?  Let's go!

## overview

In our computation, suppose we use no external libraries.  Our top-level declaration would look like this:

```js
module.exports = new DecentralizedComputation({
    name: 'group-add',
    version: '0.0.1',
    ...
});
```

## local computation

The local pipeline is defined as follows:

```js
local: {
    type: 'function',
    fn: function(opts, cb) {
        const remoteData = opts.remoteResult ? opts.remoteResult.data : null;
        const userStep = opts.previousData || 0;
        const groupStep = remoteData && remoteData.step || 1;
        if (userStep === groupStep) { return cb(); }
        console.log('...bumping',  userStep + 1);
        cb(null, userStep + 1);
    }
},
```

Take note of two key elements of this pipeline:

1. it's just one step.  we didn't define `[ an, array, of, Computations ]`, but rather, just a single `local: {}`.  that's fine!  it will be interpreted as a single step Pipeline.
1. we are using `type: 'function'` as our only pipeline step.  COINSTAC supports various computation types.  type `function` enables us to get the pipeline inputs directly through a function call.
  - 1. type `cmd` may have been used here too. `cmd` enables you to use _any language available_ on user and remote-compute systems.  in that case, arguments would be passed through the CLI. see the `CommandComputation` docs on that!

Let's now breakdown the operations:

1. we grab any `data` computed by the remote server.
1. we determine the step that the user has counted to by checking their `previousData`.  if he/she hasn't counted yet, we default the step to `0`.
1. we determine if the user step matches the remote step.  if it does, we will not count further, so we `cb()` to exit early.
  1. `cb()` with no args is the equivalent of a [noop](https://en.wikipedia.org/wiki/NOP). if the pipeline has run _more than once_, a `cb()` will _not save the state of the pipeline or the results_, and hence not trigger any event driven activity on the remote compute server.
1. we count one integer higher!
  1. calling `cb(null, value)` tells the system that the computation is complete. `value` will get stuffed into the `.data` attribute of the `LocalComputationResult`, which we will see later in the `remote` pipeline.


Recall, per the above, that a user always kicks off the computation cycle.  When the user kicks off the computation for the first time, a basic empty `remoteResult` (e.g. RemoteComputationResult) is passed in, along with the other contents described back over in the [DecentralizedComputation.md](./DecentralizedComputation.md).  Only after that first local computation completes will the remote server detect the result, and enter into its pipeline routine.

## remote computation

The remote pipeline is defined as follows:

```js
fn: function(opts, cb) {
    // stub some default values
    const _default = { step: 1, userStep: {} };

    /*
    {
      step: 1, // <== step starts at 1, and we will count to 3 with all users
      userStep: { // <== userStep will have approximately the following shape:
        brad: 1,  // @note, if we have 3 `usernames` in `opts.usernames`,
        sacha: 1, // only after each person has contributed will this have three kv-pairs
      }
    }
    */

    // update our perception of state by applying our results from the last run
    let result = _.assign({}, _default, opts.previousData);

    // apply user integer counts to our RemoteComputationResult
    opts.userResults.forEach(usrRslt => {
        result.userStep[usrRslt.username] = usrRslt.data;
    });
    const userStepValues = _.values(result.userStep); // <== e.g. [ 1, 1 ]
    const allUsersMatch = userStepValues.every(uStep => uStep === result.step);
    const allUsersPresent = userStepValues.length === opts.usernames.length;
    const shouldBumpStep = allUsersMatch && allUsersPresent;

    if (result.step === 3 && allUsersMatch) {
        result.complete = true;
    } else if (shouldBumpStep) {
        result.step += 1;
    }

    console.log(opts.userResults.map(rslt => ({
        un: rslt.username,
        data: rslt.data
    })));
    cb(null, result);
}
```

now that we saw how the local pipeline worked, understanding the remote pipeline should be much simpler. we:

- declare a default `RemoteComputationResult` shape (hereby `result`)
- update our result with previously saved data
- update our result with _all data passed from users_
  - specifically, we store which integer all users have counted to
- we test if all contributing users have counted to our target `step`
- we test if everyone has contributed
- if everyone has contributed and is at the same step we either:
  - allow users to count higher by "bumping the step", or
  - `complete` the computation if everyone has counted to three (3)
- otherwise, we simply update our result!

if local users detect the _latest_ remote `result` and revive their pipelines, naturally, you can see how this algorithm will converge with all users counted to 3 and finally exit.

note, calling back with `.complete` set to something truthy is a _special case_.  COINSTAC sniffs your result for `.complete`, and uses it to exit your computation!

## test

group-add is available as an integration test.  you can run `npm test` in this repo root to watch group-add go!  feel free to edit [test/index.js](https://github.com/MRN-Code/coinstac-decentralized-algorithm-integration/blob/master/test/index.js) and comment out the other integration files to focus just on this one.  of course, you may also run the coinstac-simulator against the "declaration" in that repo as well.  make tweaks to the algorithm and watch the output change!
