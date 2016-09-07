# COINSTAC Server Core

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

COINSTAC core server functionality. [Documentation](http://mrn-code.github.io/coinstac/).

## Install

Install in your project to use programmatically:

```shell
npm install coinstac-server-core --save
```

Or, install globally for easy CLI use:

```shell
npm install coinstac-server-core
```

## Usage

Official API documentation may be found [here](http://mrn-code.github.io/coinstac-server-core/).

### Programmatically

This library has one chief export, a `server` function:

```js
const coinstacServerCore = require('coinstac-server-core');

constacServerCore({
  // External database URL:
  dbUrl: 'https://my-cloud.cloudant.com/',

  // Keep local docs memory (using memdown):
  inMemory: true,

  // Seed the consortia database:
  seed: [{/*...*/}, {/*...*/}]
})
  .then(remotePipelineRunnerPoolInstance => { ... })
  .catch(error => console.error(error));
```

### CLI

Use the `coinstac-server-core` utility. Pass the `--help` flag to see all the options:

```shell
$ coinstac-server-core --help

  Usage: coinstac-server-core [options]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -db, --database [value]  Database connection string
    -m, --memory             Use in-memory database
    -s, --seed [value]       Seed the consortia database

  Databases:

    Specify the CouchDB database connection as a URL string:

    $ coinstac-server-core --database http://localhost:5984

    Seeding:

    Pass the '--seed' flag to use the built-in seed documents. You may also pass
    in the path to your custom consortia JSON file:

    $ coinstac-server-core --seed ./path/to/my/docs.json
```

## License

MIT. See [LICENSE](./LICENSE) for details.
