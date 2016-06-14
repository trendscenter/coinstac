# coinstac-common

[![Codeship Status for MRN-Code/coinstac-common](https://codeship.com/projects/16e32b80-ace4-0133-af8d-1e5da553331a/status?branch=master)](https://codeship.com/projects/131838) [![Coverage Status](https://coveralls.io/repos/github/MRN-Code/coinstac-common/badge.svg?branch=master)](https://coveralls.io/github/MRN-Code/coinstac-common?branch=master)

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac-common/master/img/coinstac.png" height="75px" />

**COINSTAC utilities and models**

`coinstac-common` is intended to be consumed internally by other COINSTAC packages, although makes no use-case assumptions.  this package simply exports commonly used models, classes, and services used to support COINSTAC operations.

<a href="https://github.com/MRN-Code/coinstac-common">.: browse code on github :.</a>

# usage
See the [official API docs](http://mrn-code.github.io/coinstac-common/index.html) (or source!) for full library capability.

Example:
```js
const common = require('./');
const Pipeline = common.models.pipeline.Pipeline;
const CommandComputation = common.models.computation.CommandComputation;
const pipeline = new Pipeline({
  computations: [
    new CommandComputation({
      cwd: '/tmp',
      type: 'cmd',
      cmd: 'python',
      args: ['-c', 'import json; print json.dumps({ "foo": "bar" });']
    })
  ]
});
pipeline.run((err, rslt) => console.log(rslt)); // ==> { foo: 'bar' }
```
