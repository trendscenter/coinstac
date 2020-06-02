/* eslint-disable global-require */
const test = require('ava');
const sinon = require('sinon');
const axios = require('axios');
const crypto = require('crypto');
const { graphql } = require('graphql');
const { SubscriptionClient } = require('subscriptions-transport-ws');
const { ApolloClient } = require('apollo-client');
const gql = require('graphql-tag');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const database = require('../src/database');
const populate = require('../seed/populate');
const helperFunctions = require('../src/auth-helpers');
const { schema } = require('../src/data/schema');
const { resolvers } = require('../src/data/resolvers');

const { Query, Mutation } = resolvers;

const SUB_URL = 'ws://localhost:3100/subscriptions';

/**
 * Error messages
 */
const UNAUTHENTICATED_ERROR = 'User not authenticated';
const ACTION_PERMIT_ERROR = 'Action not permitted';
const UNIQUE_USERNAME_ERROR = 'Username taken';
const DUPLICATE_CONSORTIUM_ERROR = 'Consortium with same name already exists';
const INVALID_PIPELINE_STEP = 'Some of the covariates are incomplete';

/**
 * Variables
 */
let networkInterface;
let apolloClient;

function getAuthByUsername(username) {
  return { auth: { credentials: { id: username, username } } };
}

function getMessageFromError(error) {
  return error.output.payload.mesage;
}

/*
  This function creates an object to manage the subscription. Before calling a mutation,
  you should call the waitForNext function, which will return a promise that will resolve
  once the subscription receives data. After calling the mutation you should wait for the
  waitForNext function to resolve. In the end of the test, you should call the unsubscribe
  function to release resources.
*/
function subscribe(query, variables) {
  const subDataEventEmitter = new EventEmitter();

  let currentWaitIndex = 0;
  let currentDataIndex = 0;

  const subscription = apolloClient
    .subscribe({
      query,
      variables,
    })
    .subscribe({
      next: (data) => {
        subDataEventEmitter.emit(`sub-data-${currentDataIndex}`, data);
        currentDataIndex += 1;
      },
    });

  return {
    waitForNext() {
      return new Promise((resolve) => {
        subDataEventEmitter.on(`sub-data-${currentWaitIndex}`, data => resolve(data));
        currentWaitIndex += 1;
      });
    },
    unsubscribe() {
      subscription.unsubscribe();
    },
  };
}

test.before(async () => {
  await populate(false);

  require('../src');

  networkInterface = new SubscriptionClient(SUB_URL, {
    reconnect: false,
  }, WebSocket);

  apolloClient = new ApolloClient({
    networkInterface,
  });
});

test.beforeEach(() => {
  networkInterface.unsubscribeAll();
});

/**
 * Auth helper tests
 */

test.serial('createToken', (t) => {
  helperFunctions.createToken('test-1');

  t.pass();
});

test.serial('createUser', async (t) => {
  const passwordHash = await helperFunctions.hashPassword('password');

  const user = {
    username: 'test-user',
    email: 'testuser@email.com',
  };

  const createdUser = await helperFunctions.createUser(user, passwordHash);

  t.is(createdUser.username, user.username);
});

test.serial('getUserDetails', async (t) => {
  const username = 'test1';
  const user = await helperFunctions.getUserDetails(username);

  t.is(user.username, username);
});

test.serial('hashPassword', async (t) => {
  await helperFunctions.hashPassword('password');

  t.pass();

  sinon.stub(crypto, 'pbkdf2').yields(new Error('error'), null);

  try {
    await helperFunctions.hashPassword('password');
  } catch {
    t.pass();
  }

  crypto.pbkdf2.restore();
});

test.serial('validateToken', (t) => {
  const decoded1 = { username: 'test1' };

  helperFunctions.validateToken(decoded1, null, (_, valid, user) => {
    t.true(valid);
    t.is(user.username, decoded1.username);
  });

  const decoded2 = { username: 'invalid-user' };

  helperFunctions.validateToken(decoded2, null, (_, valid, user) => {
    t.false(valid);
    t.falsy(user);
  });

  t.pass();
});

