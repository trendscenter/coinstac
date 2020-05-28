const test = require('ava');
const { transformToClient } = require('../src/utils');

test('transformToClient', (t) => {
  const newUser = { _id: 'test', username: 'test', email: 'test@mrn.org' };
  const inputArray = [
    newUser, { ...newUser, id: newUser._id },
  ];

  transformToClient(inputArray);
  transformToClient(newUser);

  t.pass();
});
