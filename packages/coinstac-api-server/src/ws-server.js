const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const { schema } = require('./data/schema');

const activate = (hapiServer) => {
  const subServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    {
      server: hapiServer.listener,
      path: '/subscriptions',
    }
  );

  return subServer;
};

module.exports = { activate };
