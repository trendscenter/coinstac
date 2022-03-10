/* eslint-disable global-require */
const test = require('ava');
const sinon = require('sinon');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const Issue = require('github-api/dist/components/Issue');
const jwt = require('jsonwebtoken');
const database = require('../src/database');
const {
  populate,
  CONSORTIA_IDS,
  COMPUTATION_IDS,
  PIPELINE_IDS,
  USER_IDS,
  RUN_IDS,
} = require('../seed/populate');
const helperFunctions = require('../src/auth-helpers');
const { resolvers } = require('../src/data/resolvers');

const { Query, Mutation } = resolvers;

/**
 * Error messages
 */
const UNAUTHENTICATED_ERROR = 'User not authenticated';
const ACTION_PERMIT_ERROR = 'Action not permitted';
const DUPLICATE_CONSORTIUM_ERROR = 'Consortium with same name already exists';
const INVALID_TOKEN = 'Invalid token';
const INVALID_EMAIL = 'Invalid email';
const INVALID_CONSORTIUM = 'Consortium with provided id not found';
const MISSING_ACTIVE_PIPELINE = 'Active pipeline not found on this consortium';
const PIPELINE_SERVER_UNAVAILABLE = 'Pipeline server unavailable';
const FAILED_CREATE_ISSUE = 'Failed to create issue on GitHub';
const INVALID_PASSWORD = 'Current password is not correct';
const RUNS_ON_PIPELINE = 'Runs on this pipeline exist';
const INVALID_ROLE_TYPE = 'Invalid role type';
const NO_HEADLESS_CLIENT = 'No headless client is registered with this api key';

/**
 * Variables
 */

function getAuth(id, username, role) {
  const permissions = {
    roles: {},
  };

  if (role === 'admin') {
    permissions.roles.admin = true;
  } else if (role === 'author') {
    permissions.roles.author = true;
  }

  return {
    credentials: { id, username: username || id, permissions },
  };
}

function getMessageFromError(error) {
  return error.output.payload.message;
}

test.before(async () => {
  await populate(false);

  require('../src');
});

/**
 * Auth helper tests
 */

test('createToken', (t) => {
  const token = helperFunctions.createToken('test-1');

  t.not(token.length, null);
});

test('decodeToken', (t) => {
  const username = 'test-1';
  const token = helperFunctions.createToken(username);
  const decoded = helperFunctions.decodeToken(token);

  t.is(decoded.id, username);
});

test('createPasswordResetToken, savePasswordResetToken, validateResetToken and resetPassword', async (t) => {
  /* createPasswordResetToken */
  const email = 'test@mrn.org';
  const token = helperFunctions.createPasswordResetToken(email);

  t.not(token.length, null);

  /* savePasswordResetToken */
  sinon.stub(sgMail, 'send').resolves();

  const user = await helperFunctions.savePasswordResetToken(email);
  t.not(user.passwordResetToken, null);

  sgMail.send.restore();

  /* validateResetToken */
  const req = {
    payload: { token },
  };

  await helperFunctions.validateResetToken(req, (res) => {
    t.is(res.email, email);
  });

  const invalidTokenReq = {
    payload: { token: 'token' },
  };
  await helperFunctions.validateResetToken(invalidTokenReq, (error) => {
    t.is(getMessageFromError(error), INVALID_TOKEN);
  });

  sinon.stub(jwt, 'verify').throws(new Error('error'));
  await helperFunctions.validateResetToken(req, (error) => {
    t.is(getMessageFromError(error), 'error');
  });
  jwt.verify.restore();

  sinon.stub(jwt, 'verify').resolves({ email: 'email@mrn.org' });
  await helperFunctions.validateResetToken(req, (error) => {
    t.is(getMessageFromError(error), INVALID_EMAIL);
  });
  jwt.verify.restore();

  /* resetPassword */
  const newPassword = 'newPassword';
  await helperFunctions.resetPassword(token, newPassword);

  const res = await helperFunctions.getUserDetailsByID(USER_IDS[0]);
  const isValid = await helperFunctions.verifyPassword(newPassword, res.passwordHash);
  t.true(isValid);
});

test('createUser', async (t) => {
  const passwordHash = await helperFunctions.hashPassword('password');

  const user = {
    username: 'test-user',
    email: 'testuser@email.com',
  };

  const createdUser = await helperFunctions.createUser(user, passwordHash);

  t.is(createdUser.username, user.username);
});

