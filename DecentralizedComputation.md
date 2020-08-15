# Design a Decentralized Computation

A  [Decentralized Computation](http://mrn-code.github.io/coinstac/coinstac-common/DecentralizedComputation.html) is a [data type in coinstac-common](http://mrn-code.github.io/coinstac/coinstac-common/index.html). As a consortium leader or designer, your goal is to provide the content and algorithms for how pipelines, analyses, or general computations are run both on  consortium members' devices, as well as on a central compute server.

A `DecentralizedComputation` is composed of three parts:
- the overall description of your computation.
- the description of what each member needs to execute.
- the description of what the central server needs to compute.

Let's figure out how to build one.

## prepare
- install [nodejs](https://nodejs.org).  it's a quick [installation](https://nodejs.org/en/download/).
- install [coinstac-simulator](http://mrn-code.github.io/coinstac/coinstac-simulator/).
- open the [integration package](http://mrn-code.github.io/coinstac/coinstac-decentralized-algorithm-integration/), as we will reference it in our examples.

## design

How to design an `DecentralizedComputation` is best discovered through example. we will follow some examples found in the integration repository mentioned above.

### definition

The general form of a `DecentralizedComputation` is a simple `.js` file defined as follows:

```js
{
  name: 'my-computation',
  version: '0.0.1',
  local: [ ... ],
  remote: [ ... ]
  setup: './install externals.txt'
}
```

A few things to note:
- **name**: we encourage an all lowercase, hyphen separated name (e.g. [kebab-case](https://lodash.com/docs#kebabCase)).  all names will be kebab-cased if imported into the greater COINSTAC system
- **version**: it is critical that you version your computations, such that all your users and central compute server run the correctly corresponding code.  we strongly recommend using semantic versioning, i.e. [semver](http://semver.org/).
- **local**/**remote**: these are arrays or objects that define a set of computations (a `Pipeline`) to run in either environment.  If you've used pipelines before, please note that these Pipelines have some bells and whistles attached to them, which we will cover soon.
  - `local: [ ... ]` runs on user machines (e.g. consortium members)
  - `remote: [ ... ]` runs on the central compute node, and consumes all user results produced from `local` computations

### pipeline basics

a `Pipeline` in COINSTAC is not your run-of-the-mill, [traditional sequential Pipeline](https://en.wikipedia.org/wiki/Pipeline_(computing)).  COINSTAC decentralized Pipelines differ from traditional pipelines with the following modifications:

- COINSTAC Pipelines may `halt` and `resume`.
- COINSTAC Pipelines may conditionally `progress` to subsequent steps, or, repeat the current step many times.
- COINSTAC Pipelines _do not_ [stream](https://en.wikipedia.org/wiki/Stream_(computing)) data from step to step, but do present prior step data to subsequent steps.

let us observe a very simple pipeline declaration from the `process-files` `DecentralizedComputation`, found `src/decentralized` in the integration repo:

```js
local: [{
    type: 'cmd',
    cmd: 'node',
    args: ['./process-data.js'],
    verbose: true
}],
```

It would appear that this single step Pipeline simply runs `node ./process-data.js`.  In fact, it does do this, _however_ it also provides a great deal of extra data to the passed command as well.  The _actual_ command run is something more to the tune of:

`node ./process-data.js -run { ...coinstac-inputs }`

Read further to understand exactly what `...coinstac-inputs` really are.

#### pipeline inputs

What are **coinstac-inputs**, as shown above?  They vary, based on whether your `Pipeline` is being run on `local` or `remote`.

##### local pipeline inputs

if your Pipeline is running on user machines, you may need a local user's `username`, and likely the latest computation result from the `remote` server (hereby `RemoteComputationResult`).  Indeed, you get 'em!  The full set of inputs passed (JSON serialized), are:

```js
{
    computationId: {string},
    consortiumId: {string},
    previousData: {*},
    remoteResult: {RemoteComputationResult},
    username: {string},
    userData: {*}
}
```
[@ref](http://mrn-code.github.io/coinstac/coinstac-common/LocalPipelineRunner.html#run)

##### remote pipeline inputs

if your Pipeline is running on the remote compute server, you may require _all_ `LocalComputationResult`s, the `usernames` who are participating in a particular decentralized computation run, as well as perhaps the _last_ result you computed.  Indeed, you get 'em!  The full set of inputs passed (JSON serialized), are:

```js
{
    computationId: {string},
    consortiumId: {string},
    previousData: {*},
    usernames: {string[]},
    userResults: {LocalComputationResult[]},
}
```
[@ref](http://mrn-code.github.io/coinstac/coinstac-common/RemotePipelineRunner.html#run)

### example - group-add
See [EXAMPLE-GROUP-ADD.md](./EXAMPLE-GROUP-ADD.md) for a step-by-step walkthrough on how a simple decentralized algorithm is developed.


### external dependencies

at current time, dependencies are not partitioned between `local` and `remote` pipelines.  in the `setup` attribute of your DecentralizedComputation, add a command to install your dependencies as needed (e.g. `pip install`, `npm install`).
  - in this repo, deps are _not_ installed by default.  we do some short circuiting so that the simulations run faster.  talk to us if you want to bundle something into our integrations that requires a 3rd party install!

### run

See [coinstac-simulator](http://mrn-code.github.io/coinstac/coinstac-simulator/)'s documentation.  If you've already accomplished the above, it should be a piece of cake! :cake:

### publish

push your design to GitHub/GitLab.  if you want it available in COINSTAC proper, drop us a line in the GH issues and we will get it integrated.
  - all COINSTAC algorithms are subject to review prior to public availability via the COINSTAC UI
