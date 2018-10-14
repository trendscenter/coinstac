'use strict';

const { noop } = require('lodash');
const { spy } = require('sinon');
const tape = require('tape');
const inputs = require('../../../../src/models/pipeline/plugins/inputs');

function getHooks() {
  return {
    cancelRun: noop,
    forceSave: spy(),
    isRunCancelled: noop,
  };
}

tape('inputs plugin :: local has no inputs', (t) => {
  const hooks = getHooks();

  t.notOk(
    inputs.preRun.local({}, {}, hooks),
    'doesn\'t return doc'
  );
  t.notOk(hooks.forceSave.called, 'doesn\'t force save');
  t.end();
});

tape('inputs plugin :: local has no local inputs', (t) => {
  const hooks = getHooks();

  t.notOk(
    inputs.preRun.local(
      {},
      {
        pluginState: {
          inputs: ['test'],
        },
      },
      hooks
    ),
    'doesn\'t return doc'
  );
  t.notOk(hooks.forceSave.called, 'doesn\'t force save');
  t.end();
});

tape('inputs plugin :: local has remote and has no local inputs', (t) => {
  const compResult = {};
  const hooks = getHooks();
  const runInput = {
    remoteResult: {
      pluginState: {
        inputs: ['wat'],
      },
    },
  };

  t.equal(
    inputs.preRun.local(
      runInput,
      compResult,
      hooks
    ),
    compResult,
    'returns doc'
  );
  t.equal(
    compResult.pluginState.inputs,
    runInput.remoteResult.pluginState.inputs,
    'sets inputs plugin state on result doc'
  );
  t.ok(hooks.forceSave.called, 'calls force save');
  t.end();
});

tape('inputs plugin :: local has local inputs');

tape('inputs plugin :: remote has inputs', (t) => {
  const hooks = getHooks();

  t.notOk(
    inputs.preRun.remote(
      [],
      {
        pluginState: {
          inputs: [[
            'test',
          ]],
        },
      },
      hooks
    ),
    'doesn\'t return doc'
  );
  t.notOk(hooks.forceSave.called, 'doesn\'t force save');
  t.end();
});

tape('inputs plugin :: no local inputs', (t) => {
  const hooks = getHooks();

  t.notOk(
    inputs.preRun.remote(
      {
        userResults: [{
          pluginState: {},
        }, {
          pluginState: {},
        }],
      },
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

tape('inputs plugin :: local has inputs', (t) => {
  const compResult = {
    pluginState: {},
  };
  const hooks = getHooks();
  const runInputs = {
    userResults: [{
      pluginState: {},
    }, {
      pluginState: {},
    }, {
      pluginState: {
        inputs: ['my', 'great', 'inputs'],
      },
    }],
  };

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
    runInputs.userResults[2].pluginState.inputs,
    'sets runInput to compResult'
  );
  t.ok(hooks.forceSave.called, 'calls force save');
  t.end();
});
