# Computation Development

_This guide will walk through basic algorithm development in the COINSTAC ecosystem. It is intended for algorithm authors and developers._

**Table Of Contents:**

* [Basic Overview of COINSTAC System](#basic-overview-of-coinstac-system)
* [Setting Up Your Environment](#setting-up-your-environment)
* [How to Create a Computation](#how-to-create-a-computation)
* [Testing Computations](#testing-computations)
* [Publishing Computations](#publishing-computations)
* [Examples](#examples)

## Basic Overview of COINSTAC System

COINSTAC is an ecosystem for running decentralized algorithms with many clients. It uses a client-server model: while arbitrary calculations can run on clients and servers, the system’s primary use case is [differential privacy](https://en.wikipedia.org/wiki/Differential_privacy), where clients run algorithms with data to ensure their privacy. Clients submit their anonymized results to the server, which amalgamates clients’ data and performs interesting computations, such as averaging, modeling, etc.

COINSTAC’s core is written entirely in JavaScript; writing an algorithm requires writing an entry point in this language.
 However, the system is robust enough to support algorithms in any language.

| Alpha Warning |
| ------------- |
| It’s important to note that *COINSTAC is alpha software*: its rough around the edges. If you have a question or locate a bug please **[open an issue](https://github.com/MRN-Code/coinstac/issues/new)**. |

## Setting Up Your Environment

_It is recommended that you develop in a UNIX-like environment, such as Mac OS X or Linux. While Windows support is planned, it poses several difficulties for algorithm authorship at this time._

Here’s what you’ll need to get up and running with COINSTAC:

1. **Node.js and NPM:** You’ll need version 6.x.x of the JavaScript runtime to develop for COINSTAC. The easiest way to get it is to [download it via the website](https://nodejs.org/en/download/). Alternatively, you can use [Node Version Manager](https://github.com/creationix/nvm) or [n](https://www.npmjs.com/package/n) to maintain multiple versions of Node.js on the same machine.
2. **coinstac-simulator:** This will assist in testing your algorithms in the COINSTAC ecosystem. To install, run from a shell:

    ```shell
    npm install --global coinstac-simulator
    ```

## How to Create a Computation

Computations in COINSTAC, referred to as a “decentralized computations” throughout code, are sets of commands for clients (referred to as “local”) and a central server (referred to as “remote”). These instructions are encapsulated in a JavaScript file that uses a CommonJS export object. Here’s a basic example:

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
* **`remote`** `<Object>` | `<Array>`: Code run on the server.

Definitions also support additional, optional properties (see [Pipelines](#pipelines) and [Plugins](#plugins)).

### Commands

The `local` and `remote` values above are a special type of object, which COINSTAC recognizes as a “command,” or an atomic operation to be performed on a client or server. COINSTAC currently supports two types of commands:

#### JavaScript Commands

COINSTAC executes these commands in its own Node.js context:

```js
{
  type: 'function',
  fn: function(params) {

  },
}
```

* **`type`** `<String>`: Must be `function`, which specifies a “JavaScript”-type command.
* **`fn`** `<Function>`: Function to call. See [Command Parameters](#command-parameters) for documentation on passed arguments.
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

#### Non-JavaScript Commands

COINSTAC has a second type of command that allows algorithm developers to integrate any script they can dream of:

```js
{
  type: 'cmd',
  cmd: 'python',
  args: ['./path/to/my/script.py'],
  verbose: true,
}
```

* **`type`** `<String>`: Must be `cmd`, which specifies a non-JavaScript-type command.
* **`cmd`** `<String>`: Executable to use.
* **`args`** `<Array>`: Arguments to pass to the executable.
* **`verbose`** `<Boolean>`: Whether to output the computation’s output to stdout.

The command spawns a new process, in the above case with Python, and executes with the arguments in the `args` array. The above example is analogous to running from a shell:

```shell
python ./path/to/my/script.py
```

Pass additional flags and parameters to a script by adding them to the `args` array:

```js
{
  type: 'cmd',
  cmd: 'python',
  args: [
    './path/to/my/script.py',
    '--some',
    '--flags',
    '--value=100',
    '--other-value',
    '200'
  ],
  verbose: true,
}
```

This equates to:

```shell
pyton ./path/to/my/script.py --some --flags --value=100 --other-value 200
```

COINSTAC will serialize input parameters as JSON and pass them as the last argument to the executable (see [Command Parameters](#command-parameters)).

##### Returning Data

It’s important that your script **only output valid JSON** via stdout; otherwise, COINSTAC will throw an error. You can test your script by [installing `jq`](https://stedolan.github.io/jq/) and running:

```shell
python ./path/to/my/script.py | jq .
```

This should alert you to invalid JSON. Be sure to replace `python ./path/to/my/script.py` to your appropriate command.

You may also need to pass JSON to your script to simulate its use within COINSTAC. Do so using the `--run` flag. The following shows an example COINSTAC data structure passed to a local script in bash:

```shell
SAMPLE_DATA='{
  "computationId": "test",
  "consortiumId": "test",
  "previousData": [],
  "remoteResult": {
    "computationId": "test",
    "complete": false,
    "consortiumId": "test",
    "usernames": ["test"],
    "userErrors": [],
    "data": null,
    "error": null,
    "history": [],
    "pipelineState": {
      "step": 0,
      "inProgress": true
    }
  },
  "username": "test",
  "userData": null
}'
python ./path/to/my/script.py --run $SAMPLE_DATA | jq .
```

See [Command Parameters](#command-parameters) for documentation on COINSTAC data shapes.

##### Returning An Error

Write to stderr if you need to raise an exception. COINSTAC will detect this and mark the command result as an error.

#### Marking As Completing

Marking a command as “complete” allows COINSTAC to progress to the next command in your pipeline. To do so, add a `complete` property the returned JSON data and mark it as `true`:

```js
{
  type: 'function',
  fn: function alwaysMarksComplete(params) {
    const data = params.previousData || {};
    data.complete = true;

    return data;
  },
}
```

### Command Parameters

Commands – both JavaScript and non-JavaScript – receive parameters from COINSTAC. The parameters’ shape depends on whether the command is intended for use with clients (`local`) or the server (`remote`).

#### Local Parameters

A JavaScript object containing the following properties and values is passed to local commands:

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

A JavaScript object containing the following properties and values is passed to remote command:

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

Commands can be strung together to form a “pipeline,” or a collection of discrete steps. These differ from [traditional sequential Pipeline](https://en.wikipedia.org/wiki/Pipeline_(computing)) in a few ways:

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
    // First command:
    {
      type: 'function',
      fn: function(params) {
        // ...
      },
    },

    // Second command:
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

The only plugin currently available is *group-step*. It is a flow control modifier that ensures that all clients have completed a command “step” before passing control back to the server.

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

_coinstac-simulator_ comes with two utility methods to assist in loading your data. To use them you’ll need to set up a module with a [_package.json_ via NPM](https://docs.npmjs.com/getting-started/using-a-package.json). Consult the [_coinstac-simulator_ Readme](https://github.com/MRN-Code/coinstac/tree/master/packages/coinstac-simulator#programmatic-use) for setup instructions and API documentation.

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
