const database = require('../src/database');

const transactionLoggerPlugin = {
  // Fires whenever a GraphQL request is received from a client.
  requestDidStart(requestContext) {
    const { request, context } = requestContext;

    if (context?.credentials?.passwordHash) {
      context.credentials.passwordHash = undefined;
    }

    const db = database.getDbInstance();

    db.collection('transactions').insertOne({
      timestamp: Date.now(),
      request,
      context,
    });

    return {};
  },
};

module.exports = transactionLoggerPlugin;