test.serial('validateUniqueEmail', async (t) => {
  const req = { payload: { email: 'test@mrn.org' } };

  const isValid = await helperFunctions.validateUniqueEmail(req);

  t.false(isValid);
});

test.serial('validateUniqueUser', async (t) => {
  const req1 = { payload: { username: 'test1', email: 'test@mrn.org' } };

  await helperFunctions.validateUniqueUser(req1, (error) => {
    t.is(error.output.payload.message, 'Username taken');
  });

  const req2 = { payload: { username: 'newuser', email: 'test@mrn.org' } };

  await helperFunctions.validateUniqueUser(req2, (error) => {
    t.is(error.output.payload.message, 'Email taken');
  });

  const req3 = { payload: { username: 'newuser', email: 'newuser@mrn.org' } };
  await helperFunctions.validateUniqueUser(req3, (user) => {
    t.deepEqual(user, req3.payload);
  });
});

test.serial('validateUniqueUsername', async (t) => {
  const req = { payload: { username: 'valid-user' } };

  const isUnique = await helperFunctions.validateUniqueUsername(req);

  t.true(isUnique);
});

test.serial('validateUser', async (t) => {
  const req1 = { payload: { username: 'test1', password: 'password' } };

  await helperFunctions.validateUser(req1, (user) => {
    t.is(user.username, req1.payload.username);
  });

  const req2 = { payload: { username: 'invalid-user', password: 'password' } };

  await helperFunctions.validateUser(req2, (error) => {
    t.is(error.output.payload.statusCode, 401);
  });

  const req3 = { payload: { username: 'test1', password: 'password1' } };

  await helperFunctions.validateUser(req3, (error) => {
    t.is(error.output.payload.statusCode, 401);
  });
});

test.serial('verifyPassword', async (t) => {
  const passwordHash = await helperFunctions.hashPassword('password');

  const isValid1 = await helperFunctions.verifyPassword('password', passwordHash);

  t.true(isValid1);

  const isValid2 = await helperFunctions.verifyPassword('password');

  t.false(isValid2);

  sinon.stub(crypto, 'pbkdf2').yields('error', null);

  try {
    await helperFunctions.verifyPassword('password', passwordHash);
  } catch (error) {
    t.is(error, 'error');
  }

  crypto.pbkdf2.restore();
});

test.serial('setDBMap', (t) => {
  helperFunctions.setDBMap({ cstacJWTSecret: 'secret' });
  t.pass();
});


/**
 * Query tests
 */
test.serial('fetchAll Results and fetchResult', async (t) => {
  const results = await Query.fetchAllResults();

  t.is(results.length, 4);

  const result1 = await Query.fetchResult({}, {});

  t.is(result1, null);

  const result2 = await Query.fetchResult({}, { resultId: results[0].id });

  t.deepEqual(result2.id, results[0].id);
});

test.serial('fetchAllConsortia', async (t) => {
  const auth = getAuthByUsername('test1');
  const consortia = await Query.fetchAllConsortia(auth);

  t.is(consortia.length, 2);

  const consortium1 = await Query.fetchConsortium({}, {});

  t.is(consortium1, null);

  const consortium2 = await Query.fetchConsortium({}, { consortiumId: consortia[0].id });

  t.deepEqual(consortium2.id, consortia[0].id);
});

test.serial('fetchAllComputations and fetchComputation', async (t) => {
  const computations = await Query.fetchAllComputations();

  t.is(computations.length, 15);

  const ids = [computations[0].id, computations[1].id];

  const computation1 = await Query.fetchComputation(
    {}, { computationIds: computations[0].id }
  );

  t.is(computation1, null);

  const computation2 = await Query.fetchComputation(
    {}, { computationIds: [] }
  );

  t.is(computation2, null);

  const computation3 = await Query.fetchComputation(
    {}, { computationIds: ids }
  );

  t.is(computation3.length, ids.length);
});

