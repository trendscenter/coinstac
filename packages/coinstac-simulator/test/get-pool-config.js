'use strict';

const coinstacComputationRegistry = require('coinstac-computation-registry');
const common = require('coinstac-common');
const getPoolConfig = require('../src/utils/get-pool-config');
const path = require('path');
const tape = require('tape');

tape('gets valid pool configuration', t => {
  const computationPath = path.join(__dirname, 'mocks', 'exec-computation.js');

  t.plan(2);

  getPoolConfig({
    computationPath,
    isLocal: false,
  })
    .then(config => {
      t.ok(
        (
          'computationRegistry' in config &&
          config.computationRegistry instanceof
            coinstacComputationRegistry.ComputationRegistry
        ),
        'returns computation registry'
      );
      t.ok(
        (
          'dbRegistry' in config &&
          config.dbRegistry instanceof common.services.dbRegistry.DBRegistry
        ),
        'returns database registry'
      );
    })
    .catch(t.end);
});
