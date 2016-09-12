'use-strict';

const tape = require('tape');
const fileLoader = require('../src/file-loader.js');

tape('Loads a text glob to a variable', t => {
  t.plan(1);
  const data = fileLoader.loadFiles('./test/Test Data/M1/**/*.txt');
  t.deepEqual(data, ['1', '2.2', '4', '5', '11', '21.2', '41', '51']);
});

tape('Loads a json glob to a variable', t => {
  t.plan(1);
  const data = fileLoader.loadFiles('./test/Test Data/M1/**/*.json');
  t.deepEqual(data, [3, 4, 55, 6.6, 9, 9, 99, 9.9]);
});

tape('Loads a mixed type glob to a variable', t => {
  t.plan(1);
  const data = fileLoader.loadFiles('./test/Test Data/M1/**/*(*.txt|*.json)');
  t.deepEqual(data, [3, 4, 55, 6.6, '1', '2.2', '4', '5', 9, 9, 99, 9.9, '11', '21.2', '41', '51']);
});

tape('Loads a text glob with a custom delimiter', t => {
  t.plan(1);
  const data = fileLoader.loadFiles('./test/Test Data/M1/**/delim*', '$');
  t.deepEqual(data, ['1', '2', '3', '5']);
});

tape('Loads a text glob with newline delimiter', t => {
  t.plan(1);
  const data = fileLoader.loadFiles('./test/Test Data/M1/**/newlinedelim*', '\n');
  t.deepEqual(data, ['4', '5', '6', '7', '8']);
});

tape('Creates userData objects from a directory structure', t => {
  t.plan(1);
  const data = fileLoader.createUserData('./test/Test Data/**/*.txt');
  t.deepEqual(data, [
    { x: ['1', '2.2', '4', '5'], y: ['11', '21.2', '41', '51'] },
    { x: ['122', '2123', '33.2', '75'], y: ['3', '3.666', '53', '443'] },
  ]);
});

tape('Add optional CSV vars to parsed userData', t => {
  t.plan(1);
  const data = fileLoader.createUserData('./test/Test Data/**/*.txt', './test/Test Data/vars.csv');
  t.deepEqual(data, [
    {
      x: ['1', '2.2', '4', '5'],
      y: ['11', '21.2', '41', '51'],
      w: '1',
      c: '2',
      a: '3',
    },
    {
      x: ['122', '2123', '33.2', '75'],
      y: ['3', '3.666', '53', '443'],
      w: '44',
      c: '55',
      a: '33',
    },
  ]);
});

tape('only with CSV data', t => {
  t.plan(1);
  const data = fileLoader.createUserData(null, './test/Test Data/vars.csv');
  t.deepEqual(data, [
    {
      w: '1',
      c: '2',
      a: '3',
    },
    {
      w: '44',
      c: '55',
      a: '33',
    },
  ]);
});
