const {
  eventEmitter,
  WS_CONNECTION_STARTED,
  WS_CONNECTION_TERMINATED,
  USER_CONNECTION_CHANGED,
} = require('./events');

// A map that stores the current ws connections on the server.
// key: ws connection id
// value: id of the connected user
const connections = new Map();

function getOnlineUsers() {
  const usersArray = [...connections.values()];

  return usersArray.reduce((aggregate, user) => {
    aggregate[user] = true;
    return aggregate;
  }, {});
}

function wsConnectionStarted(connectionId, userId) {
  connections.set(connectionId, userId);
  eventEmitter.emit(USER_CONNECTION_CHANGED, {
    usersOnlineStatusChanged: getOnlineUsers(),
    userId,
  });
}

function wsConnectionTerminated(connectionId) {
  const userId = connections.get(connectionId);
  connections.delete(connectionId);

  if (userId) {
    eventEmitter.emit(USER_CONNECTION_CHANGED, {
      usersOnlineStatusChanged: getOnlineUsers(),
      userId,
    });
  }
}

eventEmitter.on(WS_CONNECTION_STARTED, wsConnectionStarted);
eventEmitter.on(WS_CONNECTION_TERMINATED, wsConnectionTerminated);

module.exports = {
  getOnlineUsers,
};
