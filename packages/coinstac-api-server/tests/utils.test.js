/* eslint-disable-next-line import/no-unresolved */
const test = require('ava');
const { transformToClient } = require('../src/utils');

test('transformToClient', (t) => {
  const inputArray = [
    { _id: 'test1', username: 'test1' },
    { id: 'test2', _id: 'test2', username: 'test2' },
    null,
    'test3',
    { id: 'test4', username: 'test4' },
    { _id: 'test5', username: 'test5', meta: { admin: true } },
    {
      id: 'test6',
      _id: 'test6',
      username: 'test6',
      relation: [{ id: 'test1', username: 'test1' }],
    },
  ];

  const res1 = transformToClient(inputArray);
  t.deepEqual(res1, [
    { id: 'test1', _id: 'test1', username: 'test1' },
    { id: 'test2', _id: 'test2', username: 'test2' },
    null,
    'test3',
    { id: 'test4', username: 'test4' },
    {
      _id: 'test5',
      id: 'test5',
      username: 'test5',
      meta: { admin: true },
    },
    {
      id: 'test6',
      _id: 'test6',
      username: 'test6',
      relation: [{ id: 'test1', username: 'test1' }],
    },
  ]);


  const res2 = transformToClient(inputArray[0]);
  t.deepEqual(res2, { id: 'test1', _id: 'test1', username: 'test1' });
});
