# design a distributed computation
a  [DecentralizedComputation](http://mrn-code.github.io/coinstac-common/DecentralizedComputation.html) is a  [DataType in coinstac](http://mrn-code.github.io/coinstac-common/).  as a consortium leader or designer, your goal is to provide the content and algorithms for how pipelines, analyses, or general computations are run both on  consortium members' devices, as well as on a central compute server.

a `DecentralizedComputation` is composed of three parts:
- the overall description of your computation.
- the description of what each member needs to execute.
- the description of what the central server needs to compute.

let's figure out how to build one.

## prepare
- [fork](https://help.github.com/articles/fork-a-repo/) and [clone](https://help.github.com/articles/cloning-a-repository/) your copy of this repository.
- run `npm install` in your cloned directory.  if you don't have [nodejs](https://nodejs.org) installed, go grab it.  it's a quick [installation](https://nodejs.org/en/download/).
- run `npm test` for a sanity purposes!  make sure the tests all pass on your machine.

## design

how to design an `DecentralizedComputation` is best discovered through example. we will follow some examples found in `src/distributed`.

### definition

the general form of a `DecentralizedComputation` is a simple `.js` file defined as follows:

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
- **name**: we encourage an all lowercase, hyphen seperated name (e.g. [kebab-case](https://lodash.com/docs#kebabCase)).  all names will be kebab-cased if imported into the greater COINSTAC system
- **version**: it is critical that you version your computations, such that all your users and central compute server run the correctly corresponding code.  we strongly recommend using semantic versioning, i.e. [semver](http://semver.org/).
- **local**/**remote**: these are arrays or objects that define a set of computations (a `Pipeline`) to run in either environment.  If you've used pipelines before, please note that these Pipelines have some bells and whistles attached to them, which we will cover soon.
  - `local: [ ... ]` runs on user machines (e.g. consortium members)
  - `remote: [ ... ]` runs on the central compute node, and consumes all user results produced from `local` computations

### pipeline basics

a [`Pipeline`](http://mrn-code.github.io/coinstac-common/DecentralizedComputation.html) in COINSTAC is not your run-of-the-mill, [traditional sequential Pipeline](https://en.wikipedia.org/wiki/Pipeline_(computing)).  COINSTAC decentralized Pipelines differ from traditional pipelines with the following modifications:

- COINSTAC Pipelines may `halt` and `resume`
- COINSTAC Pipelines may conditionally `progress` to subsequent steps, or, repeat the current step many times
- COINSTAC Pipelines _do not_ [stream](https://en.wikipedia.org/wiki/Stream_(computing)) data from step to step, but do present prior step data to subsequent steps.

let us observer a very simple pipeline declaration from the `process-files` `DecentralizedComputation` in `src/distributed`:

```js
local: [{
    type: 'cmd',
    cmd: 'node',
    args: ['./process-data.js'],
    verbose: true
}],
```

It would appear that this single step Pipeline simply runs `node ./process-data.js`.  In fact, it does do this, _however_, also provides a great deal of extra data to the passed command as well.  The _actual_ command run is something more to the tune of:

`node ./process-data.js -run { ...coinstac-inputs }`

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
[@ref](http://mrn-code.github.io/coinstac-common/LocalPipelineRunner.html#run)

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
[@ref](http://mrn-code.github.io/coinstac-common/RemotePipelineRunner.html#run)

### example - group-add
See [EXAMPLE-GROUP-ADD.md](./EXAMPLE-GROUP-ADD.md) for a step-by-step walkthrough on how a simple decentralized algorithm is developed.


### external dependencies

at current time, dependencies are not partitioned between `local` and `remote` pipelines.  in the `setup` attribute of your DecentralizedComputation, add a command to install your dependencies as needed (e.g. `pip install`, `npm install`).
  - in this repo, deps are _not_ installed by default.  we do some short circuiting so that the simulations run faster.  talk to us if you want to bundle something into our integrations that requires a 3rd party install!

### run

eventually, we will bundle this package as a runner, so your library can require it, and it can run your design for you!  until then, add your library into ours. That is, in `src/distributed/your-computation/index.js`, `require('your-computation')`.  if you need help, don't hesitate to contact us.

### publish

push your design to GitHub/GitLab.  if you want it available in COINSTAC proper, drop us a line in the GH issues and we will get it integrated.
  - all COINSTAC algorithms are subject to review prior to public availability via the COINSTAC UI
