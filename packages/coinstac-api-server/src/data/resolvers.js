const Boom = require('boom');
const GraphQLJSON = require('graphql-type-json');
const axios = require('axios');
const { get, keys } = require('lodash');
const Issue = require('github-api/dist/components/Issue');
const { PubSub, withFilter } = require('graphql-subscriptions');
const { ObjectID } = require('mongodb');
const helperFunctions = require('../auth-helpers');
const { headlessClients: headlessClientsController } = require('./controllers');
const initSubscriptions = require('./subscriptions');
const database = require('../database');
const { transformToClient } = require('../utils');

const {
  eventEmitter,
  COMPUTATION_CHANGED,
  COMPUTATION_DELETED,
  CONSORTIUM_CHANGED,
  CONSORTIUM_DELETED,
  CONSORTIUM_PIPELINE_CHANGED,
  PIPELINE_CHANGED,
  PIPELINE_DELETED,
  RUN_CHANGED,
  RUN_DELETED,
  RUN_STARTED,
  RUN_WITH_HEADLESS_CLIENT_STARTED,
  THREAD_CHANGED,
  USER_CHANGED,
} = require('./events');
const { getOnlineUsers } = require('./user-online-status-tracker');
const { NotAuthorizedError } = require('./errors');

const AVAILABLE_ROLE_TYPES = ['data', 'app'];
const AVAILABLE_USER_APP_ROLES = ['admin', 'author'];

async function fetchOnePipeline(id) {
  const db = database.getDbInstance();

  const pipelineSteps = await db.collection('pipelines').aggregate([
    { $match: { _id: id } },
    { $unwind: '$steps' },
    {
      $lookup: {
        from: 'computations',
        localField: 'steps.computations',
        foreignField: '_id',
        as: 'steps.computations',
      },
    },
  ]);

  const hasSteps = await pipelineSteps.hasNext();
  if (!hasSteps) {
    /* istanbul ignore next */
    return db.collection('pipelines').findOne({ _id: id });
  }

  let pipe = null;
  do {
    const currentStep = await pipelineSteps.next(); // eslint-disable-line no-await-in-loop

    if (!pipe) {
      pipe = {
        ...currentStep,
        steps: [],
      };
    }

    currentStep.steps.computations = transformToClient(currentStep.steps.computations);

    pipe.steps.push(currentStep.steps);
  } while (await pipelineSteps.hasNext()); // eslint-disable-line no-await-in-loop

  return pipe;
}

/**
 * Helper function for add permissions to an user
 * @param {object} args - Update object
 * @param {string} args.userId - Id of the user which will have permissions changed
 * @param {string} args.role - Role of the user
 * @param {string} args.doc - Id of the document for which the user will gain access
 * @param {string} args.table - Table of the document for which the user will gain access
 */
async function addUserPermissions(args) {
  const db = database.getDbInstance();

  const { role, doc, table } = args;

  const updateObj = {
    $addToSet: {
      [`permissions.${table}.${doc}`]: role,
    },
  };

  if (table === 'consortia') {
    let { userName } = args;

    if (!userName) {
      const user = await helperFunctions.getUserDetailsByID(args.userId);
      userName = user.username;
    }

    updateObj.$set = {
      [`consortiaStatuses.${doc}`]: 'none',
    };

    const consortiaUpdateObj = {
      $set: {
        [`${role}s.${args.userId}`]: userName,
      },
    };

    if (role === 'member') {
      consortiaUpdateObj.$set[`activeMembers.${args.userId}`] = userName;
    }

    const consortiaUpdateResult = await db.collection('consortia').findOneAndUpdate(
      { _id: doc },
      consortiaUpdateObj,
      { returnDocument: 'after' }
    );

    eventEmitter.emit(CONSORTIUM_CHANGED, consortiaUpdateResult.value);
  }

  const userUpdateResult = await db.collection('users').findOneAndUpdate({ _id: args.userId }, updateObj, { returnOriginal: false });

  eventEmitter.emit(USER_CHANGED, userUpdateResult.value);
}

async function removeUserPermissions(args) {
  const db = database.getDbInstance();

  const user = await db.collection('users').findOne({ _id: args.userId }, {
    projection: { permissions: 1 },
  });

  const { permissions } = user;
  const index = permissions[args.table][args.doc].findIndex(p => p === args.role);
  if (index >= 0) {
    permissions[args.table][args.doc].splice(index, 1);
  }

  let userUpdateResult;

  if (permissions[args.table][args.doc].length === 0) {
    const updateObj = {
      $unset: {
        [`permissions.${args.table}.${args.doc}`]: '',
      },
    };

    if (args.table === 'consortia') {
      updateObj.$unset[`consortiaStatuses.${args.doc}`] = '';
    }

    userUpdateResult = await db.collection('users').findOneAndUpdate({ _id: args.userId }, updateObj, { returnOriginal: false });
  } else {
    userUpdateResult = await db.collection('users').findOneAndUpdate({ _id: args.userId }, {
      $pull: { [`permissions.${args.table}.${args.doc}`]: args.role },
    }, {
      returnOriginal: false,
    });
  }

  eventEmitter.emit(USER_CHANGED, userUpdateResult.value);

  if (args.table === 'consortia') {
    const updateObj = {
      $unset: {
        [`${args.role}s.${args.userId}`]: userUpdateResult.value.username,
      },
    };
    if (permissions[args.table][args.doc].length === 0) {
      updateObj.$pull = Object.assign(updateObj.$pull || {}, { mappedForRun: args.userId });
    }

    if (args.role === 'member') {
      updateObj.$unset[`activeMembers.${args.userId}`] = '';
    }

    const consortiaUpdateResult = await db.collection('consortia').findOneAndUpdate({ _id: args.doc }, updateObj, { returnDocument: 'after' });
    eventEmitter.emit(CONSORTIUM_CHANGED, consortiaUpdateResult.value);
  }
}

async function changeUserAppRole(args, addOrRemove) {
  const db = database.getDbInstance();
  const { userId, role } = args;

  const userUpdateResult = await db.collection('users').findOneAndUpdate({ _id: ObjectID(userId) }, {
    $set: {
      [`permissions.roles.${role}`]: addOrRemove === 'add',
    },
  }, {
    returnOriginal: false,
  });
  eventEmitter.emit(USER_CHANGED, userUpdateResult.value);
}

async function filterComputationsByMetaId(db, metaId) {
  const results = await db.collection('computations').find({ 'meta.id': metaId }).toArray();

  return transformToClient(results);
}

function isAdmin(permissions) {
  return get(permissions, 'roles.admin', false);
}

function isAuthor(permissions) {
  return get(permissions, 'roles.author', false);
}

function isAllowedForComputationChange(permissions) {
  return isAdmin(permissions) || isAuthor(permissions);
}

const pubsub = new PubSub();

initSubscriptions(pubsub);