test('updateUser', async (t) => {
  const user = await helperFunctions.getUserDetailsByID(USER_IDS[4]);
  const newUsername = 'test6';

  const newUser = {
    ...user,
    username: newUsername,
  };

  const updatedUser = await helperFunctions.updateUser(newUser);

  t.is(updatedUser.username, newUsername);
});

test('getUserDetailsByID', async (t) => {
  const userId = USER_IDS[0];

  const user = await helperFunctions.getUserDetailsByID(userId);

  t.is(user.id, userId.toHexString());

  const invalidUser = await helperFunctions.getUserDetailsByID('test1');
  t.falsy(invalidUser);
});

test('getUserDetails', async (t) => {
  const username = 'test1';
  const user = await helperFunctions.getUserDetails(username);

  t.is(user.username, username);
});

test('hashPassword and verifyPassword', async (t) => {
  /* hashPassword */
  const passwordHash = await helperFunctions.hashPassword('password');

  t.is(passwordHash.length, 120);

  sinon.stub(crypto, 'pbkdf2').yields(new Error('error'), null);

  let error = await t.throwsAsync(helperFunctions.hashPassword('password'));
  t.is(error.message, 'error');

  crypto.pbkdf2.restore();

  /* verifyPassword */
  const isValid1 = await helperFunctions.verifyPassword('password', passwordHash);
  t.true(isValid1);

  const isValid2 = await helperFunctions.verifyPassword('password');
  t.false(isValid2);

  sinon.stub(crypto, 'pbkdf2').yields(new Error('error'), null);

  error = await t.throwsAsync(helperFunctions.verifyPassword('password', passwordHash));
  t.is(error.message, 'error');

  crypto.pbkdf2.restore();
});

test('validateToken and validateUser', async (t) => {
  const users = await Query.fetchAllUsers();
  const decoded1 = { decoded: { payload: { id: users[0].id } } };

  helperFunctions.validateToken(decoded1, null, (_, valid, user) => {
    t.true(valid);
    t.is(user.id, decoded1.id);
  });

  const decoded2 = { decoded: { payload: { id: 'invalid-user' } } };

  helperFunctions.validateToken(decoded2, null, (_, valid, user) => {
    t.false(valid);
    t.falsy(user);
  });

  const req1 = { payload: { username: 'test1', password: 'password' } };

  await helperFunctions.validateUser(req1, {
    response: (user) => {
      t.is(user.username, req1.payload.username);
    },
  });

  const req2 = { payload: { username: 'invalid-user', password: 'password' } };

  try {
    await helperFunctions.validateUser(req2, {
      response: () => {},
    });
  } catch (error) {
    t.is(error.statusCode, 401);
  }

  const req3 = { payload: { username: 'test1', password: 'password1' } };

  try {
    await helperFunctions.validateUser(req3, {
      response: () => {},
    });
  } catch (error) {
    t.is(error.statusCode, 401);
  }
});

test('validateHeadlessClientApiKey', async (t) => {
  const apiKey = await helperFunctions.hashPassword('testApiKey');

  let req = {
    payload: {
      name: 'Headless 1',
      apiKey,
    },
  };

  await helperFunctions.validateHeadlessClientApiKey(req, {
    response: (headlessClient) => {
      t.is(headlessClient.name, req.payload.name);
    },
  });

  req = {
    payload: {
      name: 'Headless 2',
      apiKey,
    },
  };

  try {
    await helperFunctions.validateHeadlessClientApiKey(req, { response: () => { } });
  } catch (error) {
    t.is(error.message, NO_HEADLESS_CLIENT);
  }

  t.pass();
});

test('validateEmail', async (t) => {
  let req = {
    payload: { email: 'test@mrn.org' },
  };

  await helperFunctions.validateEmail(req, {
    response: (exists) => {
      t.true(exists);
    },
  });

  req = {
    payload: { email: 'email@mrn.org' },
  };

  try {
    await helperFunctions.validateEmail(req, {
      response: () => {},
    });
  } catch (error) {
    t.is(getMessageFromError(error), INVALID_EMAIL);
  }
});