test.serial('fetchAllPipelines and fetchPipeline', async (t) => {
  const pipelines = await Query.fetchAllPipelines();

  t.is(pipelines.length, 3);

  const pipeline1 = await Query.fetchPipeline({}, {});

  t.is(pipeline1, null);

  const pipeline2 = await Query.fetchPipeline(
    {}, { pipelineId: pipelines[0].id }
  );

  t.deepEqual(pipeline2.id, pipelines[0].id);
});

test.serial('fetchUser', async (t) => {
  const userId = 'test1';
  const auth = getAuthByUsername(userId);

  try {
    await Query.fetchUser(auth, { userId: 'test2' });
  } catch (error) {
    t.is(getMessageFromError(error), UNIQUE_USERNAME_ERROR);
  }

  const user = await Query.fetchUser(auth, { userId });

  t.is(user.id, userId);
});

test.serial('fetchAllUsers', async (t) => {
  const users = await Query.fetchAllUsers();

  t.is(users.length, 8);
});

test.serial('fetchAllUserRuns', async (t) => {
  const auth = getAuthByUsername('test1');
  const runs = await Query.fetchAllUserRuns(auth);

  t.is(runs.length, 4);
});

test.serial('fetchAllThreads', async (t) => {
  const auth = getAuthByUsername('test1');

  const threads = await Query.fetchAllThreads(auth);

  t.is(threads.length, 0);
});

/**
 * Mutation tests
 */
test.serial('addComputation', async (t) => {
  const auth = getAuthByUsername('test1');
  const args = { computationSchema: { meta: {} } };

  const res = await Mutation.addComputation(auth, args);

  t.deepEqual(res.meta, args.computationSchema.meta);
});

test.serial('addUserRole', async (t) => {
  const auth = getAuthByUsername('test1');
  const consortia = await Query.fetchAllConsortia(auth);
  const consortiumId = consortia[0].id;

  const invalidPermissions = {
    consortia: {
      [consortiumId]: null,
    },
  };

  const args = {
    table: 'consortia',
    doc: consortiumId,
    role: 'admin',
    userId: 'test1',
  };

  try {
    await Mutation.addUserRole(
      { auth: { credentials: { permissions: invalidPermissions } } }, args
    );
  } catch (error) {
    t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);
  }

  const permissions = {
    consortia: {
      [consortiumId]: ['owner'],
    },
  };

  const res = await Mutation.addUserRole(
    { auth: { credentials: { permissions } } }, args
  );

  t.deepEqual(res.id, 'test1');
});

test.serial('removeUserRole', async (t) => {
  const auth = getAuthByUsername('test1');
  const consortia = await Query.fetchAllConsortia(auth);
  const consortiumId = consortia[0].id;

  const invalidPermissions = {
    consortia: {
      [consortiumId]: null,
    },
  };

  const args = {
    table: 'consortia',
    doc: consortiumId,
    role: 'admin',
    userId: 'test1',
  };

  try {
    await Mutation.removeUserRole(
      { auth: { credentials: { permissions: invalidPermissions } } }, args
    );
  } catch (error) {
    t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);
  }

  const permissions = {
    consortia: {
      [consortiumId]: ['owner'],
    },
  };

  const res = await Mutation.removeUserRole(
    { auth: { credentials: { permissions } } }, args
  );

  t.deepEqual(res.id, 'test1');
});

test.serial('createRun', async (t) => {
  try {
    await Mutation.createRun({}, { consortiumId: 'con-1' });
  } catch (error) {
    t.is(getMessageFromError(error), UNAUTHENTICATED_ERROR);
  }

  try {
    await Mutation.createRun({ auth: {} }, { consortiumId: 'con-1' });
  } catch (error) {
    t.is(getMessageFromError(error), UNAUTHENTICATED_ERROR);
  }

  const auth = getAuthByUsername('test1');

  const consortia = await Query.fetchAllConsortia(auth);
  const consortiumId = consortia[1].id;

  sinon.stub(axios, 'post').resolves();

  const run = await Mutation.createRun(auth, { consortiumId });
  t.deepEqual(run.consortiumId, consortiumId);

  axios.post.restore();
});

