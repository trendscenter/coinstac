'use strict';

const inputs = require('../../../../src/models/pipeline/plugins/inputs');
const { noop } = require('lodash');
const { spy } = require('sinon');
const tape = require('tape');

function getHooks() {
  return {
    cancelRun: noop,
    forceSave: spy(),
    isRunCancelled: noop,
  };
}

tape('inputs plugin :: remote has inputs', t => {
  const hooks = getHooks();

  t.notOk(
    inputs.preRun.remote(
      [],
      {
        pluginState: {
          inputs: [],
        },
      },
      hooks
    ),
    'doesn\'t return doc'
  );
  t.notOk(hooks.forceSave.called, 'doesn\'t force save');
  t.end();
});

tape('inputs plugin :: no local inputs', t => {
  const hooks = getHooks();

  t.notOk(
    inputs.preRun.remote(
      [{
        pluginState: {},
      }, {
        pluginState: {},
      }],
      {
        pluginState: {},
      },
      hooks
    ),
    'doesn\'t return doc'
  );
  t.notOk(hooks.forceSave.called, 'doesn\'t force save');
  t.end();
});

tape('inputs plugin :: local has inputs', t => {
  const compResult = {
    pluginState: {},
  };
  const hooks = getHooks();
  const runInputs = [{
    pluginState: {},
  }, {
    pluginState: {},
  }, {
    pluginState: {
      inputs: ['my', 'great', 'inputs'],
    },
  }];

  t.equal(
    inputs.preRun.remote(
      runInputs,
      compResult,
      hooks
    ),
    compResult,
    'returns doc'
  );
  t.equal(
    compResult.pluginState.inputs,
    runInputs[2].pluginState.inputs,
    'sets runInput to compResult'
  );
  t.ok(hooks.forceSave.called, 'calls force save');
  t.end();
});
