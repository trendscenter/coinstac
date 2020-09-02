const {
  eventEmitter,
  WS_CONNECTION_STARTED,
  WS_CONNECTION_TERMINATED,
  USER_LOGOUT,
  USER_SESSION_STARTED,
  USER_SESSION_FINISHED,
} = require('./events');

// A map that stores the current ws connections on the server.
// key: ws connection id
// value: id of the connected user
const connections = new Map();

// A map that links connected users to their ws connections
// key: user id
// value: ws connection id
const usersConnected = new Map();

function getOnlineUsers() {
  const usersArray = [...usersConnected.keys()];

  return usersArray.reduce((aggregate, user) => {
    aggregate[user] = true;
    return aggregate;
  }, {});
}

function getUserId(connectionId) {
  return connections.get(connectionId);
}

function connectionHasUser(connectionId) {
  const user = connections.get(connectionId);
  return !!user;
}

function linkConnectionToUser(connectionId, userId) {
  connections.set(connectionId, userId);
  usersConnected.set(userId, connectionId);

  eventEmitter.emit(USER_SESSION_STARTED, getOnlineUsers());
}

function _wsConnectionStarted(connectionId) {
  connections.set(connectionId, null);
}

function _wsConnectionTerminated(connectionId) {
  const connectedUser = connections.get(connectionId);

  if (connectedUser) {
    usersConnected.delete(connectedUser);

    eventEmitter.emit(USER_SESSION_FINISHED, getOnlineUsers());
  }

  connections.delete(connectionId);
}

function _userLogout(userId) {
  const connectionId = usersConnected.get(userId);

  if (connectionId) {
    connections.set(connectionId, null);
  }

  usersConnected.delete(userId);

  eventEmitter.emit(USER_SESSION_FINISHED, getOnlineUsers());
}

eventEmitter.on(WS_CONNECTION_STARTED, _wsConnectionStarted);
eventEmitter.on(WS_CONNECTION_TERMINATED, _wsConnectionTerminated);
eventEmitter.on(USER_LOGOUT, _userLogout);

module.exports = {
  connectionHasUser,
  linkConnectionToUser,
  getOnlineUsers,
  getUserId,
};
