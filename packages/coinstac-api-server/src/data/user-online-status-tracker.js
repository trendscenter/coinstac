const {
  eventEmitter,
  WS_CONNECTION_STARTED,
  WS_CONNECTION_TERMINATED,
  USER_SESSION_STARTED,
  USER_SESSION_FINISHED,
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

function _wsConnectionStarted(connectionId, userId) {
  connections.set(connectionId, userId);
}

function _wsConnectionTerminated(connectionId) {
  connections.delete(connectionId);
}

eventEmitter.on(WS_CONNECTION_STARTED, _wsConnectionStarted);
eventEmitter.on(WS_CONNECTION_TERMINATED, _wsConnectionTerminated);

module.exports = {
  getOnlineUsers,
};
