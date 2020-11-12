const test = require('ava');
const { transformToClient } = require('../src/utils');
const plugins = require('../src/plugins');

test('transformToClient', (t) => {
  const inputArray = [
    { _id: 'test1', username: 'test1' },
    { id: 'test2', _id: 'test2', username: 'test2' },
  ];

  const res1 = transformToClient(inputArray);
  t.deepEqual(res1, [
    { id: 'test1', username: 'test1' },
    { id: 'test2', _id: 'test2', username: 'test2' },
  ]);


  const res2 = transformToClient(inputArray[0]);
  t.deepEqual(res2, { id: 'test1', username: 'test1' });
});

test('plugins', (t) => {
  plugins[2].options.graphqlOptions();

  t.is(plugins.length, 3);
});
