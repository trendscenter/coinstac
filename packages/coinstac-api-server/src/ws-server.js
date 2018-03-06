const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const { schema } = require('./data/schema');

const activate = (pipelineServer) => {
  const subServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    {
      server: pipelineServer.listener,
      path: '/subscriptions',
    }
  );

  return subServer;
};

module.exports = { activate };
