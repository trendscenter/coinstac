const test = require('ava');
const { getOnlineUsers } = require('../src/data/user-online-status-tracker');
const { eventEmitter, WS_CONNECTION_STARTED, WS_CONNECTION_TERMINATED } = require('../src/data/events');

test('getOnlineUsers', (t) => {
  eventEmitter.emit(WS_CONNECTION_STARTED, 'connection-1', 'user-1');
  eventEmitter.emit(WS_CONNECTION_STARTED, 'connection-2', 'user-2');

  eventEmitter.emit(WS_CONNECTION_TERMINATED, 'connection-1');

  const res = getOnlineUsers();

  t.deepEqual(res, { 'user-2': true });
});
