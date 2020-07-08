const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const { schema } = require('./data/schema');
const {
  eventEmitter,
  WS_CONNECTION_STARTED,
  WS_CONNECTION_TERMINATED,
} = require('./data/events');
const { connectionHasUser, linkConnectionToUser } = require('./data/user-online-status-tracker');

const activate = (pipelineServer) => {
  const subServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,

      // We use the sec-websocket-key header to identify the web socket connections
      // and manage which users are online.
      onConnect: (_, ws) => {
        eventEmitter.emit(WS_CONNECTION_STARTED, ws.upgradeReq.headers['sec-websocket-key']);
      },
      onDisconnect: (ws) => {
        eventEmitter.emit(WS_CONNECTION_TERMINATED, ws.upgradeReq.headers['sec-websocket-key']);
      },
      onOperation: (message, params, ws) => {
        if (params.operationName === 'userChanged') {
          const connectionId = ws.upgradeReq.headers['sec-websocket-key'];

          if (!connectionHasUser(connectionId)) {
            linkConnectionToUser(connectionId, params.variables.userId);
          }
        }

        return params;
      },
    },
    {
      server: pipelineServer.listener,
      path: '/subscriptions',
    }
  );

  return subServer;
};

module.exports = { activate };
