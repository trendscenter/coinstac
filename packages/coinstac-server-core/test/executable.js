'use strict';

const concatStream = require('concat-stream');
const mockConsortiumDocs = require('./mocks/consortium-docs.json');
const path = require('path');
const spawn = require('child_process').spawn;
const tape = require('tape');

const executable = path.join(__dirname, '..', 'bin', 'coinstac-server-core');

/** Fail when a child process writes to stderr */
function failStderr(stderr, t) {
  stderr.pipe(concatStream((data) => {
    if (data.toString()) {
      t.end('writes to stderr');
    }
  }));
}

tape('executable works', (t) => {
  t.plan(2);

  try {
    const child = spawn(executable);
    const errorExit = (exitCode) => { t.notOk(exitCode, 'exited with non-error'); };
    child.on('close', errorExit);
    child.on('error', errorExit);

    child.stdout.once('data', (data) => {
      t.ok(
        data.toString().toLowerCase().indexOf('starting server') !== -1,
        'has startup message'
      );
      child.kill();
    });

    failStderr(child.stderr, t);
  } catch (err) {
    t.end(err.message);
  }
});

/**
 * @todo  There's currently no way to meaningfully ensure command line arguments
 * are proxied. Figure out how to test.
 */
tape.skip('it converts flags to config', (t) => {
  t.plan(2);

  const port = 12345;
  const child = spawn(executable, [
    '--database',
    `http://localhost:${port}/`,
    '--seed',
    JSON.stringify(mockConsortiumDocs),
    '--memory',
  ]);

  child.stdout.pipe(concatStream((data) => {
    t.ok(data);
    child.kill();
  }));

  failStderr(child.stderr, t);

  child.on('close', (exitCode) => {
    t.notOk(exitCode, 'process exits');
  });
});

tape('process exits on error', (t) => {
  t.plan(2);

  // Passing a bad seed causes the server to error/reject
  const child = spawn(executable, [
    '--memory',
    '--seed',
    'such bogus seed data',
  ]);

  child.stderr.pipe(concatStream((data) => {
    t.ok(data.toString(), 'writes error');
  }));

  child.on('close', (exitCode) => {
    t.ok(exitCode, 'exits with non-zero');
  });
});