/* eslint-disable */
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    /**
     * Returns all results.
     * @return {array} All results
     */
    fetchAllResults: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();
      let results;
      if (!isAdmin(credentials.permissions)) {
        results = await db.collection('runs').find({
          $or: [
            { [`observers.${credentials.id}`]: { $exists: true } },
            { [`clients.${credentials.id}`]: { $exists: true } },
            { sharedUsers: credentials.id }
          ],
        }
        ).toArray();
      } else {
        results = await db.collection('runs').find().toArray();
      }
      return transformToClient(results);
    },
    /**
       * Returns single pipeline
       * @param {object} args
       * @param {string} args.resultId  Requested pipeline ID
       * @return {object} Requested pipeline if id present, null otherwise
       */
    fetchResult: async (_, args) => {
      if (!args.resultId) {
        return null;
      }
      const db = database.getDbInstance();

      let result;
      if (!isAdmin(credentials.permissions)) {
        results = await db.collection('runs').find({
          _id: ObjectID(args.resultId),
          $or: [
            { [`observers.${credentials.id}`]: { $exists: true } },
            { [`clients.${credentials.id}`]: { $exists: true } },
            { sharedUsers: credentials.id }
          ],
        }
        ).toArray();
      } else {
        await db.collection('runs').findOne({ _id: ObjectID(args.resultId) });
      }

      return transformToClient(result);
    },
    /**
     * Fetches all public consortia and private consortia for which the current user has access
     * @return {array} All consortia to which the current user access
     */
    fetchAllConsortia: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();

      const consortia = await db.collection('consortia').find({
        $or: [
          { isPrivate: false },
          { [`members.${credentials.id}`]: credentials.username }
        ]
      }).toArray();

      return transformToClient(consortia);
    },
    /**
     * Returns single consortium.
     * @param {object} args
     * @param {string} args.consortiumId Requested consortium ID
     * @return {object} Requested consortium if id present, null otherwise
     */
    fetchConsortium: async (_, args, { credentials }) => {
      if (!args.consortiumId) {
        return null;
      }

      const db = database.getDbInstance();

      const consortium = await db.collection('consortia').findOne({
        _id: ObjectID(args.consortiumId),
        $or: [
          { isPrivate: false },
          { members: { [credentials.id]: credentials.username } }
        ]
      });
      return transformToClient(consortium);
    },
    /**
     * Returns all computations.
     * @return {array} All computations
     */
    fetchAllComputations: async (_, { preprocess }) => {
      const db = database.getDbInstance();

      let computations;
      if (preprocess != null) {
        computations = await db.collection('computations').find({ "meta.preprocess": preprocess }).toArray();
      }
      else {
        computations = await db.collection('computations').find().toArray();
      }
      return transformToClient(computations);
    },
    /**
     * Returns metadata for specific computation name
     * @param {object} args
     * @param {array} args.computationIds Requested computation ids
     * @return {array} List of computation objects
     */
    fetchComputation: async (_, { computationIds }) => {
      if (!Array.isArray(computationIds) || computationIds.length === 0) {
        return null;
      }

      const db = database.getDbInstance();

      const computations = await db.collection('computations').find({
        _id: { $in: computationIds.map(id => ObjectID(id)) }
      }).toArray();

      return transformToClient(computations);
    },
    /**
     * Returns all pipelines.
     * @return {array} List of all pipelines
     */
    fetchAllPipelines: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();

      const pipelineSteps = await db.collection('pipelines').aggregate([
        { $unwind: '$steps' },
        {
          $lookup: {
            from: 'computations',
            localField: 'steps.computations',
            foreignField: '_id',
            as: 'steps.computations',
          },
        },
      ]);

      const pipelines = {};
      while (await pipelineSteps.hasNext()) {
        const currentStep = await pipelineSteps.next();

        if (!(currentStep._id in pipelines)) {
          pipelines[currentStep._id] = {
            ...currentStep,
            steps: [],
          };
        }

        currentStep.steps.computations = transformToClient(currentStep.steps.computations);

        pipelines[currentStep._id].steps.push(currentStep.steps);
      }

      const steplessPipelines = await db.collection('pipelines').find({
        steps: { $size: 0 }
      }).toArray();

      steplessPipelines.forEach(p => pipelines[p._id] = p);

      const accessibleConsortia = await db.collection('consortia').find({ [`members.${credentials.id}`]: { $exists: true } }).toArray();
      const consortiaIds = accessibleConsortia.map(consortium => String(consortium._id));
      const res = Object.values(pipelines).filter(pipeline =>
        consortiaIds.includes(String(pipeline.owningConsortium)) || pipeline.shared
      );

      return transformToClient(res);
    },
    /**
     * Returns single pipeline
     * @param {object} args
     * @param {string} args.pipelineId  Requested pipeline ID
     * @return {object} Requested pipeline if id present, null otherwise
     */
    fetchPipeline: async (_, args, { credentials }) => {
      const db = database.getDbInstance();

      if (!args.pipelineId) {
        return null;
      }

      const pipeline = await fetchOnePipeline(ObjectID(args.pipelineId));
      const memberConsortia = await db.collection('consortia').find({ [`members.${credentials.id}`]: { $exists: true } }).toArray();
      const consortiaIds = memberConsortia.map(consortium => String(consortium._id));
      let res = Object.values(pipeline);
      if (!isAdmin(credentials.permissions)
        && !(consortiaIds.includes(String(pipeline.owningConsortium)) && !pipeline.shared)
      ) {
        return Boom.forbidden('Action not permitted');
      }

      return transformToClient(pipeline);
    },
    /**
     * Returns single user.
     * @param {object} args
     * @param {string} args.userId Requested user ID, restricted to authenticated user for time being
     * @return {object} Requested user if id present, null otherwise
     */
    fetchUser: (_, args) => {
      return helperFunctions.getUserDetailsByID(args.userId);
    },
    fetchAllUsers: async () => {
      const db = database.getDbInstance();

      const users = await db.collection('users').find().toArray();

      return transformToClient(users);
    },
    fetchAllUserRuns: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();

      let runs;

      if (isAdmin(credentials.permissions)) {
        runs = await db.collection('runs').find().toArray();
      } else {
        runs = await db.collection('runs').find({
          $or: [
            { [`observers.${credentials.id}`]: { $exists: true } },
            { [`clients.${credentials.id}`]: { $exists: true } },
            { sharedUsers: credentials.id }
          ]
        }).toArray();
      }

      return transformToClient(runs);
    },
    fetchAllThreads: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();

      const threads = await db.collection('threads').find({
        [`users.${credentials.id}`]: { $exists: true }
      }).toArray();

      return transformToClient(threads);
    },
    fetchUsersOnlineStatus: async (parent, args, { credentials }) => {
      // Find the users that are in the same consortia as the logged user
      const db = database.getDbInstance();

      const user = await helperFunctions.getUserDetailsByID(credentials.id);

      const consortiaIds = keys(user.permissions.consortia).map(id => ObjectID(id));
      const consortia = await db.collection('consortia').find(
        { _id: { $in: consortiaIds } },
        { projection: { members: 1 } }
      ).toArray();

      const allUsersStatus = getOnlineUsers();
      const relatedUsersStatus = {};

      consortia.forEach((consortium) => {
        keys(consortium.members).forEach((memberId) => {
          if (!(memberId in relatedUsersStatus)) {
            relatedUsersStatus[memberId] = allUsersStatus[memberId] || false;
          }
        });
      });

      return getOnlineUsers();
    },
    fetchAllHeadlessClients: async () => {
      const headlessClients = await headlessClientsController.fetchAllHeadlessClients();

      return transformToClient(headlessClients);
    },
    fetchAccessibleHeadlessClients: async (parent, args, { credentials }) => {
      const headlessClients = await headlessClientsController.fetchAccessibleHeadlessClients(credentials);

      return transformToClient(headlessClients);
    },
    fetchHeadlessClient: async (parent, { id }, { credentials }) => {
      try {
        const headlessClient = await headlessClientsController.fetchHeadlessClient(id, credentials);

        return headlessClient ? transformToClient(headlessClient) : null;
      } catch (error) {
        return Boom.internal(`Failed to fetch the headless client ${id}`, error);
      }
    },
    fetchHeadlessClientConfig: async (parent, args, { credentials }) => {
      try {
        const headlessClientConfig = await headlessClientsController.fetchHeadlessClientConfig(credentials);

        return headlessClientConfig ? headlessClientConfig.computationWhitelist : null;
      } catch (error) {
        return Boom.internal(`Failed to fetch the headless client ${id}`, error);
      }
    },
    fetchAllDatasetsSubjectGroups: async () => {
      const db = database.getDbInstance();

      const result = await db.collection('datasets').aggregate([
        { $unwind: '$otherInfo.subjectGroups' },
        { $group: { _id: null, subjectGroups: { $addToSet: '$otherInfo.subjectGroups' } } },
        { $unwind: '$subjectGroups' },
        { $sort: { subjectGroups: 1 } },
        { $group: { _id: null, subjectGroups: { $push: '$subjectGroups' } } },
      ]).toArray();

      return result.length ? result[0].subjectGroups : [];
    },
    searchDatasets: async (parent, { searchString = '', subjectGroups = [], modality = '' }) => {
      const db = database.getDbInstance();

      const searchObj = {};

      if (searchString) {
        searchObj.$text = {
          $search: searchString
        };
      }

      if (subjectGroups && subjectGroups.length) {
        searchObj['otherInfo.subjectGroups'] = { $all: subjectGroups };
      }

      if (modality) {
        searchObj['otherInfo.modality'] = modality;
      }

      const datasets = await db.collection('datasets').find(searchObj).toArray();

      return transformToClient(datasets);
    },
    fetchDataset: async (parent, { id }) => {
      const db = database.getDbInstance();

      const dataset = await db.collection('datasets').findOne({ _id: ObjectID(id) });

      return transformToClient(dataset);
    },
    fetchRun: async (parent, { runId }, { credentials }) => {
      const db = database.getDbInstance();

      let run;

      if (isAdmin(credentials.permissions)) {
        run = await db.collection('runs').findOne({ _id: ObjectID(runId) });
      } else {
        run = await db.collection('runs').findOne({
          _id: ObjectID(runId),
          $or: [
            { [`observers.${credentials.id}`]: { $exists: true } },
            { [`clients.${credentials.id}`]: { $exists: true } },
            { sharedUsers: credentials.id }
          ]
        });
      }

      if (!run) {
        return null
      }

      return transformToClient(run);
    },
    getPipelines: async (parent, args, { credentials }) => {
      let result = [];
      if (isAdmin(credentials.permissions)) {
        result = await axios.get(
          `http://${process.env.PIPELINE_SERVER_HOSTNAME}:${process.env.PIPELINE_SERVER_PORT}/getPipelines`
        );
      }

      return { info: JSON.stringify(result.data) };
    }
  },
  Mutation: {
    /**
     * Add computation to database
     * @param {object} args
     * @param {object} args.computationSchema Computation object to add/update
     * @return {object} New computation object
     */
    addComputation: async (parent, args, { credentials }) => {
      const { permissions } = credentials;
      const { computationSchema } = args;

      if (!isAllowedForComputationChange(permissions)) {
        return Boom.forbidden('Action not permitted');
      }

      const db = database.getDbInstance();

      const filteredComputations = await filterComputationsByMetaId(db, computationSchema.meta.id);

      if (filteredComputations.length === 0) {
        const result = await db.collection('computations').insertOne({
          ...computationSchema,
          submittedBy: credentials.id,
        });

        const computation = result.ops[0];

        eventEmitter.emit(COMPUTATION_CHANGED, computation);

        return transformToClient(computation);
      }

      if (filteredComputations.length === 1) {
        const computation = filteredComputations[0];

        if (computation.submittedBy !== credentials.id && !isAdmin(credentials.permissions)) {
          return Boom.forbidden('Incorrect permissions to update computation');
        }

        const updatedComputationResult = await db.collection('computations').findOneAndUpdate({
          _id: ObjectID(computation.id)
        }, {
          $set: computationSchema,
        }, {
          returnOriginal: false,
        });

        eventEmitter.emit(COMPUTATION_CHANGED, updatedComputationResult.value);

        return transformToClient(updatedComputationResult.value);
      }
    },
    /**
     * Add new user role to user perms, currently consortia perms only
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.doc Id of the document to add role to
     * @param {string} args.role Role to add to perms
     * @param {string} args.userId Id of the user to be added
     * @param {string} args.roleType Type of role to add
     * @return {object} Updated user object
     */
    addUserRole: async (parent, args, { credentials }) => {
      const { permissions } = credentials;

      if (credentials.id === args.userId) {
        return Boom.forbidden('You cannot change your own permissions');
      }

      if (AVAILABLE_ROLE_TYPES.indexOf(args.roleType) === -1) {
        return Boom.forbidden('Invalid role type');
      }

      if (args.roleType === 'data') {
        const documentPermissions = permissions[args.table][args.doc];
        if (!documentPermissions || !documentPermissions.includes('owner')) {
          return Boom.forbidden('Action not permitted');
        }

        await addUserPermissions({ doc: ObjectID(args.doc), role: args.role, userId: ObjectID(args.userId), table: args.table });
      }

      if (args.roleType === 'app') {
        if (!isAdmin(permissions) || (AVAILABLE_USER_APP_ROLES.indexOf(args.role) === -1)) {
          return Boom.forbidden('Action not permitted');
        }

        await changeUserAppRole(args, 'add');
      }

      return helperFunctions.getUserDetailsByID(args.userId);
    },
    /**
     * Add run to database
     * @param {String} consortiumId Run object to add/update
     * @return {object} New/updated run object
     */
    createRun: async (parent, { consortiumId }, { credentials }) => {
      if (!credentials) {
        return Boom.unauthorized('User not authenticated');
      }

      const db = database.getDbInstance();

      const consortium = await db.collection('consortia').findOne({
        _id: ObjectID(consortiumId)
      });

      if (!consortium) {
        return Boom.notFound('Consortium with provided id not found');
      }

      if (!credentials.permissions.consortia[consortiumId].includes('owner')) {
        return Boom.forbidden('Action not permitted');
      }

      const pipeline = await fetchOnePipeline(consortium.activePipelineId);

      if (!pipeline) {
        return Boom.notFound('Active pipeline not found on this consortium');
      }

      const participatingVaults = await db.collection('headlessClients').find(
        { _id: { $in: Object.keys(consortium.activeMembers).map((id) => ObjectID(id)) } },
        { projection: { _id: 1 } },
      ).toArray();
      if (participatingVaults.length > 0) {
        const onlineUsers = getOnlineUsers();

        const isAnyVaultOffline = participatingVaults.reduce((hasOfflineVault, vault) =>
          hasOfflineVault || !(vault._id in onlineUsers),
          false
        );

        if (isAnyVaultOffline) {
          return Boom.internal('One of the participating vaults is offline. Please contact TReNDS personnel.', { errorCode: 'VAULT_OFFLINE' })
        }
      }

      try {
        const runClients = { ...consortium.activeMembers };

        const result = await db.collection('runs').insertOne({
          clients: runClients,
          observers: {
            ...consortium.members,
          },
          consortiumId,
          pipelineSnapshot: pipeline,
          startDate: Date.now(),
          type: 'decentralized',
          status: 'started'
        });

        const run = transformToClient(result.ops[0]);

        await axios.post(
          `http://${process.env.PIPELINE_SERVER_HOSTNAME}:${process.env.PIPELINE_SERVER_PORT}/startPipeline`, { run }
        );

        eventEmitter.emit(RUN_CHANGED, run);
        eventEmitter.emit(RUN_STARTED, run);

        if (pipeline.headlessMembers) {
          eventEmitter.emit(RUN_WITH_HEADLESS_CLIENT_STARTED, run);
        }

        return run;
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          return Boom.serverUnavailable('Pipeline server unavailable');
        }

        return Boom.notAcceptable(error);
      }
    },
    /**
     * Deletes consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to delete
     * @return {object} Deleted consortium
     */
    deleteConsortiumById: async (parent, args, { credentials: { permissions } }) => {
      if (!permissions.consortia[args.consortiumId] || !permissions.consortia[args.consortiumId].includes('owner')) {
        return Boom.forbidden('Action not permitted');
      }

      const db = database.getDbInstance();

      const deletedConsortiumResult = await db.collection('consortia').findOneAndDelete({ _id: ObjectID(args.consortiumId) });

      eventEmitter.emit(CONSORTIUM_DELETED, deletedConsortiumResult.value);

      const userIds = await db.collection('users').find({
        [`permissions.consortia.${args.consortiumId}`]: { $exists: true }
      }, {
        projection: { _id: 1 }
      }).toArray();

      await db.collection('users').updateMany({
        [`permissions.consortia.${args.consortiumId}`]: { $exists: true }
      }, {
        $unset: {
          [`permissions.consortia.${args.consortiumId}`]: '',
          [`consortiaStatuses.${args.consortiumId}`]: ''
        }
      });

      const users = await db.collection('users').find({ _id: { $in: userIds.map(u => u._id) } }).toArray();

      eventEmitter.emit(USER_CHANGED, users);

      const pipelines = await db.collection('pipelines').find({
        owningConsortium: ObjectID(args.consortiumId)
      }).toArray();

      if (pipelines.length > 0) {
        await db.collection('pipelines').deleteMany({
          owningConsortium: ObjectID(args.consortiumId)
        });

        eventEmitter.emit(PIPELINE_DELETED, pipelines.map((pipe) => ({
          id: pipe._id
        })));
      }

      const runs = await db.collection('runs').find({
        consortiumId: args.consortiumId,
        endDate: null,
      }).toArray();

      if (runs.length) {
        await db.collection('runs').deleteMany({
          consortiumId: args.consortiumId,
          endDate: null,
        });

        eventEmitter.emit(RUN_DELETED, runs);
        runs.forEach(async (run) => {
          try {
            await axios.post(
              `http://${process.env.PIPELINE_SERVER_HOSTNAME}:${process.env.PIPELINE_SERVER_PORT}/stopPipeline`, { runId: run._id.valueOf() }
            );
          } catch (e) { }
        });
      }

      return transformToClient(deletedConsortiumResult.value);
    },
    /**
     * Deletes pipeline
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.pipelineId Pipeline id to delete
     * @return {object} Deleted pipeline
     */
    deletePipeline: async (parent, args, { credentials: { permissions } }) => {
      const db = database.getDbInstance();

      const pipelineId = ObjectID(args.pipelineId);

      const pipeline = await db.collection('pipelines').findOne({ _id: pipelineId });

      if (!permissions.consortia[pipeline.owningConsortium] ||
        !permissions.consortia[pipeline.owningConsortium].includes('owner')
      ) {
        return Boom.forbidden('Action not permitted')
      }

      const runsCount = await db.collection('runs').countDocuments({
        'pipelineSnapshot.id': args.pipelineId
      });

      if (runsCount > 0) {
        return Boom.badData('Runs on this pipeline exist')
      }

      const deletePipelineResult = await db.collection('pipelines').findOneAndDelete({ _id: pipelineId });
      eventEmitter.emit(PIPELINE_DELETED, {
        id: deletePipelineResult.value._id
      });

      const updateObj = {
        $unset: { activePipelineId: '' }
      };

      if (pipeline.headlessMembers) {
        Object.keys(pipeline.headlessMembers).forEach((headlessMemberId) => {
          updateObj.$unset[`activeMembers.${headlessMemberId}`] = '';
        });
      }

      const updateConsortiumResult = await db.collection('consortia').findOneAndUpdate(
        { activePipelineId: pipelineId },
        updateObj,
        { returnDocument: 'after' }
      );

      if (updateConsortiumResult.value) {
        eventEmitter.emit(CONSORTIUM_CHANGED, updateConsortiumResult.value);
      }

      return transformToClient(deletePipelineResult.value);
    },
    /**
     * Add logged user to consortium members list
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to join
     * @return {object} Updated consortium
     */
    joinConsortium: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();
      const userId = credentials.id;

      const consortium = await db.collection('consortia').findOne({ _id: ObjectID(args.consortiumId) });
      const ownerIds = Object.keys(consortium.owners);

      const isOwner = ownerIds.includes(userId);

      if (credentials.id in consortium.members) {
        return consortium;
      }

      if (consortium.isPrivate && !isOwner) {
        return Boom.forbidden('Action not permitted');
      }

      await addUserPermissions({ userId: ObjectID(credentials.id), userName: credentials.username, role: 'member', doc: ObjectID(args.consortiumId), table: 'consortia' });

      return helperFunctions.getUserDetails(credentials.username);
    },
    /**
     * Approve or reject consortium join request
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id that has join request
     * @param {string} args.userId User id to join consortium
     * @return {object} Updated consortium
     */
    approveOrRejectConsortiumJoinRequest: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();
      const { id: currentUserId } = credentials;

      const { consortiumId, userId, isApprove } = args;

      const consortium = await db.collection('consortia').findOne({ _id: ObjectID(consortiumId) });
      if (!consortium) {
        return Boom.forbidden('Invalid consortium');
      }

      const ownerIds = Object.keys(consortium.owners);

      if (!ownerIds.includes(currentUserId)) {
        return Boom.forbidden('Action not permitted');
      }

      const userToAdd = await helperFunctions.getUserDetailsByID(userId);
      if (!userToAdd) {
        return Boom.forbidden('Invalid user');
      }

      if (isApprove) {
        await addUserPermissions({
          userId: ObjectID(userId),
          userName: userToAdd.username,
          role: 'member',
          doc: ObjectID(consortiumId),
          table: 'consortia',
        });
      }

      const updateObj = {
        $unset: {
          [`joinRequests.${userId}`]: '',
        },
      };

      const consortiaUpdateResult = await db.collection('consortia').findOneAndUpdate(
        { _id: ObjectID(consortiumId) },
        updateObj,
        { returnDocument: 'after' }
      );

      eventEmitter.emit(CONSORTIUM_CHANGED, consortiaUpdateResult.value);

      return transformToClient(consortiaUpdateResult.value);
    },
    /**
     * Send consortium join request
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id that has join request
     * @return {object} Updated consortium
     */
    sendConsortiumJoinRequest: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();
      const { id: currentUserId } = credentials;

      const { consortiumId } = args;

      const consortium = await db.collection('consortia').findOne({ _id: ObjectID(consortiumId) });
      if (!consortium) {
        return Boom.forbidden('Invalid consortium');
      }

      const user = await helperFunctions.getUserDetailsByID(currentUserId);

      const updateObj = {
        $set: {
          [`joinRequests.${currentUserId}`]: user.username,
        },
      };

      const consortiaUpdateResult = await db.collection('consortia').findOneAndUpdate(
        { _id: ObjectID(consortiumId) },
        updateObj,
        { returnDocument: 'after' }
      );

      eventEmitter.emit(CONSORTIUM_CHANGED, consortiaUpdateResult.value);

      return transformToClient(consortiaUpdateResult.value);
    },
    /**
     * Remove logged user from consortium members list
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to join
     * @return {object} Updated consortium
     */
    leaveConsortium: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();
      const consortium = await db.collection('consortia').findOne({ _id: ObjectID(args.consortiumId) });

      const userId = credentials.id;
      const ownerIds = Object.keys(consortium.owners);

      const isOwner = ownerIds.includes(userId);

      if (isOwner && ownerIds.length <= 1) {
        return Boom.forbidden('User is the only owner of this consortium');
      }

      await removeUserPermissions({ userId: ObjectID(credentials.id), role: 'member', doc: ObjectID(args.consortiumId), table: 'consortia' });

      if (isOwner) {
        await removeUserPermissions({ userId: ObjectID(credentials.id), role: 'owner', doc: ObjectID(args.consortiumId), table: 'consortia' });
      }

      return helperFunctions.getUserDetails(credentials.username);
    },
    /**
     * Deletes computation
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.computationId Computation id to delete
     * @return {object} Deleted computation
     */
    removeComputation: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();
      const computation = await db.collection('computations').findOne({ _id: ObjectID(args.computationId) });

      if (!computation) {
        return Boom.forbidden('Cannot find computation');
      }

      if (computation.submittedBy !== credentials.username && !isAdmin(credentials.permissions)) {
        return Boom.forbidden('Action not permitted');
      }

      const deleteComputationResult = await db.collection('computations').findOneAndDelete({ _id: ObjectID(args.computationId) });

      eventEmitter.emit(COMPUTATION_DELETED, deleteComputationResult.value);

      return transformToClient(deleteComputationResult.value);
    },
    /**
     * Add new user role to user perms, currently consortia perms only
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.userId Id of the user who will have permissions removed
     * @param {string} args.table Table of the document to add role to
     * @param {string} args.doc Id of the document to add role to
     * @param {string} args.role Role to add to perms
     * @param {string} args.userId Id of the user to be removed
     * @param {string} args.roleType Type of role to add
     * @return {object} Updated user object
     */
    removeUserRole: async (parent, args, { credentials }) => {
      const { permissions } = credentials;

      if (credentials.id === args.userId) {
        return Boom.forbidden('You cannot remove your own permissions');
      }

      if (AVAILABLE_ROLE_TYPES.indexOf(args.roleType) === -1) {
        return Boom.forbidden('Invalid role type');
      }

      if (args.roleType === 'data') {
        if (!permissions[args.table][args.doc] || !permissions[args.table][args.doc].includes('owner')) {
          return Boom.forbidden('Action not permitted');
        }

        await removeUserPermissions({ doc: ObjectID(args.doc), role: args.role, userId: ObjectID(args.userId), table: args.table });
      }

      if (args.roleType === 'app') {
        if (!isAdmin(permissions) || (AVAILABLE_USER_APP_ROLES.indexOf(args.role) === -1)) {
          return Boom.forbidden('Action not permitted');
        }

        await changeUserAppRole(args, 'remove');
      }

      return helperFunctions.getUserDetailsByID(args.userId);
    },
    /**
     * Sets active pipeline on consortia object
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium to update
     * @param {string} args.activePipelineId Pipeline ID to mark as active
     */
    saveActivePipeline: async (_, args, { credentials }) => {
      const { permissions } = credentials;
      const db = database.getDbInstance();

      const consortium = await db.collection('consortia').findOne({ _id: ObjectID(args.consortiumId) });

      const pipeline = args.activePipelineId ? await db.collection('pipelines').findOne({ _id: ObjectID(args.activePipelineId) }) : null;

      if (pipeline &&
        !permissions.consortia[pipeline.owningConsortium] &&
        !permissions.consortia[pipeline.owningConsortium].includes('owner')
      ) {
        return Boom.forbidden('Action not permitted')
      }

      if (consortium.activePipelineId) {
        const oldPipeline = await db.collection('pipelines').findOne({ _id: consortium.activePipelineId });

        if (oldPipeline && oldPipeline.headlessMembers) {
          const oldPipelineUpdateObj = {
            $unset: {},
          };

          Object.keys(oldPipeline.headlessMembers).forEach((headlessMemberId) => {
            oldPipelineUpdateObj.$unset[`activeMembers.${headlessMemberId}`] = '';
          });

          await db.collection('consortia').updateOne(
            { _id: ObjectID(args.consortiumId) },
            oldPipelineUpdateObj
          );
        }
      }

      const updateObj = {
        $set: {
          activePipelineId: args.activePipelineId ? ObjectID(args.activePipelineId) : null,
          mappedForRun: []
        }
      };

      if (pipeline && pipeline.headlessMembers) {
        // Sets only the vault users as the default active members
        updateObj.$set.activeMembers = {
          ...pipeline.headlessMembers
        };
      }

      const result = await db.collection('consortia').findOneAndUpdate(
        { _id: ObjectID(args.consortiumId) },
        updateObj,
        { returnOriginal: false }
      );

      eventEmitter.emit(CONSORTIUM_PIPELINE_CHANGED, result.value);

      return transformToClient(result.value);
    },
    /**
     * Saves consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.consortium Consortium object to add/update
     * @return {object} New/updated consortium object
     */
    saveConsortium: async (parent, args, { credentials }) => {
      const { permissions } = credentials;

      const isUpdate = !!args.consortium.id;

      if (isUpdate && !permissions.consortia[args.consortium.id].includes('owner')) {
        return Boom.forbidden('Action not permitted');
      }

      const db = database.getDbInstance();

      const consortiumData = Object.assign(
        { ...args.consortium },
        !isUpdate && {
          createDate: Date.now(),
          activeMembers: args.consortium.members,
        },
      );

      if (!isUpdate) {
        const count = await db.collection('consortia').countDocuments({
          name: args.consortium.name
        });

        if (count > 0) {
          return Boom.forbidden('Consortium with same name already exists');
        }
      }

      consortiumData.id = consortiumData.id ? ObjectID(consortiumData.id) : new ObjectID();

      if (consortiumData.activePipelineId) {
        consortiumData.activePipelineId = ObjectID(consortiumData.activePipelineId);
      }

      if (!consortiumData.isJoinByRequest) {
        consortiumData.joinRequests = {}
      }

      await db.collection('consortia').replaceOne({
        _id: consortiumData.id
      }, consortiumData, {
        upsert: true,
      });

      if (!isUpdate) {
        await addUserPermissions({ userId: ObjectID(credentials.id), userName: credentials.username, role: 'owner', doc: consortiumData.id, table: 'consortia' });
        await addUserPermissions({ userId: ObjectID(credentials.id), userName: credentials.username, role: 'member', doc: consortiumData.id, table: 'consortia' });
      }

      const consortium = await db.collection('consortia').findOne({ _id: consortiumData.id });

      if (isUpdate) {
        eventEmitter.emit(CONSORTIUM_CHANGED, consortium);
      }

      return transformToClient(consortium);
    },
    /**
     * Saves the active members list for a consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.consortiumId consortium id
     * @param {object} args.members JSON with member list
     * @return {object} New/updated consortium object
     */
    saveConsortiumActiveMembers: async (parent, args, { credentials }) => {
      const { permissions } = credentials;

      if (!permissions.consortia[args.consortiumId].includes('owner')) {
        return Boom.forbidden('Action not permitted');
      }

      const consortiumId = ObjectID(args.consortiumId);

      const db = database.getDbInstance();

      const result = await db.collection('consortia').findOneAndUpdate(
        { _id: consortiumId },
        {
          $set: {
            activeMembers: args.members,
          }
        },
        { returnDocument: 'after' }
      );

      eventEmitter.emit(CONSORTIUM_CHANGED, result.value);

      return transformToClient(result.value);
    },
    /**
     * Saves run error
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.runId Run id to update
     * @param {string} args.error Error
     */
    saveError: async (_, args, { credentials }) => {
      const db = database.getDbInstance();

      if (!isAdmin(credentials.permissions)) return Boom.forbidden('Action not permitted');

      const run = await db.collection('runs').findOne({
        _id: ObjectID(args.runId)
      }, {
        projection: { _id: 1, type: 1 }
      });

      if (!run) {
        return;
      }

      const updateObj = {
        endDate: Date.now(),
        status: 'error'
      };

      if (run.type !== 'local') {
        updateObj.error = Object.assign({}, args.error);
      }

      const result = await db.collection('runs').findOneAndUpdate({
        _id: ObjectID(args.runId)
      }, {
        $set: updateObj
      }, {
        returnOriginal: false
      });

      eventEmitter.emit(RUN_CHANGED, result.value);

      return transformToClient(result.value);
    },
    /**
     * Saves pipeline
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.pipeline Pipeline object to add/update
     * @return {object} New/updated pipeline object
     */
    savePipeline: async (_, args, { credentials }) => {
      const { permissions } = credentials;
      if (!permissions.consortia[args.pipeline.owningConsortium].includes('owner')) {
        return Boom.forbidden('Action not permitted');
      }
      const db = database.getDbInstance();

      args.pipeline.id = args.pipeline.id ? ObjectID(args.pipeline.id) : new ObjectID();

      if (args.pipeline.owningConsortium) {
        args.pipeline.owningConsortium = ObjectID(args.pipeline.owningConsortium);
      }

      if (args.pipeline.steps) {
        args.pipeline.steps.forEach(step => {
          if (step.computations) {
            step.computations = step.computations.map(compId => ObjectID(compId));
          }
        });
      }

      let consortiumChanged = false;
      const oldPipeline = await db.collection('pipelines').findOne({ _id: args.pipeline.id });

      if (oldPipeline && oldPipeline.headlessMembers) {
        const updateObjOld = {
          $unset: {}
        };

        Object.keys(oldPipeline.headlessMembers).forEach((headlessMemberId) => {
          updateObjOld.$unset[`activeMembers.${headlessMemberId}`] = '';
        });

        await db.collection('consortia').updateOne(
          { activePipelineId: args.pipeline.id },
          updateObjOld
        );

        consortiumChanged = true;
      }

      if (args.pipeline.headlessMembers) {
        const updateObj = {
          $set: {}
        };

        Object.keys(args.pipeline.headlessMembers).forEach((headlessMemberId) => {
          updateObj.$set[`activeMembers.${headlessMemberId}`] = args.pipeline.headlessMembers[headlessMemberId];
        });

        await db.collection('consortia').updateOne(
          { activePipelineId: args.pipeline.id },
          updateObj
        );

        consortiumChanged = true;
      }

      if (consortiumChanged) {
        const consortium = await db.collection('consortia').findOne({ activePipelineId: args.pipeline.id });

        if (consortium) {
          eventEmitter.emit(CONSORTIUM_CHANGED, consortium);
        }
      }

      await db.collection('pipelines').replaceOne({
        _id: args.pipeline.id
      }, args.pipeline, {
        upsert: true
      });

      const pipeline = await fetchOnePipeline(ObjectID(args.pipeline.id));
      eventEmitter.emit(PIPELINE_CHANGED, pipeline);

      return pipeline;
    },
    /**
     * Saves run results
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.runId Run id to update
     * @param {string} args.results Results
     */
    saveResults: async (_, args, { credentials }) => {
      const db = database.getDbInstance();

      if (!isAdmin(credentials.permissions)) return Boom.forbidden('Action not permitted');

      const run = await db.collection('runs').findOne({
        _id: ObjectID(args.runId)
      }, {
        projection: { _id: 1, type: 1 }
      });

      if (!run) {
        return;
      }

      const updateObj = {
        endDate: Date.now(),
        status: 'complete'
      };

      if (run.type !== 'local') {
        updateObj.results = Object.assign({}, args.results);
      }

      const result = await db.collection('runs').findOneAndUpdate({
        _id: ObjectID(args.runId)
      }, {
        $set: updateObj
      }, {
        returnOriginal: false
      });

      eventEmitter.emit(RUN_CHANGED, result.value);

      return transformToClient(result.value);
    },
    /**
     * Updates run remote state
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.runId Run id to update
     * @param {string} args.data State data
     */
    updateRunState: async (_, args, { credentials }) => {
      const db = database.getDbInstance();

      if (!isAdmin(credentials.permissions)) return Boom.forbidden('Action not permitted');

      const result = await db.collection('runs').findOneAndUpdate({
        _id: ObjectID(args.runId)
      }, {
        $set: {
          remotePipelineState: args.data,
        }
      }, {
        returnOriginal: false
      });

      eventEmitter.emit(RUN_CHANGED, result.value);

      return transformToClient(result.value);
    },
    /**
     * Saves consortium
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to update
     * @param {string} args.status New status
     * @param {object} credentials User object from JWT middleware validateFunc
     * @return {object} Updated user object
     */
    updateUserConsortiumStatus: async (parent, { consortiumId, status }, { credentials }) => {
      const db = database.getDbInstance();

      const result = await db.collection('users').findOneAndUpdate({
        _id: ObjectID(credentials.id)
      }, {
        $set: {
          [`consortiaStatuses.${consortiumId}`]: status
        }
      }, {
        returnOriginal: false
      });

      eventEmitter.emit(USER_CHANGED, result.value);

      return transformToClient(result.value);
    },
    /**
     * Updated consortium mapped users
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to update
     * @param {string} args.mappedForRun New mappedUsers
     * @return {object} Updated consortia
     */
    updateConsortiumMappedUsers: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();

      const updateObj = {};

      if (args.isMapped) {
        updateObj.$addToSet = {
          mappedForRun: credentials.id
        };
      } else {
        updateObj.$pull = {
          mappedForRun: credentials.id
        };
      }

      const result = await db.collection('consortia').findOneAndUpdate({
        _id: ObjectID(args.consortiumId)
      }, updateObj, {
        returnOriginal: false
      });

      eventEmitter.emit(CONSORTIUM_CHANGED, result.value);

      return transformToClient(result.value);
    },
    /**
     * Updated consortia mapped users
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortia Mapped consortiums
     * @return {object} Updated consortia
     */
    updateConsortiaMappedUsers: async (parent, args, { credentials }) => {
      if (!Array.isArray(args.consortia) || args.consortia.length === 0) {
        return;
      }

      const db = database.getDbInstance();

      const consortiaIds = args.consortia.map(id => ObjectID(id));

      const updateObj = {};

      if (args.isMapped) {
        updateObj.$addToSet = {
          mappedForRun: credentials.id
        };
      } else {
        updateObj.$pull = {
          mappedForRun: credentials.id
        };
      }

      await db.collection('consortia').updateMany({
        _id: { $in: consortiaIds },
      }, updateObj);

      const consortia = await db.collection('consortia').find({
        _id: { $in: consortiaIds }
      }).toArray();

      eventEmitter.emit(CONSORTIUM_CHANGED, consortia);

      return transformToClient(consortia);
    },
    /**
     * Updated user password
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.currentPassword Current password
     * @param {string} args.newPassword New password
     * @return {boolean} Success status
     */
    updatePassword: async (parent, args, { credentials }) => {
      const { currentPassword, newPassword } = args;
      const db = database.getDbInstance();

      const currentUser = await db.collection('users').findOne({ _id: ObjectID(credentials.id) });

      const isPasswordCorrect =
        await helperFunctions.verifyPassword(currentPassword, currentUser.passwordHash)

      if (!isPasswordCorrect) {
        return Boom.badData('Current password is not correct')
      }

      const newPasswordHash = await helperFunctions.hashPassword(newPassword)

      await db.collection('users').findOneAndUpdate({
        _id: ObjectID(credentials.id)
      }, {
        $set: {
          passwordHash: newPasswordHash,
        },
      }, {
        returnOriginal: false,
      });
    },
    /**
     * Save a user message
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.threadId Thread Id
     * @param {string} args.title Thread title
     * @param {array} args.recipients Message recipients
     * @param {array} args.content Message content
     * @param {object} args.action Message action
     * @return {object} Updated message
     */
    saveMessage: async (parent, args, { credentials }) => {
      const { title, recipients, content, action } = args;
      const threadId = args.threadId ? ObjectID(args.threadId) : null;

      const db = database.getDbInstance();

      const messageToSave = Object.assign(
        {
          _id: new ObjectID(),
          sender: {
            id: ObjectID(credentials.id),
            username: credentials.username,
          },
          recipients,
          content,
          date: Date.now(),
        },
        action && { action },
      );

      let result;

      if (threadId) {
        const thread = await db.collection('threads').findOne({ _id: threadId });

        const { users } = thread;

        const updateObj = {
          $push: {
            messages: messageToSave
          },
          $set: {
            date: Date.now(),
          }
        };

        keys(users).forEach((userId) => {
          updateObj.$set[`users.${userId}`] = {
            username: users[userId].username,
            isRead: userId === credentials.id
          };
        });

        keys(recipients).forEach((userId) => {
          if (userId in users) {
            return;
          }

          updateObj.$set[`users.${userId}`] = {
            username: recipients[userId],
            isRead: userId === credentials.id
          };
        });

        const updateResult = await db.collection('threads').findOneAndUpdate({ _id: ObjectID(threadId) }, updateObj, { returnOriginal: false });

        result = updateResult.value;
      } else {
        const thread = {
          owner: {
            id: credentials.id,
            username: credentials.username
          },
          title: title,
          messages: [messageToSave],
          users: {},
          date: Date.now(),
        };

        keys(recipients).forEach((userId) => {
          thread.users[userId] = {
            username: recipients[userId],
            isRead: false,
          };
        });

        thread.users[credentials.id] = {
          username: credentials.username,
          isRead: true
        };

        const insertResult = await db.collection('threads').insertOne(thread);

        result = insertResult.ops[0];
      }

      if (action && action.type === 'share-result') {
        const updateRunResult = await db.collection('runs').findOneAndUpdate({ _id: ObjectID(action.detail.id) }, {
          $addToSet: {
            sharedUsers: { $each: keys(recipients) }
          }
        }, {
          returnOriginal: false
        });

        eventEmitter.emit(RUN_CHANGED, updateRunResult.value);
      }

      eventEmitter.emit(THREAD_CHANGED, result);

      return transformToClient(result);
    },
    /**
     * Set if a user has read a message
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.threadId Thread Id
     * @param {string} args.userId User Id
     * @return {object} None
     */
    setReadMessage: async (_, args) => {
      const { threadId, userId } = args;

      const db = database.getDbInstance();

      const result = await db.collection('threads').findOneAndUpdate({
        _id: ObjectID(threadId),
      }, {
        $set: {
          [`users.${userId}.isRead`]: true,
        }
      }, {
        returnOriginal: false
      });

      eventEmitter.emit(THREAD_CHANGED, result.value);

      return transformToClient(result.value);
    },
    /**
     * Create github issue
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.issue Issue
     * @return {object} Created issue
     */
    createIssue: async (parent, args, { credentials }) => {
      const { title, body } = args.issue;

      const repository = process.env.COINSTAC_REPOSITORY_NAME
      const auth = {
        username: process.env.GITHUB_BOT_USERNAME,
        password: process.env.GITHUB_ACCESS_TOKEN,
      }

      try {
        const issue = new Issue(repository, auth);

        await issue.createIssue({ title: `${credentials.username} - ${title}`, body });
      } catch {
        return Boom.notAcceptable('Failed to create issue on GitHub');
      }
    },
    createHeadlessClient: async (parent, { data }, { credentials }) => {
      try {
        const headlessClient = await headlessClientsController.createHeadlessClient(data, credentials);

        return transformToClient(headlessClient);
      } catch (error) {
        if (error instanceof NotAuthorizedError) {
          return Boom.unauthorized(error.message);
        }

        return Boom.internal('Failed to create a headless client', error);
      }
    },
    updateHeadlessClient: async (parent, args, { credentials }) => {
      const { headlessClientId, data } = args;

      try {
        const headlessClient = await headlessClientsController.updateHeadlessClient(headlessClientId, data, credentials);

        return transformToClient(headlessClient);
      } catch (error) {
        if (error instanceof NotAuthorizedError) {
          return Boom.unauthorized(error.message);
        }

        return Boom.internal(`Failed to update the headless client ${headlessClientId}`, error);
      }
    },
    deleteHeadlessClient: async (parent, args, { credentials }) => {
      const { headlessClientId } = args;

      try {
        const deletedHeadlessClient = await headlessClientsController.deleteHeadlessClient(headlessClientId, credentials);

        return transformToClient(deletedHeadlessClient);
      } catch (error) {
        if (error instanceof NotAuthorizedError) {
          return Boom.unauthorized(error.message);
        }

        return Boom.internal(`Failed to delete the headless client ${headlessClientId}`, error);
      }
    },
    generateHeadlessClientApiKey: async (parent, args, { credentials }) => {
      const { headlessClientId } = args;

      try {
        const apiKey = await headlessClientsController.generateHeadlessClientApiKey(headlessClientId, credentials);
        return apiKey;
      } catch (error) {
        if (error instanceof NotAuthorizedError) {
          return Boom.unauthorized(error.message);
        }

        return Boom.internal(`Failed to create an Api Key for headless client ${headlessClientId}`, error);
      }
    },
    saveDataset: async (parent, args, { credentials }) => {
      const { id, datasetDescription, participantsDescription, otherInfo } = args.input;

      const db = database.getDbInstance();

      let result;
      if (id) {
        const datasetId = ObjectID(id);

        const dataset = await db.collection('datasets').findOne({ _id: datasetId });

        if (!dataset) {
          return Boom.notFound('Dataset not found');
        } else if (!dataset.owner.id.equals(credentials._id)) {
          return Boom.unauthorized('You do not have permission to edit this dataset');
        }

        const updateResult = await db.collection('datasets').findOneAndUpdate(
          { _id: datasetId },
          {
            $set: {
              datasetDescription,
              participantsDescription,
              otherInfo,
            }
          },
          { returnDocument: 'after' },
        );

        result = updateResult.value;
      } else {
        const insertResult = await db.collection('datasets').insertOne({
          datasetDescription,
          participantsDescription,
          otherInfo,
          owner: {
            id: credentials._id,
            username: credentials.username,
          }
        });

        result = insertResult.ops[0];
      }

      return transformToClient(result);
    },
    deleteDataset: async (parent, { id }, { credentials }) => {
      const db = database.getDbInstance();

      const dataset = await db.collection('datasets').findOne({ _id: ObjectID(id) });

      if (!isAdmin(credentials.permissions) && !dataset.owner.id.equals(credentials._id)) {
        return Boom.unauthorized('You do not have permission to delete this dataset');
      }

      await db.collection('datasets').deleteOne({ _id: ObjectID(id) });

      return transformToClient(dataset);
    },
    stopRun: async (parent, args, { credentials }) => {
      if (!isAdmin(credentials.permissions)) {
        return Boom.unauthorized('You do not have permission to stop this run')
      }

      await axios.post(
        `http://${process.env.PIPELINE_SERVER_HOSTNAME}:${process.env.PIPELINE_SERVER_PORT}/stopPipeline`, { runId: args.runId }
      );
    },
    deleteRun: async (parent, args, { credentials }) => {
      const db = database.getDbInstance();

      const runs = await db.collection('runs').find({
        _id: ObjectID(args.runId)
      }).toArray();

      if (runs.length) {
        await db.collection('runs').deleteMany({
          _id: ObjectID(args.runId)
        });

        eventEmitter.emit(RUN_DELETED, runs);
        runs.forEach(async (run) => {
          try {
            await axios.post(
              `http://${process.env.PIPELINE_SERVER_HOSTNAME}:${process.env.PIPELINE_SERVER_PORT}/stopPipeline`, { runId: run._id.valueOf() }
            );
          } catch (e) { }
        });
      }
    },
    /*
      Admin user actions
      - Save user
      - Delete user
    */
    saveUser: async (parent, args, { credentials }) => {
      if (!isAdmin(credentials.permissions)) {
        return Boom.unauthorized('You do not have permission to delete this user');
      }
      const db = database.getDbInstance();

      let allUsers = transformToClient(await db.collection('users').find().toArray());

      if (args.userId) {
        allUsers = allUsers.filter(user => user.id !== args.userId);
      }

      if (allUsers.filter(user => user.username === args.data.username).length > 0) {
        return Boom.badRequest('Username is already taken')
      }

      if (allUsers.filter(user => user.email === args.data.email).length > 0) {
        return Boom.badRequest('Email is already taken')
      }

      const result = args.userId
        ? await helperFunctions.updateUser({ id: args.userId, ...args.data })
        : await helperFunctions.createUser(args.data, '')

      return result
    },
    deleteUser: async (parent, args, { credentials }) => {
      if (!isAdmin(credentials.permissions)) {
        return Boom.unauthorized('You do not have permission to delete this user');
      }
      const db = database.getDbInstance();

      // check to see if the user owns anything

      // consortia
      const consortiaOwnersKey = `owners.${args.userId}`
      const ownedConsortia = await db.collection('consortia').find({ [consortiaOwnersKey]: { '$exists': true } }).toArray();

      const soleOwner = ownedConsortia.reduce((sole, con) => {
        if (Object.keys(con.owners).length <= 1) sole = true;
        return sole;
      }, false)

      if (soleOwner) {
        return Boom.illegal('Cannot delete a user that is the owner of a consortium');
      }

      // datasets
      const ownedDatasets = await db.collection('datasets').find({ 'owner.id': ObjectID(args.userId) }).toArray();
      if (ownedDatasets.length > 0) {
        return Boom.illegal('Cannot delete a user that is the owner of a dataset');
      }

      // pipelines
      const ownedPipelines = await db.collection('pipelines').find({ 'owner': args.userId }).toArray();
      if (ownedPipelines.length > 0) {
        return Boom.illegal('Cannot delete a user that is the owner of a pipeline');
      }

      // remove the user as a member of any consortium
      const consortiaMembersKey = `members.${args.userId}`;
      const consortiaUpdateResult = await db.collection('consortia').updateMany({}, { $unset: { [consortiaMembersKey]: true, [consortiaOwnersKey]: true } })

      if (consortiaUpdateResult.modifiedCount > 0) {
        // emit a consortium changed event
        const consortia = await db.collection('consortia').find().toArray();
        eventEmitter.emit(CONSORTIUM_CHANGED, consortia);
      }

      const user = await db.collection('users').findOne({ _id: ObjectID(args.userId) })
      user.delete = true;
      await db.collection('users').deleteOne({ _id: ObjectID(args.userId) })

      eventEmitter.emit(USER_CHANGED, user);
    },
  },
  Subscription: {
    /**
     * Computation subscription
     * @param {object} payload
     * @param {string} payload.computationId The computation changed
     * @param {object} variables
     * @param {string} variables.computationId The computation listened for
     */
    computationChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('computationChanged'),
        (payload, variables) => (!variables.computationId || payload.computationId === variables.computationId)
      )
    },
    /**
     * Consortium subscription
     * @param {object} payload
     * @param {string} payload.consortiumId The consortium changed
     * @param {object} variables
     * @param {string} variables.consortiumId The consortium listened for
     */
    consortiumChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('consortiumChanged'),
        (payload, variables) => (!variables.consortiumId || payload.consortiumId === variables.consortiumId)
      )
    },
    /**
     * Consortium pipeline changed subscription
     * @param {object} payload
     * @param {string} payload.consortiumId The consortium changed
     * @param {object} variables
     * @param {string} variables.consortiumId The consortium listened for
     */
    consortiumPipelineChanged: {
      subscribe: () => pubsub.asyncIterator('consortiumPipelineChanged'),
    },
    /**
     * Pipeline subscription
     * @param {object} payload
     * @param {string} payload.pipelineId The pipeline changed
     * @param {object} variables
     * @param {string} variables.pipelineId The pipeline listened for
     */
    pipelineChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('pipelineChanged'),
        (payload, variables) => (!variables.pipelineId || payload.pipelineId === variables.pipelineId)
      )
    },
    /**
     * Thread subscription
     * @param {object} payload
     * @param {string} payload.threadId The thread changed
     * @param {object} variables
     * @param {string} variables.threadId The thread listened for
     */
    threadChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('threadChanged'),
        (payload, variables) => (!variables.threadId || payload.threadId === variables.threadId)
      )
    },
    /**
     * User subscription
     * @param {object} payload
     * @param {string} payload.userId The user changed
     * @param {object} variables
     * @param {string} variables.userId The user listened for
     */
    userChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('userChanged'),
        (payload, variables) => (!variables.userId || payload.userId === variables.userId)
      )
    },
    /**
     * Run subscription
     * @param {object} payload
     * @param {string} payload.runId The run changed
     * @param {object} variables
     * @param {string} variables.userId The user listened for
     */
    userRunChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('userRunChanged'),
        (payload, variables) => (variables.userId && variables.userId in payload.userRunChanged.observers)
      )
    },
    runStarted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('runStarted'),
        (payload, variables) => (variables.userId && keys(payload.runStarted.clients).indexOf(variables.userId) > -1)
      )
    },
    headlessClientChanged: {
      subscribe: () => pubsub.asyncIterator('headlessClientChanged'),
    },
    /**
     * Subscription triggered
     * @param {object} payload
     * @param {string} payload.runId The run changed
     * @param {object} variables
     * @param {string} variables.clientId The user listened for
     */
    runWithHeadlessClientStarted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('runWithHeadlessClientStarted'),
        (payload, variables) => (variables.clientId && variables.clientId in payload.runWithHeadlessClientStarted.clients)
      )
    },
    /**
     * Users online status subscription
     */
    usersOnlineStatusChanged: {
      subscribe: () => pubsub.asyncIterator('usersOnlineStatusChanged'),
      resolve: async (payload, args, context, info) => {
        // Find the users that are in the same consortia as the logged user
        const db = database.getDbInstance();

        const userId = context.userId || payload.userId;

        if (!userId) {
          return getOnlineUsers();
        }

        const user = await helperFunctions.getUserDetailsByID(userId);

        const consortiaIds = keys(user.permissions.consortia).map(id => ObjectID(id));
        const consortia = await db.collection('consortia').find(
          { _id: { $in: consortiaIds } },
          { projection: { members: 1 } }
        ).toArray();

        const usersStatus = {};

        consortia.forEach((consortium) => {
          keys(consortium.members).forEach((memberId) => {
            if (!(memberId in usersStatus)) {
              usersStatus[memberId] = payload.usersOnlineStatusChanged[memberId] || false;
            }
          });
        });

        return usersStatus;
      },
    }
  },
};

module.exports = {
  resolvers,
  pubsub,
};
