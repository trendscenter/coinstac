'use strict';

const cp = require('child_process');
const EventEmitter = require('events');
const sinon = require('sinon');
const tape = require('tape');
const {
  models: {
    computation: { CommandComputation },
  },
} = require('../../../');

tape('model::CommandComputation constructor', (t) => {
  t.throws(() => {
    return new CommandComputation({ type: 'function' });
  }, /cmd/, 'requires type: "cmd"');

  t.throws(() => {
    return new CommandComputation({ type: 'cmd', cmd: 'test' });
  }, /cwd/, 'throws without cwd');

  t.end();
});

function getStubbedCommand() {
  const command = new EventEmitter();
  command.stderr = new EventEmitter();
  command.stdout = new EventEmitter();
  return command;
}

tape('CommandComputation#run', (t) => {
  const args = ['some', 'crazy', 'arguments'];
  const command = getStubbedCommand();
  const cmd = 'oh-my-executables';
  const cwd = 'rando-directory';
  const opts = {
    will: 'this make',
    some: 'pretty json?',
  };
  const spawnStub = sinon.stub(cp, 'spawn').returns(command);
  const stderr = [
    'a penny for ',
    'your errors',
  ];
  const stdout = [
    '{ "when": "the data comes ',
    'a knockin", "dont": "worry',
    ' too much about it" }',
  ];

  t.plan(3);

  const run1 = CommandComputation.prototype.run.call({
    cmd,
    cwd,
    isVerbose: true,
  }, opts);

  stderr.forEach(data => command.stderr.emit('data', data));
  stdout.forEach(data => command.stdout.emit('data', data));
  command.emit('exit', 0);

  run1
    .then((response) => {
      t.ok(
        spawnStub.calledWithExactly(
          cmd,
          ['--run', JSON.stringify(opts)],
          { cwd }
        ),
        'spawns with expected params'
      );
      t.deepEqual(
        response,
        JSON.parse(stdout.join('')),
        'returns stdout response'
      );

      const run2 = CommandComputation.prototype.run.call({
        args,
        cmd,
        cwd,
        isVerbose: false,
      }, opts);
      command.emit('exit', 0);

      return run2;
    })
    .then(() => {
      t.deepEqual(
        spawnStub.lastCall.args[1],
        args.concat(['--run', JSON.stringify(opts)]),
        'adds class args property to spawn params'
      );
    })
    .catch(t.end)
    .then(spawnStub.restore);
});

tape('CommandComputation#run verbose logging', (t) => {
  const args = ['some', 'silly', 'arguments'];
  const cmd = 'macho';
  const command = getStubbedCommand();

  /**
   * @todo Don't spy on console methods! Figure out how to inject the logger and
   * spy on it.
   */
  const consoleSpy = sinon.spy(console, 'error');
  const error1 = 'A very dangerous error';
  const error2 = 'Things are cooling up';
  const spawnStub = sinon.stub(cp, 'spawn').returns(command);

  const run1 = CommandComputation.prototype.run.call({
    args,
    cmd,
    verbose: true,
  });

  command.stderr.emit('data', error1);
  command.emit('exit', 1);

  t.plan(4);

  run1
    .catch(() => {
      t.ok(
        consoleSpy.firstCall.args[0].indexOf(`${cmd} ${args.join(' ')}`) > -1,
        'logs command'
      );
      t.ok(
        consoleSpy.secondCall.args[0].message.indexOf(error1) > -1,
        'logs stderr'
      );

      const run2 = CommandComputation.prototype.run.call({
        args,
        cmd,
        verbose: true,
      });
      command.emit('exit', 0);

      return run2;
    })
    .then(() => {
      t.equal(consoleSpy.callCount, 2, 'doesn\'t log with no stderr');

      const run3 = CommandComputation.prototype.run.call({
        args,
        cmd,
        verbose: true,
      });
      command.stderr.emit('data', error2);
      command.emit('exit', 0);

      return run3;
    })
    .then(() => {
      t.equal(
        consoleSpy.lastCall.args[0],
        error2,
        'logs with stderr'
      );
    })
    .catch(t.end)
    .then(() => {
      consoleSpy.restore();
      spawnStub.restore();
    });
});

tape('CommandComputation#run errors', (t) => {
  const command = getStubbedCommand();
  const error1 = { message: 'error 1' };
  const error2 = { message: 'error 2' };
  const spawnStub = sinon.stub(cp, 'spawn').returns(command);

  spawnStub.onCall(0).throws(error1);

  t.plan(4);

  CommandComputation.prototype.run.call({})
    .then(() => t.fail('Resolves when spawn throws'))
    .catch((error) => {
      t.equal(error, error1, 'Rejects when spawn throws');

      const run = CommandComputation.prototype.run.call({});
      command.emit('error', error2);

      return run;
    })
    .then(() => t.fail('Resolves when command emits error'))
    .catch((error) => {
      t.equal(error, error2, 'Rejects when command emits error');

      const run = CommandComputation.prototype.run.call({});
      command.emit('exit', 'random-exit-code');

      return run;
    })
    .then(() => t.fail('Resolves with process exits with non-zero'))
    .catch((error) => {
      t.ok(
        error.message.indexOf('random-exit-code') > -1,
        'Rejects with non-zero exit code'
      );

      const run = CommandComputation.prototype.run.call({});

      command.stdout.emit('data', '{ "some": "particularly",\n"ugly": json }');
      command.emit('exit', 0);

      return run;
    })
    .then(() => t.fail('Resolves with malformed JSON'))
    .catch((error) => {
      t.ok(
        error.message.indexOf('"ugly": json') > -1,
        'Rejects with malformed JSON'
      );
    })
    .then(spawnStub.restore);
});
