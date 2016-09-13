'use strict';

const bootClients = require('../src/boot-clients');
const bootComputeServers = require('../src/boot-compute-servers');
const coinstacSimulator = require('../src/index');
const dbServer = require('../src/db-server');
const EventEmitter = require('events');
const fs = require('fs');
const { noop } = require('lodash');
const mockery = require('mockery');
const path = require('path');
const sinon = require('sinon');
const tape = require('tape');

tape('gets declaration by path :: errors', t => {
  const getDeclaration = coinstacSimulator.getDeclaration;
  const statStub = sinon.stub(fs, 'stat').yields(null, {
    isFile: () => true,
    isDirectory: () => false,
  });

  statStub.onCall(1).yields(null, {
    isFile: () => false,
    isDirectory: () => false,
  });

  t.plan(11);

  mockery.enable();
  mockery.registerMock('non-object', 'random-string');
  mockery.registerMock('no-computation-path', {});
  mockery.registerMock('bad-computation-path', {
    computationPath: null,
  });
  mockery.registerMock('no-local', {
    computationPath: 'bonkers',
  });
  mockery.registerMock('bad-local', {
    computationPath: 'heyo',
    local: 'suppp',
  });
  mockery.registerMock('empty-local', {
    computationPath: 'supp',
    local: [],
  });
  mockery.registerMock('bad-remote', {
    computationPath: 'wat',
    local: ['memes'],
    remote: 'kittens',
  });

  getDeclaration()
    .then(
      () => t.fail('Resolves without declaration path'),
      error => {
        t.ok(
          error.message.indexOf('declaration path string') > -1,
          'Rejects without declaration path'
        );
        return getDeclaration('./path/to/bogus/declaration.js');
      }
    )
    .then(
      () => t.fail('Resolves with bad declaration path'),
      error => {
        t.ok(
          error.message.indexOf('./path/to/bogus/declaration.js') > -1,
          'Rejects with bad declaration path'
        );
        return getDeclaration('non-object');
      }
    )
    .then(
      () => t.fail('Resolves with non-file non-dir declaration'),
      error => {
        t.ok(
          error.message.indexOf('Couldn\'t find declaration') > -1,
          'Resolves with non-file non-dir declaration'
        );
        return getDeclaration('non-object');
      }
    )
    .then(
      () => t.fail('Resolves with non-object declaration'),
      error => {
        t.ok(
          error.message.indexOf('object'),
          'Rejects with non-object declaration'
        );
        return getDeclaration('no-computation-path');
      }
    )
    .then(
      () => t.fail('Resolves with no computation path in declaration'),
      error => {
        t.ok(
          error.message.indexOf('\'computationPath\' property') > -1,
          'Rejects with no computation path declaration'
        );
        return getDeclaration('bad-computation-path');
      }
    )
    .then(
      () => t.fail('Resolves with bad computation path in declaration'),
      error => {
        t.ok(
          error.message.indexOf('\'computationPath\' property') > -1,
          'Rejects with bad computation path in declaration'
        );
        return getDeclaration('no-local');
      }
    )
    .then(
      () => t.fail('Resolves with no local property in declaration'),
      error => {
        t.ok(
          error.message.indexOf('\'local\' array') > -1,
          'Rejects with no local property in declaration'
        );
        return getDeclaration('bad-local');
      }
    )
    .then(
      () => t.fail('Resolves with bad local property in declaration'),
      error => {
        t.ok(
          error.message.indexOf('have a \'local\' array') > -1,
          'Rejects with bad local property in declaration'
        );
        return getDeclaration('empty-local');
      }
    )
    .then(
      () => t.fail('Resolves with empty local array in declaration'),
      error => {
        t.ok(
          error.message.indexOf('have items in \'local\' array') > -1,
          'Rejects with empty local array in declaration'
        );
        return getDeclaration('bad-remote');
      }
    )
    .then(
      () => t.fail('Resolves with bad remote property in declaration'),
      error => {
        t.ok(
          error.message.indexOf('\'remote\' value to be an object') > -1,
          'Rejects with bad remote property in declaration'
        );
        return getDeclaration('bad-remote');
      }
    )
    .then(
      () => t.fail('Resolves with bad remote property in declaration'),
      error => {
        t.ok(
          error.message.indexOf('\'remote\' value to be an object') > -1,
          'Rejects with bad remote property in declaration'
        );
      }
    )
    .catch(t.end)
    .then(() => {
      mockery.disable();
      statStub.restore();
    });
});

tape('gets declaration by path :: declaration rejections', t => {
  const getDeclaration = coinstacSimulator.getDeclaration;

  t.plan(2);

  getDeclaration(path.join(__dirname, 'mocks', 'bad-local.js'))
    .then(
      () => t.fail('Resolves with rejecting local value in declaration'),
      error => {
        t.equal(error, 'bye', 'rejects with local value rejection');
        return getDeclaration(path.join(__dirname, 'mocks', 'bad-remote.js'));
      }
    )
    .then(
      () => t.fail('Resolves with rejecting remote value in declaration'),
      error => {
        t.equal(error, 'pikachu', 'Rejects with remote value rejection');
      }
    )
    .catch(t.end);
});