test.serial('deletePipeline', async (t) => {
  const pipelines = await Query.fetchAllPipelines();
  const pipelineId = pipelines[0].id;
  const consortiumId = pipelines[0].owningConsortium;

  const invalidPermission = {
    consortia: {
      [consortiumId]: null,
    },
  };

  try {
    await Mutation.deletePipeline(
      { auth: { credentials: { permissions: invalidPermission } } }, { pipelineId }
    );
  } catch (error) {
    t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);
  }

  const permissions = {
    consortia: {
      [consortiumId]: ['owner'],
    },
  };

  const auth = getAuthByUsername('test1');
  const runs = await Query.fetchAllUserRuns(auth);

  await Mutation.deletePipeline(
    { auth: { credentials: { permissions } } }, { pipelineId: runs[0].pipelineSnapshot.id }
  );

  const deletedPipeline = await Mutation.deletePipeline(
    { auth: { credentials: { permissions } } }, { pipelineId }
  );

  t.deepEqual(deletedPipeline.id, pipelineId);
});

test.serial('saveActivePipeline', async (t) => {
  const auth = getAuthByUsername('author');
  const consortia = await Query.fetchAllConsortia(auth);
  const pipelines = await Query.fetchAllPipelines();

  const consortiumId = consortia[0].id;
  const pipelineId = pipelines[0].id;

  const consortium = await Mutation.saveActivePipeline(auth, { consortiumId, pipelineId });

  t.deepEqual(consortium.id, consortiumId);
});

test.serial('saveConsortium', async (t) => {
  const pipelines = await Query.fetchAllPipelines();
  const auth = { auth: { credentials: { id: 'test1', permissions: { } } } };
  const consortium1 = {
    name: 'Consortium 1',
    description: 'Consortium Desc 1',
    isPrivate: false,
    owners: [],
    members: [],
    activePipelineId: pipelines[0].id,
  };

  const createdConsortium = await Mutation.saveConsortium(auth, { consortium: consortium1 });

  t.is(createdConsortium.name, consortium1.name);

  try {
    await Mutation.saveConsortium(auth, { consortium: consortium1 });
  } catch (error) {
    t.is(getMessageFromError(error), DUPLICATE_CONSORTIUM_ERROR);
  }

  const consortia = await Query.fetchAllConsortia(getAuthByUsername('test1'));

  const consortium2 = {
    ...consortium1,
    id: consortia[0].id,
  };

  const permissions = {
    consortia: {
      [consortia[0].id]: [],
    },
  };

  try {
    await Mutation.saveConsortium(
      { auth: { credentials: { permissions } } },
      { consortium: consortium2 }
    );
  } catch (error) {
    t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);
  }
});

test.serial('saveError', async (t) => {
  const auth = getAuthByUsername('test1');
  const runs = await Query.fetchAllUserRuns(auth);

  const args1 = { runId: runs[1]._id, error: { messag: 'Error' } };
  const run1 = await Mutation.saveError({}, args1);

  t.deepEqual(run1.error, args1.error);

  const args2 = { runId: '5ecc6a7ad56fb9c8ae4fddf8', error: { message: 'error' } };
  const run2 = await Mutation.saveError({}, args2);

  t.is(run2, undefined);
});

test.serial('saveResults', async (t) => {
  const auth = getAuthByUsername('test1');
  const runs = await Query.fetchAllUserRuns(auth);

  const args1 = { runId: runs[1]._id, results: { messag: 'Result' } };
  const run1 = await Mutation.saveResults({}, args1);

  t.deepEqual(run1.results, args1.results);

  const args2 = { runId: '5ecc6a7ad56fb9c8ae4fddf8', error: { message: 'Result' } };
  const run2 = await Mutation.saveResults({}, args2);

  t.is(run2, undefined);
});