test('validateUniqueEmail', async (t) => {
  const req = { payload: { email: 'test@mrn.org' } };

  const isValid = await helperFunctions.validateUniqueEmail(req);

  t.false(isValid);
});

test('validateUniqueUsername', async (t) => {
  const req = { payload: { username: 'valid-user' } };

  const isUnique = await helperFunctions.validateUniqueUsername(req);

  t.true(isUnique);
});

test('validateUniqueUser', async (t) => {
  const req1 = { payload: { username: 'test1', email: 'test@mrn.org' } };
  try {
    await helperFunctions.validateUniqueUser(req1, {
      response: () => {},
    });
  } catch (error) {
    t.is(error.output.payload.message, 'Username taken');
  }

  const req2 = { payload: { username: 'newuser', email: 'test@mrn.org' } };
  try {
    await helperFunctions.validateUniqueUser(req2, {
      response: () => {},
    });
  } catch (error) {
    t.is(error.output.payload.message, 'Email taken');
  }

  const req3 = { payload: { username: 'newuser', email: 'newuser@mrn.org' } };
  await helperFunctions.validateUniqueUser(req3, {
    response: (isUnique) => {
      t.true(isUnique);
    },
  });
});

/**
 * Query tests
 */
test('fetchAll Results and fetchResult', async (t) => {
  const results = await Query.fetchAllResults();

  t.is(results.length, 4);

  const result1 = await Query.fetchResult({}, {});

  t.is(result1, null);

  const result2 = await Query.fetchResult({}, { resultId: results[0].id });

  t.deepEqual(result2.id, results[0].id);
});

test('fetchAllConsortia', async (t) => {
  const auth = getAuth('test1');
  const consortia = await Query.fetchAllConsortia('', {}, auth);

  t.is(consortia.length, 2);

  const consortium1 = await Query.fetchConsortium({}, {});

  t.is(consortium1, null);

  const consortium2 = await Query.fetchConsortium({}, { consortiumId: consortia[0].id });

  t.deepEqual(consortium2.id, consortia[0].id);
});

test('fetchAllComputations and fetchComputation', async (t) => {
  const computations = await Query.fetchAllComputations({}, { preprocess: null });

  t.is(computations.length, 20);

  const computations2 = await Query.fetchAllComputations({}, { preprocess: 'process' });

  t.is(computations2.length, 0);

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

test('fetchAllPipelines and fetchPipeline', async (t) => {
  const auth = getAuth('test1');
  const pipelines = await Query.fetchAllPipelines('', {}, auth);

  t.is(pipelines.length, 2);

  const pipeline1 = await Query.fetchPipeline({}, {});

  t.is(pipeline1, null);

  const pipeline2 = await Query.fetchPipeline(
    {}, { pipelineId: pipelines[0].id }
  );

  t.deepEqual(pipeline2.id, pipelines[0].id);
});

test('fetchAllUsers and fetchUser', async (t) => {
  const users = await Query.fetchAllUsers();
  t.is(users.length, 7);

  const userId = USER_IDS[0];

  const user = await Query.fetchUser({}, { userId });
  t.is(user.id, userId.toHexString());
});

test('fetchAllUserRuns', async (t) => {
  const auth = getAuth(USER_IDS[0].toHexString());
  const runs = await Query.fetchAllUserRuns('', {}, auth);

  t.is(runs.length, 4);
});

test('fetchAllThreads', async (t) => {
  const auth = getAuth(USER_IDS[0], 'test1');
  const threads = await Query.fetchAllThreads('', {}, auth);

  t.is(threads.length, 0);
});

/**
 * Mutation tests
 */
test('addComputation', async (t) => {
  const auth = getAuth(USER_IDS[0], null, 'admin');
  const args = { computationSchema: { meta: {}, id: database.createUniqueId() } };

  const res = await Mutation.addComputation('', args, auth);

  t.is(res.id, args.computationSchema.id);
});

test('addUserRole', async (t) => {
  const consortiumId = CONSORTIA_IDS[0];
  const userId = USER_IDS[0];

  const invalidPermissions = {
    consortia: {
      [consortiumId]: null,
    },
  };

  let args = {
    table: 'consortia',
    doc: consortiumId,
    role: 'admin',
    userId,
  };

  let error = await Mutation.addUserRole(
    '', args, { credentials: { permissions: invalidPermissions } }
  );
  t.is(getMessageFromError(error), INVALID_ROLE_TYPE);

  args = {
    table: 'consortia',
    doc: consortiumId,
    roleType: 'data',
    userId,
  };
  error = await Mutation.addUserRole(
    '', args, { credentials: { permissions: invalidPermissions } }
  );
  t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);

  const permissions = {
    consortia: {
      [consortiumId]: ['owner'],
    },
  };

  const res = await Mutation.addUserRole(
    '', args, { credentials: { permissions } }
  );

  t.is(res.id, userId.toHexString());
});

test('removeUserRole', async (t) => {
  const consortiumId = CONSORTIA_IDS[0];
  const userId = USER_IDS[0];

  const invalidPermissions = {
    consortia: {
      [consortiumId]: null,
    },
  };

  let args = {
    table: 'consortia',
    doc: consortiumId,
    role: 'admin',
    userId,
  };

  let error = await Mutation.removeUserRole(
    '', args, { credentials: { permissions: invalidPermissions } }
  );
  t.is(getMessageFromError(error), INVALID_ROLE_TYPE);

  args = {
    table: 'consortia',
    doc: consortiumId,
    roleType: 'data',
    userId,
  };
  error = await Mutation.removeUserRole(
    '', args, { credentials: { permissions: invalidPermissions } }
  );
  t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);

  const permissions = {
    consortia: {
      [consortiumId]: ['owner'],
    },
  };

  const res = await Mutation.removeUserRole(
    '', args, { credentials: { permissions } }
  );

  t.deepEqual(res.id, userId.toHexString());
});

