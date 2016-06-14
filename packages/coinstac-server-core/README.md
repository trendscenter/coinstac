# COINSTAC Server Core

[ ![Codeship Status for MRN-Code/coinstac-server-core](https://codeship.com/projects/a8196230-f9d0-0133-2f5f-124ad23604b3/status?branch=master)](https://codeship.com/projects/151361) [![Coverage Status](https://coveralls.io/repos/github/MRN-Code/coinstac-server-core/badge.svg?branch=master)](https://coveralls.io/github/MRN-Code/coinstac-server-core?branch=master)


_COINSTAC’s core server functionality._

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

MIT. See [LICENSE](./LICENSE).
