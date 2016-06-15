'use strict';

const DecentralizedComputation =
    require('../../src/models/decentralized-computation.js');
const tape = require('tape');

tape('model::DecentralizedComputation constructor errors', t => {
  function factory(options) {
    return new DecentralizedComputation(options);
  }

  t.throws(
        factory.bind(null, {
          local: {},
          remote: {},
          version: '1.0.0',
        }),
        'throws with no name'
    );
  t.throws(
        factory.bind(null, {
          local: {},
          name: 'bananas',
          remote: {},
        }),
        'throws with no version'
    );
  t.throws(
        factory.bind(null, {
          name: 'bananas',
          remote: {},
          version: '1.0.0',
        }),
        'throws with no local'
    );
  t.throws(
        factory.bind(null, {
          local: {},
          name: 'bananas',
          version: '1.0.0',
        }),
        'throws with no remote'
    );
  t.throws(
        factory.bind(null, {
          local: {},
          name: 'bananas',
          remote: {},
          setup: {},
          version: '1.0.0',
        }),
        'throws with bad `setup`'
    );
  t.end();
});

tape('model::DecentralizedComputation constructor', t => {
  t.ok(
        new DecentralizedComputation({
          cwd: './',
          local: {},
          name: 'bananas',
          remote: {},
          repository: {
            url: 'https://github.com/MRN-Code/bananas',
          },
          setup: 'node ./my-setup.js',
          version: '1.0.0',
        })
    );
  t.end();
});
