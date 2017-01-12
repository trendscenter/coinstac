'use strict';

const helpers = require('../src/helpers.js');
const path = require('path');
const tape = require('tape');

tape('helpers :: getPackage', (t) => {
  t.plan(1);

  helpers.getPackage(path.resolve(__dirname, '..'))
    .then((pkg) => {
      t.equal(
        pkg.name,
        'coinstac-computation-registry',
        'returns package.json contents'
      );
    })
    .catch(t.end);
});
