# coinstac-simulator

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

COINSTAC simulator for computation runs. [Documentation](http://mrn-code.github.io/coinstac/).

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/packages/coinstac-simulator/media/demo-capture.gif" />

## Installation

Ensure you have [Node.js](https://nodejs.org/) installed. Then, the following command from a shell:

```shell
npm install --global coinstac-simulator
```

## Use

_coinstac-simulator_ contains a command line interface and a Node.js API. Read the [_Computation Development_ guide](https://github.com/MRN-Code/coinstac/blob/master/guides/computation-development.md) for more information on creating decentralized computations and testing them with _coinstac-simulator_.

### CLI

_coinstac-simulator_ has one required flag, `--declaration` (`-d` for short). Use it to designate the location of your declaration file:

```shell
coinstac-simulator -d ./path/to/declaration.js
```

Run `coinstac-simulator --help` for more information on how to use the CLI.

### Programmatic Use

Ensure that a valid _package.json_ exists in your project’s directory (easily create one with `npm init`). Then, add _coinstac-simulator_ as a dependency:

```shell
npm install coinstac-simulator --save
```

_coinstac-simulator_ is now available in your JavaScript modules. Include it using `require`:

```js
// declaration.js
const coinstacSimulator = require('coinstac-simulator');
```

#### coinstacSimulator.createUserData(pattern, [csvPath], [delimiter])

* **`pattern`** `<String>`: File globbing pattern passed to [glob](https://www.npmjs.com/package/glob)
* **`csvPath`** `<String>`: Path to a CSV variables file to load
* **`delimiter`** `<String>`: CSV delimiter
* return: `<Array>` Collection of user data

Synchronously transpose a directory structure into user data suitable for simulation. This method supports a particular directory structure:

```shell
$ tree path/to/data/
path/to/data/
├── user-1
│   └── x
│   │   ├── data-1.txt
│   │   └── data-2.txt
│   └── y
│       ├── data-3.txt
│       └── data-4.txt
└── user-2
  └── x
  │   ├── data-5.txt
  │   └── data-6.txt
  └── y
      ├── data-7.txt
      └── data-8.txt
```

Top-level directories are treated as users; their immediate subdirectories are treated as variable names. The subdirectories’ files’ data are loading into these properties, like so:

```js
[
  // user-1:
  {
    x: [
      // data-1.txt, data-2.txt
    ],
    y: [
      // data-3.txt, data-4.txt
    ],
  },

  // user-2:
  {
    x: [
      // data-5.txt, data-6.txt
    ],
    y: [
      // data-7.txt, data-8.txt
    ],
  },
]
```

Adding a supporting CSV via the `csvPath` argument aids in parsing files:

```csv
user,t,u,v
user-1,1,2,2
user-2,4,5,6
```

`createUserData` is most useful in a declaration file:

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

#### coinstacSimulator.loadFiles(pattern, [delimiter]):

* **`pattern`** `<String>`: File globbing pattern passed to [glob](https://www.npmjs.com/package/glob)
* **`delimiter`** `<String>`: CSV delimiter
* return: `<Array>` Parsed input data

Synchronously loads files' data. `loadFiles` is most useful in a declaration file:

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
};
```

#### coinstacSimulator.run(declarationPath)

* **`declarationPath`** `<String>`: Path to declaration file
* return: `<Promise>` Resolves upon simulator run completion, or rejects with a run error

`run` is _coinstac-simulator_’s programmatic function for running an entire simulation. Use it if you don’t want to use the CLI:

```js
const coinstacSimulator = require('coinstac-simulator');

coinstacSimulator.run('./path/to/declaration.js')
  .then(() => console.log('Simulation run complete!'))
  .catch(error => console.error('Simulation run failed!', error));
```

## Debugging

Set the `verbose` property in your declaration to `true`:

```js
// declaration.js
module.exports = {
  computationPath:
  local: [
    // ...
  ],
  verbose: true,
};
```

This ensures that all `console.log`s in your JavaScript computations and stdout/stderr writes in your command computations will persist to the main process’s logger and your terminal.

View the [_Computation Development_ guide](https://github.com/MRN-Code/coinstac/blob/master/guides/computation-development.md) for more information on computations in COINSTAC.

## License

MIT. See [LICENSE](./LICENSE) for details.
