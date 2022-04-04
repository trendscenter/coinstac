const { ObjectID } = require('mongodb');
const database = require('../src/database');

const transactionLoggerPlugin = {
  // Fires whenever a GraphQL request is received from a client.
  async requestDidStart(requestContext) {
    console.log('request did start');
    const db = database.getDbInstance();
    // save this log to a transactions collection.
    // const message = JSON.stringify(requestContext);

    const result = await db.collection('transactions').insertOne({
      request: requestContext.request,
      context: requestContext.context,
      executionStarted: false,
      errors: [],
    });
    const { insertedId } = result;
    await db.collection('transactions').findOneAndUpdate({ _id: ObjectID(insertedId) }, { $set: { mymessage: 'just started here' } });

    return {
      async parsingDidStart(requestContext) {
        console.log('Parsing started!');
        await db.collection('transactions').findOneAndUpdate({ _id: ObjectID(insertedId) }, { $set: { mymessage: 'parsing started' } });
      },

      async validationDidStart(requestContext) {
        await db.collection('transactions').findOneAndUpdate({ _id: ObjectID(insertedId) }, { $set: { mymessage: 'validation started' } });
      }
    };
  },
};

module.exports = transactionLoggerPlugin;