test('createRun', async (t) => {
  let error = await Mutation.createRun('', { consortiumId: database.createUniqueId() }, {});
  t.is(getMessageFromError(error), UNAUTHENTICATED_ERROR);

  error = await Mutation.createRun('', { consortiumId: database.createUniqueId() }, {});
  t.is(getMessageFromError(error), UNAUTHENTICATED_ERROR);

  const auth = getAuth(USER_IDS[0], 'test1');

  error = await Mutation.createRun('', { consortiumId: database.createUniqueId() }, auth);
  t.is(getMessageFromError(error), INVALID_CONSORTIUM);

  const consortiumId1 = CONSORTIA_IDS[0];

  error = await Mutation.createRun('', { consortiumId: consortiumId1 }, auth);
  t.is(getMessageFromError(error), MISSING_ACTIVE_PIPELINE);

  sinon.stub(axios, 'post').resolves();

  const consortiumId2 = CONSORTIA_IDS[1];

  const run = await Mutation.createRun('', { consortiumId: consortiumId2 }, auth);
  t.is(run.consortiumId, consortiumId2);

  axios.post.restore();

  sinon.stub(axios, 'post').rejects({ code: 'ECONNREFUSED' });

  const error1 = await Mutation.createRun('', { consortiumId: consortiumId2 }, auth);
  t.is(getMessageFromError(error1), PIPELINE_SERVER_UNAVAILABLE);

  axios.post.restore();

  sinon.stub(axios, 'post').rejects(new Error('error'));

  const error2 = await Mutation.createRun('', { consortiumId: consortiumId2 }, auth);
  t.is(error2.output.payload.statusCode, 406);

  axios.post.restore();
});

test('saveActivePipeline', async (t) => {
  const auth = getAuth('author');
  const consortia = await Query.fetchAllConsortia('', {}, auth);
  const pipelines = await Query.fetchAllPipelines('', {}, auth);

  const consortiumId = consortia[0].id;
  const pipelineId = pipelines[0].id;

  const consortium = await Mutation.saveActivePipeline(auth, { consortiumId, pipelineId });

  t.deepEqual(consortium.id, consortiumId);
});

