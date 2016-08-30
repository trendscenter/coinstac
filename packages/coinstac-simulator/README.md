# coinstac-simulator

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

[ ![Codeship Status for MRN-Code/coinstac-simulator](https://codeship.com/projects/370d2330-d2b2-0133-5da2-5e07c373472b/status?branch=master)](https://codeship.com/projects/141922)

the official API documentation [lives here](http://mrn-code.github.io/coinstac-simulator/), albeit there's not much too it!

## what

Provides a runner for you to test your [DecentralizedComputations](http://mrn-code.github.io/coinstac/coinstac-common/DecentralizedComputation.html) via a **CLI** tool and an **importable library**.

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/packages/coinstac-simulator/media/demo-capture.gif" />

## how

regardless if you are simulating by using our CLI or the library, you need to define a "declaration" on how your simulation will be run.  you are welcome to [look here at some examples](https://github.com/MRN-Code/coinstac/blob/master/packages/coinstac-decentralized-algorithm-integration/test/declarations/).

a simulation "declaration" is a `.js` file with the following shape:

```js
module.exports = {
  computationPath: './path/to/decentralized-computation.js',
  users: [
    { username: 'user_a', data: { ... } },
    { username: 'user_b', data: { ... } },
  ],
  server: { // optional
    preRun: [
      (done) => { /* do something interesting */},
    ],
    postRun: [
      (done) => { /* do something interesting */},
    ],
  },
  verbose: true,
};
```
 - _@NOTE_ the **data** property in each `users` object is _optional_, and can be any JSON serializable input
 - _@NOTE_ the declaration must always be _javascript_.  feel free to submit a PR to support other types if you strongly prefer YAML/JSON/something-else!

### cli mode

- `npm install -g coinstac-simulator`
- `coinstac-simulator -d path-to-declaration.js`

### library

```js
const sim = require('coinstac-simulator');
const handleErrors = require('coinstac-simulator/src/handle-errors')();
const declaration = require('./path-to-declaration.js');
sim.setup(declaration, (err) => {
  if (err) { throw err; }
  sim.teardown((err) => {
    if (err) { throw err; }
  });
});
```

## why

because decentralized computation authoring can be difficult.  you should validate your process before going live!

## when

now.

## where

right there at your desk.

### debugging

if `verbose` is toggled to `true` in your computation definition for [`cmd` type Computations](http://mrn-code.github.io/coinstac/coinstac-common/CommandComputation.html), you can write to `stderr` to have your information streamed onto the screen.  if that is otherwise insufficient, you will need to capture the inputs to the process, (via parsing the CLI input), and run your faulty script/program using your normal debug strategies of choice for whichever particular language you are using.

## it's not working

file an issue!  we will try and be prompt, and even try to help you with your algorithms if necessary.

## License

MIT. See [LICENSE](./LICENSE) for details.
