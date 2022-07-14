const {
  eventEmitter,
  WS_CONNECTION_STARTED,
  WS_CONNECTION_TERMINATED,
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
}

function wsConnectionTerminated(connectionId) {
  connections.delete(connectionId);
}

eventEmitter.on(WS_CONNECTION_STARTED, wsConnectionStarted);
eventEmitter.on(WS_CONNECTION_TERMINATED, wsConnectionTerminated);

module.exports = {
  getOnlineUsers,
};