tape('gets declaration by path', t => {
  const getDeclaration = coinstacSimulator.getDeclaration;

  t.plan(5);

  getDeclaration(
    path.join(__dirname, 'mocks', 'good-declaration-1.js')
  )
    .then(declaration => {
      t.deepEqual(
        declaration,
        {
          computationPath: path.resolve(
            __dirname,
            'mocks/path/to/computation.js'
          ),
          local: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
          remote: undefined,
          verbose: false,
        },
        'expands local items via Array constructor'
      );

      return getDeclaration(
        path.join(__dirname, 'mocks', 'good-declaration-2.js')
      );
    })
    .then(declaration => {
      t.equal(
        declaration.computationPath,
        path.resolve(
          __dirname,
          'mocks/path/to/computation.js'
        ),
        'passes resolved computation path'
      );
      t.deepEqual(
        declaration.local,
        [{
          x: 'how',
          y: 'who',
        }],
        'passes resolved local'
      );
      t.deepEqual(
        declaration.remote,
        {
          x: 'where',
          y: 'why',
        },
        'passes resolved remote'
      );
      t.equal(declaration.verbose, true, 'passes verbose');
    })
    .catch(t.end);
});

tape('gets usernames', t => {
  const usernames = coinstacSimulator.getUsernames(10);

  t.ok(
    (
      Array.isArray(usernames) &&
      usernames.length === 10 &&
      usernames.every(u => u && typeof u === 'string')
    ),
    'gets an array of usernames'
  );
  t.ok(
    usernames.every((u, i) => {
      return usernames.slice(0, i).concat(usernames.slice(i + 1))
        .indexOf(u) < 0;
    }),
    'every username is unique'
  );
  t.end();
});

tape('runs declaration :: errors', t => {
  /* eslint-disable no-use-before-define */
  const clients = [getMockProcess(), getMockProcess()];
  /* eslint-enable no-use-before-define */
  const computationPath = './path/to/computation.js';
  const declaration = {
    computationPath,
    local: [{
      x: 1,
    }, {
      x: 2,
    }],
    remote: {
      hello: 'there',
      how: 'are you?',
    },
    verbose: true,
  };
  const declarationPath = 'greatest-declaration.js';
  const servers = [getMockProcess()]; // eslint-disable-line no-use-before-define
  const usernames = ['dude', 'dudette'];

  function getMockProcess() {
    const mockProcess = new EventEmitter();

    mockProcess.kill = noop;
    mockProcess.sendSpy = sinon.spy();
    mockProcess.send = function send(arg) {
      mockProcess.sendSpy(arg);
      if ('teardown' in arg && arg.teardown) {
        mockProcess.emit('message', { toredown: true });
      } else if ('kickoff' in arg && arg.kickoff) {
        // Force coinstacSimulator#teardown
        process.nextTick(() => servers[0].emit('exit'));
      }
    };

    return mockProcess;
  }

  const bootComputeServersStub = sinon.stub(bootComputeServers, 'run')
    .returns(Promise.resolve(servers));
  const bootClientsStub = sinon.stub(bootClients, 'run')
    .returns(Promise.resolve(clients));
  const getDeclarationStub = sinon.stub(coinstacSimulator, 'getDeclaration')
    .returns(Promise.resolve(declaration));
  const getUsernamesStub = sinon.stub(coinstacSimulator, 'getUsernames')
    .returns(usernames);
  const setupStub = sinon.stub(dbServer, 'setup').returns(Promise.resolve());
  const teardownStub = sinon.stub(dbServer, 'teardown')
    .returns(Promise.resolve());

  t.plan(8);

  coinstacSimulator.run(declarationPath)
    .then(() => {
      t.ok(
        bootComputeServersStub.calledWithExactly({
          computationPath,
          data: declaration.remote,
          verbose: declaration.verbose,
        }),
        'calls boot servers with params'
      );
      t.ok(
        bootClientsStub.calledWithExactly({
          computationPath,
          users: [{
            data: declaration.local[0],
            username: usernames[0],
          }, {
            data: declaration.local[1],
            username: usernames[1],
          }],
          verbose: declaration.verbose,
        }),
        'calls boot clients with params'
      );
      t.ok(
        getDeclarationStub.calledWithExactly(declarationPath),
        'gets declaration'
      );
      t.deepEqual(
        setupStub.firstCall.args[0],
        { computationPath, usernames },
        'sets up database with params'
      );
      t.ok(getUsernamesStub.calledWithExactly(2), 'gets usernames');
      t.ok(
        clients.every(c => c.sendSpy.calledWithExactly({ kickoff: true })),
        'kicks off every client'
      );
      t.ok(teardownStub.callCount, 'calls db teardown');
      t.ok(
        clients.every(c => c.sendSpy.calledWithExactly({ teardown: true })),
        'kills every client'
      );
    })
    .catch(t.end)
    .then(() => {
      bootComputeServersStub.restore();
      bootClientsStub.restore();
      getUsernamesStub.restore();
      getDeclarationStub.restore();
      setupStub.restore();
      teardownStub.restore();
    });
});

tape('sets commands\' cwd', t => {
  t.plan(1);

  coinstacSimulator.run(path.resolve(__dirname, 'mocks/exec-declaration.js'))
    .then(() => {
      t.pass('resolves!');
    })
    .catch(t.end);
});