test.serial('savePipeline', async (t) => {
  const auth = getAuthByUsername('test1');
  const consortia = await Query.fetchAllConsortia(auth);
  const computations = await Query.fetchAllComputations();

  const args1 = {
    pipeline: {
      name: 'Decentralized Pipeline',
      description: 'Test description',
      owningConsortium: consortia[0].id,
      shared: false,
      steps: [{
        id: 'UIKDl-',
        controller: {
          type: 'decentralized',
        },
        computations: [computations[0].id],
        inputMap: {
          start: {
            value: 1,
          },
        },
      }],
    },
  };

  const res = await Mutation.savePipeline({}, args1);

  t.is(res.name, args1.pipeline.name);

  const args2 = {
    pipeline: {
      ...args1.pipeline,
      steps: [{
        id: 'UIKDl-',
        controller: {
          type: 'decentralized',
        },
        computations: [computations[0].id],
        inputMap: {
          start: {
            value: 1,
          },
          covariates: {
            ownerMappings: [{
              name: 'mapping-1',
            }],
          },
        },
      }],
    },
  };

  try {
    await Mutation.savePipeline({}, args2);
  } catch (error) {
    t.is(getMessageFromError(error), INVALID_PIPELINE_STEP);
  }
});

test.serial('updateRunState', async (t) => {
  const auth = getAuthByUsername('test1');
  const runs = await Query.fetchAllUserRuns(auth);

  const args = {
    runId: runs[0].id,
    data: {
      state: 'running',
    },
  };

  const res = await Mutation.updateRunState({}, args);

  t.deepEqual(res.remotePipelineState, args.data);
});

test.serial('updateUserConsortiumStatus', async (t) => {
  const auth = getAuthByUsername('test1');
  const consortia = await Query.fetchAllConsortia(auth);
  const consortiumId = consortia[0].id;
  const status = 'completed';

  const res = await Mutation.updateUserConsortiumStatus(auth, { consortiumId, status });

  t.is(res.consortiaStatuses[consortiumId], status);
});

test.serial('updateConsortiumMappedUsers', async (t) => {
  const auth = getAuthByUsername('test1');
  const consortia = await Query.fetchAllConsortia(auth);

  const args = {
    consortiumId: consortia[0].id,
    mappedForRun: ['test2', 'test3'],
  };

  const res = await Mutation.updateConsortiumMappedUsers({}, args);

  t.deepEqual(res.mappedForRun, args.mappedForRun);
});

test.serial('updateConsortiaMappedUsers', async (t) => {
  const auth = getAuthByUsername('test1');

  const res = await Mutation.updateConsortiaMappedUsers(auth, { consortia: null });
  t.is(res, undefined);

  const consortia = await Query.fetchAllConsortia(auth);

  const args = {
    consortia: [consortia[0].id],
  };

  await Mutation.updateConsortiaMappedUsers(auth, args);
  t.pass();
});

test.serial('saveMessage', async (t) => {
  const auth = getAuthByUsername('test1');
  const runs = await Query.fetchAllUserRuns(auth);

  const args1 = {
    title: 'Test Thread',
    recipients: ['test2', 'test3'],
    content: 'Test Thread Content',
    action: {
      type: 'share-result',
      detail: {
        id: runs[0].id,
      },
    },
  };

  const res1 = await Mutation.saveMessage(auth, args1);

  t.is(res1.title, args1.title);

  const threads = await Query.fetchAllThreads(auth);
  const args2 = {
    threadId: threads[0].id,
    recipients: ['author', 'test4'],
    content: 'Content 2',
  };

  const res2 = await Mutation.saveMessage(auth, args2);

  t.is(res2.messages.length, 2);
});

test.serial('setReadMessage', async (t) => {
  const auth = getAuthByUsername('test2');
  const threads = await Query.fetchAllThreads(auth);

  const args = {
    threadId: threads[0].id,
    userId: 'test2',
  };

  const res = await Mutation.setReadMessage({}, args);

  t.true(res.users.some(user => user.isRead && user.username === 'test2'));
});