test('saveConsortium', async (t) => {
  /* saveConsortium */
  let auth = {
    credentials: { id: USER_IDS[0], username: 'test1', permissions: { } },
  };

  const consortium1 = {
    name: 'Consortium 1',
    description: 'Consortium Desc 1',
    isPrivate: false,
    owners: {},
    members: {},
    activePipelineId: PIPELINE_IDS[0],
  };

  const createdConsortium = await Mutation.saveConsortium('', { consortium: consortium1 }, auth);
  t.is(createdConsortium.name, consortium1.name);

  let error = await Mutation.saveConsortium('', { consortium: consortium1 }, auth);
  t.is(getMessageFromError(error), DUPLICATE_CONSORTIUM_ERROR);

  const consortium2 = {
    id: createdConsortium.id,
    name: 'Consortium 2',
  };

  auth = {
    credentials: {
      id: USER_IDS[0],
      username: 'test1',
      permissions: {
        consortia: {
          [createdConsortium.id]: ['owner'],
        },
      },
    },
  };

  const updatedConsortium = await Mutation.saveConsortium('', { consortium: consortium2 }, auth);
  t.is(updatedConsortium.name, consortium2.name);

  const consortium3 = {
    ...consortium1,
    id: CONSORTIA_IDS[0],
  };

  let permissions = {
    consortia: {
      [CONSORTIA_IDS[0]]: [],
    },
  };

  error = await Mutation.saveConsortium(
    '',
    { consortium: consortium3 },
    { credentials: { permissions } }
  );

  t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);

  /* deleteConsortiumById */
  const consortiumId = createdConsortium.id;

  const invalidPermissions = {
    consortia: {},
  };

  error = await Mutation.deleteConsortiumById(
    '',
    { consortiumId },
    { credentials: { permissions: invalidPermissions } }
  );
  t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);

  permissions = {
    consortia: {
      [consortiumId]: ['owner'],
    },
  };

  const deletedConsortium = await Mutation.deleteConsortiumById(
    '', { consortiumId }, { credentials: { permissions } }
  );

  t.deepEqual(deletedConsortium.id, consortiumId);
});

test('saveError', async (t) => {
  const args1 = { runId: RUN_IDS[1], error: { message: 'error' } };
  const run1 = await Mutation.saveError({}, args1);

  t.deepEqual(run1.error, args1.error);

  const args2 = { runId: '5ecc6a7ad56fb9c8ae4fddf8', error: { message: 'error' } };
  const run2 = await Mutation.saveError({}, args2);

  t.is(run2, undefined);
});

test('saveResults', async (t) => {
  const args1 = { runId: RUN_IDS[1], results: { message: 'Result' } };
  const run1 = await Mutation.saveResults({}, args1);

  t.deepEqual(run1.results, args1.results);

  const args2 = { runId: '5ecc6a7ad56fb9c8ae4fddf8', error: { message: 'Result' } };
  const run2 = await Mutation.saveResults({}, args2);

  t.is(run2, undefined);
});

