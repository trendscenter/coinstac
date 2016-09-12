# coinstac-common

<img src="https://raw.githubusercontent.com/MRN-Code/coinstac/master/img/coinstac.png" height="75px">

COINSTAC core functionality. [Documentation](http://mrn-code.github.io/coinstac/).

**COINSTAC utilities and models**

`coinstac-common` is intended to be consumed internally by other COINSTAC packages, although makes no use-case assumptions.  this package simply exports commonly used models, classes, and services used to support COINSTAC operations.

# usage

See the [official API docs](http://mrn-code.github.io/coinstac/coinstac-common/index.html) (or source!) for full library capability.

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

## License

MIT. See [LICENSE](./LICENSE) for details.