test.serial('joinConsortium', async (t) => {
  const auth = getAuthByUsername('test1');
  const consortia = await Query.fetchAllConsortia(auth);
  const consortiumId1 = consortia[0].id;

  const res1 = await Mutation.joinConsortium(auth, { consortiumId: consortiumId1 });
  t.deepEqual(res1.id, 'test1');

  const consortiumId2 = consortia[1].id;
  const res2 = await Mutation.joinConsortium(auth, { consortiumId: consortiumId2 });
  t.deepEqual(res2._id, consortiumId2);
});

test.serial('leaveConsortium', async (t) => {
  const auth = getAuthByUsername('test1');
  const consortia = await Query.fetchAllConsortia(auth);
  const consortiumId = consortia[0].id;

  const res = await Mutation.leaveConsortium(auth, { consortiumId });

  t.deepEqual(res.id, 'test1');
});

test.serial('deleteConsortiumById', async (t) => {
  const auth = getAuthByUsername('test1');
  const consortia = await Query.fetchAllConsortia(auth);

  const consortiumId = consortia[0].id;

  const invalidPermissions = {
    consortia: {},
  };

  try {
    await Mutation.deleteConsortiumById(
      { auth: { credentials: { permissions: invalidPermissions } } },
      { consortiumId }
    );
  } catch (error) {
    t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);
  }

  const permissions = {
    consortia: {
      [consortiumId]: ['owner'],
    },
  };

  const deletedConsortium = await Mutation.deleteConsortiumById(
    { auth: { credentials: { permissions } } }, { consortiumId }
  );

  t.deepEqual(deletedConsortium.id, consortiumId);
});

test.serial('removeComputation', async (t) => {
  const auth1 = getAuthByUsername('test1');
  const computations = await Query.fetchAllComputations();
  const computationId = computations[0].id;

  try {
    await Mutation.removeComputation(auth1, { computationId });
  } catch (error) {
    t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);
  }

  const auth2 = getAuthByUsername('author');
  const res = await Mutation.removeComputation(auth2, { computationId });

  t.deepEqual(res.id, computationId);
});

/**
 * Subscription tests
 */
test.serial('consortium subscription', async (t) => {
  const auth = getAuthByUsername('test1');

  const consortium = {
    name: 'Consortium Test Sub 1',
    description: 'Consortium Test Sub Desc 1',
    isPrivate: false,
    owners: [],
    members: [],
  };

  const NEW_NAME = 'Consortium Test Sub 1 Updated';

  const subDataControl = subscribe(gql`
    subscription consortiumChanged($consortiumId: ID) {
      consortiumChanged(consortiumId: $consortiumId) {
        id
        name
      }
    }
  `, {
    consortiumId: null,
  });

  const insertConsortiumSubDataPromise = subDataControl.waitForNext();

  const { data: { saveConsortium: createdConsortium } } = await graphql(schema, `
    mutation saveConsortium($consortium: ConsortiumInput!) {
      saveConsortium(consortium: $consortium) {
        id
        name
      }
    }
  `, auth, null, { consortium });

  const insertConsortiumSubData = await insertConsortiumSubDataPromise;

  t.is(insertConsortiumSubData.consortiumChanged.name, consortium.name);

  consortium.id = createdConsortium.id;
  consortium.name = NEW_NAME;

  auth.auth.credentials.permissions = {
    consortia: {
      [consortium.id]: ['owner'],
    },
  };

  const updateConsortiumSubDataPromise = subDataControl.waitForNext();

  await graphql(schema, `
    mutation saveConsortium($consortium: ConsortiumInput!) {
      saveConsortium(consortium: $consortium) {
        id
        name
      }
    }
  `, auth, null, { consortium });

  const updateConsortiumSubData = await updateConsortiumSubDataPromise;

  t.is(updateConsortiumSubData.consortiumChanged.name, NEW_NAME);

  // Cleanup
  await graphql(schema, `
    mutation deleteConsortiumById($consortiumId: ID) {
      deleteConsortiumById(consortiumId: $consortiumId) {
        id
        name
      }
    }
  `, auth, null, { consortiumId: consortium.id.toString() });

  subDataControl.unsubscribe();
});


test.after.always('cleanup', async () => {
  await database.close();
  networkInterface.close();
});