test('savePipeline', async (t) => {
  /* savePipeline */
  const args1 = {
    pipeline: {
      name: 'Decentralized Pipeline',
      description: 'Test description',
      owningConsortium: CONSORTIA_IDS[0],
      shared: false,
      steps: [{
        id: 'UIKDl-',
        controller: {
          type: 'decentralized',
        },
        computations: [COMPUTATION_IDS[0]],
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

  /* deletePipeline */
  const auth = getAuth(USER_IDS[0], 'test-1');
  const pipelines = await Query.fetchAllPipelines('', {}, auth);
  const pipelineId = pipelines[0].id;
  const consortiumId = pipelines[0].owningConsortium;

  const invalidPermission = {
    consortia: {
      [consortiumId]: null,
    },
  };

  let error = await Mutation.deletePipeline(
    '', { pipelineId }, { credentials: { permissions: invalidPermission } }
  );
  t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);

  const permissions = {
    consortia: {
      [consortiumId]: ['owner'],
    },
  };

  error = await Mutation.deletePipeline(
    '', { pipelineId }, { credentials: { permissions } }
  );
  t.is(getMessageFromError(error), RUNS_ON_PIPELINE);
});

test('updateRunState', async (t) => {
  const args = {
    runId: RUN_IDS[0],
    data: {
      state: 'running',
    },
  };

  const res = await Mutation.updateRunState({}, args);

  t.deepEqual(res.remotePipelineState, args.data);
});

test('updateUserConsortiumStatus', async (t) => {
  const auth = getAuth(USER_IDS[0], 'test1');
  const consortiumId = CONSORTIA_IDS[1];
  const status = 'completed';

  const res = await Mutation.updateUserConsortiumStatus('', { consortiumId, status }, auth);

  t.is(res.consortiaStatuses[consortiumId], status);
});

test('updateConsortiumMappedUsers and updateConsortiaMappedUsers', async (t) => {
  /* updateConsortiumMappedUsers */
  const auth = getAuth(USER_IDS[0], 'test1');
  const args = {
    consortiumId: CONSORTIA_IDS[0],
    isMapped: true,
  };

  let res = await Mutation.updateConsortiumMappedUsers('', args, auth);

  t.is(String(res.mappedForRun), String(USER_IDS[0]));

  /* updateConsortiaMappedUsers */
  args.isMapped = false;
  res = await Mutation.updateConsortiaMappedUsers('', args, auth);
  t.is(res, undefined);
});

test('updatePassword', async (t) => {
  const auth = getAuth(USER_IDS[0], 'test1');

  let args = {
    currentPassword: 'admin',
    newPassword: 'admin123',
  };

  let res = await Mutation.updatePassword('', args, auth);
  t.is(getMessageFromError(res), INVALID_PASSWORD);

  args = {
    currentPassword: 'password',
    newPassword: 'admin',
  };

  res = await Mutation.updatePassword('', args, auth);

  const user = await helperFunctions.getUserDetailsByID(USER_IDS[0]);
  const isValid = await helperFunctions.verifyPassword(args.newPassword, user.passwordHash);

  t.true(isValid);
});

test('saveMessage and setReadMessage', async (t) => {
  /* saveMessage */
  const auth = getAuth(USER_IDS[0], 'test1');

  const args1 = {
    title: 'Test Thread',
    recipients: ['test2', 'test3'],
    content: 'Test Thread Content',
    action: {
      type: 'share-result',
      detail: {
        id: RUN_IDS[0],
      },
    },
  };

  const res1 = await Mutation.saveMessage('', args1, auth);

  t.is(res1.title, args1.title);

  let threads = await Query.fetchAllThreads('', {}, auth);
  const args2 = {
    threadId: threads[0].id,
    recipients: ['author', 'test4'],
    content: 'Content 2',
  };

  const res2 = await Mutation.saveMessage('', args2, auth);

  t.is(res2.messages.length, 2);

  /* setReadMessage */
  threads = await Query.fetchAllThreads('', {}, auth);

  const args = {
    threadId: threads[0].id,
    userId: 'test2',
  };

  const res = await Mutation.setReadMessage({}, args);

  t.true(res.users[args.userId].isRead);
});

test('joinConsortium', async (t) => {
  const userId = USER_IDS[0];
  const username = 'test1';

  const auth = getAuth(userId, username);
  const consortiumId1 = CONSORTIA_IDS[0];

  const res1 = await Mutation.joinConsortium('', { consortiumId: consortiumId1 }, auth);
  t.deepEqual(res1.id, userId.toHexString());

  const consortiumId2 = CONSORTIA_IDS[1];
  const res2 = await Mutation.joinConsortium('', { consortiumId: consortiumId2 }, auth);
  t.deepEqual(res2._id, consortiumId2);
});

test('leaveConsortium', async (t) => {
  const userId = USER_IDS[0];
  const username = 'test1';
  const auth = getAuth(userId, username);
  const consortiumId = CONSORTIA_IDS[0];

  const res = await Mutation.leaveConsortium('', { consortiumId }, auth);

  t.deepEqual(res.id, userId.toHexString());
});

test('removeComputation', async (t) => {
  const auth1 = getAuth(USER_IDS[0], 'test1');
  const computationId = COMPUTATION_IDS[0];

  const error = await Mutation.removeComputation('', { computationId }, auth1);
  t.is(getMessageFromError(error), ACTION_PERMIT_ERROR);

  const auth2 = getAuth(USER_IDS[5], 'author');
  const res = await Mutation.removeComputation('', { computationId }, auth2);

  t.deepEqual(res.id, computationId.toHexString());
});

test('createIssue', async (t) => {
  const auth = getAuth(USER_IDS[0], 'test1');
  const args = {
    issue: {
      title: 'Test Issue',
      body: 'test issue',
    },
  };

  sinon.stub(Issue.prototype, 'createIssue').rejects();

  const res = await Mutation.createIssue('', args, auth);
  t.is(getMessageFromError(res), FAILED_CREATE_ISSUE);
});

test.after.always('cleanup', async () => {
  await database.dropDbInstance();
  await database.close();
});
