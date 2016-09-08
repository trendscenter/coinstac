# Computation Development

_This guide will walk through basic algorithm development in the COINSTAC ecosystem. It is intended for algorithm authors and developers._

## Basic overview of COINSTAC system

COINSTAC is an ecosystem for running decentralized algorithms with many clients. It uses a client-server model: while arbitrary calculations can run on clients and servers, the system’s primary use case is [differential privacy](https://en.wikipedia.org/wiki/Differential_privacy), where clients run algorithms with data to ensure their privacy. Clients submit their anonymized results to the server, which amalgamates clients’ data and performs interesting computations, such as averaging, modeling, etc.

COINSTAC’s core is written entirely in JavaScript; writing an algorithm requires writing an entry point in this language.
 However, the system is robust enough to support algorithms in any language.

It’s important to note that *COINSTAC is alpha software*: its rough around the edges. If you have a question or locate a bug please *[open an issue](https://github.com/MRN-Code/coinstac/issues/new)*.

## Setting Up Your Environment

_It is recommended that you develop in a UNIX-like environment, such as Mac OS X or Linux. While Windows support is planned, it poses several difficulties for algorithm authorship at this time._

Here’s what you’ll need to get up and running with COINSTAC:

1. **Node.js and NPM:** You’ll need the JavaScript runtime to develop for COINSTAC. The easiest way to get it is to [download it via the website](https://nodejs.org/en/download/). Alternatively, you can use [Node Version Manager](https://github.com/creationix/nvm) or [n](https://www.npmjs.com/package/n) to maintain multiple versions of Node.js on the same machine.
2. **coinstac-simulator:** This will assist in testing your algorithms in the COINSTAC ecosystem. To install, run from a shell:

    ```shell
    npm install --global coinstac-simulator
    ```

## How to Create A Computation

Computations in COINSTAC, often referred to as a “decentralized computations” throughout docs, are a set of functions for clients (referred to as “local”) and a central server (referred to as “remote”). These instructions are encapsulated in a JavaScript file that uses a CommonJS export object. Here’s a basic example:

```js
module.exports = {
  name: 'my-computation',
  version: '1.0.0',
  local: {
    type: 'function',
    fn: function(params) {

    },
  },
  remote: {
    type: 'function',
    fn: function(params) {

    },
  },
};
```

This is the decentralized computation “definition.” The basic properties:

* **`name`** `<String>`: The name of your computation, a JavaScript string of two or more characters. The name uniquely identifies your computation in the COINSTAC ecosystem.
* **`version`** `<String>`: The release of your computation, a JavaScript string that adheres to [semver](http://semver.org/). This should be incremented in accordance to updates in algorithm code.
* **`local`** `<Object>` | `<Array>`: Code to be run on clients.
* **`remote`** `<Object>` | `<Array>`: Code run on _the server_.

Definitions also support additional, optional properties (see [Pipelines](#pipelines) and [Plugins](#plugins)).

### Pipelines And Computation Steps

### Computation Step Basics

The `local` and `remote` values above are a special type of object, which COINSTAC recognizes as a computation step, or “computation”.

### JavaScript Computations

COINSTAC executes these computations in its own Node.js context:

```js
{
  type: 'function',
  fn: function(params) {

  },
}
```

* **`type`** `<String>`: Must be `function`, which specifies a “JavaScript”-type computation step.
* **`fn`** `<Function>`: Function to call. See [Computation Parameters](#computation-parameters) for documentation on the passed arguments.
* **`verbose`** `<Boolean>`: Whether to output the computation’s output to stdout.

These support a few more options, and you can do interesting things inside `fn`:

```js
{
  type: 'function',
  fn: function(params) {
    const myNumber = Math.random();
    console.log(myNumber);
    return myNumber;
  },
  verbose: true,
}
```

The above example generates a random number using JavaScript’s `Math.random` and assigns it to the `myNumber` variable. The `console.log` prints the value to output; the value is returned to COINSTAC on the following line. Note the `verbose` property: this ensures that COINSTAC prints `console.log` calls to stdout.

### Non-JavaScript Computations

COINSTAC has a second type of computation that allows algorithm developers to integrate any script they can dream of. It’s called a “command” computation:

```js
{
  type: 'cmd',
  cmd: 'python',
  args: ['./path/to/my/script.py', '--some', '--flags'],
  verbose: true,
}
```

* **`type`** `<String>`: Must be `cmd`, which specifies a “command”-type computation step.
* **`cmd`** `<String>`: Executable to use.
* **`args`** `<Array>`: Arguments to pass to the executable.
* **`verbose`** `<Boolean>`: Whether to output the computation’s output to stdout.

The command computation spawns a new process, in the above case with Python, and executes with the arguments passed to the executable. COINSTAC will serialize input parameters as JSON and pass them as the last argument to the executable (see [Computation Parameters](#computation-parameters)).

#### Returning Data

It’s important that your script **only output valid JSON** via stdout; otherwise, COINSTAC will throw an error. You can test your script by [installing `jq`](https://stedolan.github.io/jq/) and running:

```shell
python ./path/to/my/script.py --some --flags | jq .
```

This should alert you to invalid JSON.

#### Returning An Error

Write to stderr if you need to raise an exception. COINSTAC will detect this and mark the computation result as an error.

### Computation Parameters

Computations – both JavaScript and non-JavaScript – receive parameters from COINSTAC. The parameters’ shape depends on whether the computation is intended for use with clients (`local`) or the server (`remote`).

#### Local Parameters

A JavaScript object containing the following properties and values is passed to local computations:

* **`computationId`** `<String>`: Unique computation identifier
* **`consortiumId`** `<String>`: Unique consortium identifier
* **`previousData`**: Results from previous computation run
* **`remoteResult`** `<RemoteComputationResult>`: Results from the previous remote computation
  * **`computationId`** `<String>`: Unique computation identifier
  * **`complete`** `<Boolean>`: Whether computation has been marked complete by the remote (server)
  * **`consortiumId`** `<String>`: Unique consortium identifier
  * **`usernames`** `<Array>`: Usernames (strings) involved in computation
  * **`userErrors`** `<Array>`: collection of users’ errors
  * **`data`**: Computation output from latest remote run
  * **`error`** `<Object>` | `null`: Remote result's error
  * **`history`** `<Array>`: Sequential collection of past remote results
  * **`pipelineState`** `<Object>`:
    * **`step`** `<Number>`: The pipeline’s current step
    * **`inProgress`** `<Boolean>`: Whether the pipeline is progressing
* **`username`** `<String>`: Client’s username
* **`userData`**: Serialized user input

#### Remote Parameters

A JavaScript object containing the following properties and values is passed to remote computations:

* **`computationId`** `<String>`: Unique computation identifier
* **`consortiumId`** `<String>`: Unique consortium identifier
* **`previousData`**: Previous remote computation's results
* **`usernames`** `<Array>`: Usernames (strings) involved in computation
* **`userResults`** `<Array>`: Collection of clients’ `LocalComputationResults` local results. These will have the following properties:
  * **`computationId`** `<String>`: Unique computation identifier
  * **`complete`**: (boolean) Whether computation has been marked complete by the remote (server)
  * **`consortiumId`** `<String>`: Unique consortium identifier
  * **`data`**: Computation output from latest remote run
  * **`error`** `<Object>` | `null`: Remote result's error
  * **`history`** `<Array>`: Sequential collection of client's past results
  * **`pipelineState`** `<Object>`:
    * **`step`** `<Number>`: The pipeline’s current step
    * **`inProgress`** `<Boolean>`: Whether the pipeline is progressing
  * **`username`** `<String>`: Client’s username
  * **`userData`**: Serialized user input

### Pipelines

Computations can be strung together to form a “pipeline,” or a collection of discrete steps. These differ from [traditional sequential Pipeline](https://en.wikipedia.org/wiki/Pipeline_(computing)) in a few ways:

* COINSTAC pipelines may halt and resume.
* COINSTAC pipelines may conditionally progress to subsequent steps or repeat the current step many times.
* COINSTAC pipelines do not [stream](https://en.wikipedia.org/wiki/Stream_(computing)) data from step to step; they provide prior step data to subsequent steps.

Our previous examples are translated to COINSTAC as a pipeline with one step:

```js
module.exports = {
  // ...
  local: {
    type: 'function',
    fn: function(params) {
      // ...
    },
  },
  // ...
};
```

Authors may add more steps by employing a JavaScript array as the `local` or `remote` value:

```js
module.exports = {
  // ...

  local: [
    // First computation:
    {
      type: 'function',
      fn: function(params) {
        // ...
      },
    },

    // Second computation:
    {
      type: 'function',
      fn: function(params) {
        // ...
      },
    },

    // ...and so on.
  ],
  remote: [
    {
      type: 'function',
      fn: function(params) {
        // ...
      },
    },
    {
      type: 'function',
      fn: function(params) {
        // ...
      },
    },
  ],
};
```

### Plugins

Plugins modify your decentralized computation by adjusting its COINSTAC lifecycle or adding functionality. You can add them as a JavaScript array under the `plugins` property:

```js
module.exports = {
  name: 'my-computation',
  version: '1.0.0',
  local: [
    // ...
  ],
  remote: [
    // ...
  ],
  plugins: ['group-step'],
};
```

The only plugin currently available is *group-step*. It is a flow control modifier that ensures that all clients have completed a computation “step” before passing control back to the server.

## Testing Computations

To test your computation you’ll need to provide some basic parameters and pass things to _[coinstac-simulator](https://github.com/MRN-Code/coinstac/tree/master/packages/coinstac-simulator)_. It needs a declaration file, which is written in JavaScript:

```js
// declaration.js
module.exports = {
  computationPath: './path/to/computation.js',
  local: [
    {
      x: 1,
      y: 2,
    }, {
      x: 3,
      y: 4,
    }
  ],
  remote: {
    x: 5,
    y: 6,
  },
};
```

This declaration has a few properties:

* **`computationPath`** `<String>`: Path to your decentralized computation file.
* **`local`** `<Array>`: Collection of local data to simulate. Each object in this array equates to a client instance, and the client is passed the data in the object.
* **`remote`** `<Object>`: (optional) data for the server.

```shell
coinstac-simulator --declaration ./path/to/declaration.js
```

### File-loading Utilities

_coinstac-simulator_ comes with two utility methods to assist in loading your data. To use them you’ll need to set up a module with a [_package.json_ via NPM](https://docs.npmjs.com/getting-started/using-a-package.json):

1. Locate or create a directory suitable for your algorithm testing.
2. Run `npm init` and follow the prompts. This will generate a _package.json_ file, which NPM uses to manage dependencies.
3. Run `npm install coinstac-simulator --save` to add _coinstac-simulator_ as a dependency to your project. This will create a _node_modules_ directory – where NPM places packages – in your project directory.

Here’s the API:

#### coinstacSimulator.loadFiles(pattern, [delimiter]):

* **`pattern`** `<String>`: File globbing pattern passed to [glob](https://www.npmjs.com/package/glob)
* **`delimiter`** `<String>`: CSV delimiter

Use:

```js
// declaration.js
const coinstacSimulator = require('coinstac-simulator');

module.exports = {
  computationPath: './path/to/computation.js',
  local: [
    {
      x: coinstacSimulator.loadFiles('./path/to/files/1/*.txt'),
    },
    {
      x: coinstacSimulator.loadFiles('./path/to/files/2/*.txt'),
    }, {
      x: coinstacSimulator.loadFiles('./path/to/files/3/*.txt'),
    },
  ],
}
```

#### coinstacSimulator.createUserData(pattern, [csvPath], [delimiter])

* **`pattern`** `<String>`: File globbing pattern passed to [glob](https://www.npmjs.com/package/glob)
* **`csvPath`** `<String>`: Path to a CSV variables file to load
* **`delimiter`** `<String>`: CSV delimiter

Use:

```js
const coinstacSimulator = require('coinstac-simulator');

module.exports = {
  computationPath: './path/to/computation.js',
  local: coinstacSimulator.createUserData(
    './path/to/data/**/*.txt',
    './path/to/vars.csv'
  ),
};
```

## Publishing Computations

Decentralized computations exist as [GitHub](https://github.com) repositories. They are also valid npm modules (although they don’t need to be published to the registry).

Here’s a checklist:

1. Valid _package.json_:
  * Has a `main` property that points to your decentralized computation
  * `name` and `version` values should equal those in your decentralized computation object. Here’s an easy method for keeping values synced:

    ```js
    const pkg = require('./package.json');

    module.exports = {
      name: pkg.name,
      version: pkg.version,
      local: {
        // ...
      },
      remote: {
        // ...
      },
    };
    ```
2. Exists as a public GitHub repository. (You will need to [sign up for a free account](https://github.com/join) if you don’t already have one.)
3. Create a pull request adding your computation to COINSTAC’s whitelist file, [decentralized-computations.js](https://github.com/MRN-Code/coinstac/blob/master/packages/coinstac-common/src/decentralized-computations.json). Your item should look like:

  ```diff
  - }
  + }, {
  +   "name": "your-computation-name",
  +   "tags": ["x.x.x"],
  +   "url": "https://github.com/your-username/your-repository"
  + }
  ```

  The COINSTAC team will review your computation to ensure it works. If you need help adding your computation fee free to [open a new issue](https://github.com/MRN-Code/coinstac/issues/new).

## Examples

* [bisect-converge](https://github.com/MRN-Code/coinstac-example-computation-bisect-converge)
* [computation-error-handled](https://github.com/MRN-Code/coinstac/tree/master/packages/coinstac-decentralized-algorithm-integration/src/decentralized/computation-error-handled)
* [group-add](https://github.com/MRN-Code/coinstac/tree/master/packages/coinstac-decentralized-algorithm-integration/src/decentralized/group-add)
* [plugin-group-step-seeder](https://github.com/MRN-Code/coinstac/tree/master/packages/coinstac-decentralized-algorithm-integration/src/decentralized/plugin-group-step-seeder)
* [plugin-group-step](https://github.com/MRN-Code/coinstac/tree/master/packages/coinstac-decentralized-algorithm-integration/src/decentralized/plugin-group-step)
* [process-dir](https://github.com/MRN-Code/coinstac/tree/master/packages/coinstac-decentralized-algorithm-integration/src/decentralized/process-dir)
* [process-files](https://github.com/MRN-Code/coinstac/tree/master/packages/coinstac-decentralized-algorithm-integration/src/decentralized/process-files)
