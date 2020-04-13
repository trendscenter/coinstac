/* eslint-disable no-await-in-loop */
const rethink = require('rethinkdb');
const Boom = require('boom');
const GraphQLJSON = require('graphql-type-json');
const Promise = require('bluebird');
const { PubSub, withFilter } = require('graphql-subscriptions');
const axios = require('axios');
const { uniq } = require('lodash');
const helperFunctions = require('../auth-helpers');
const initSubscriptions = require('./subscriptions');
const config = require('../../config/default');
const database = require('../database');

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

  if (!pipelineSteps || pipelineSteps.length === 0) {
    return null;
  }

  let pipe = null;
  while (await pipelineSteps.hasNext()) {
    const currentStep = await pipelineSteps.next();

    if (!pipe) {
      pipe = {
        ...currentStep,
        steps: [],
      };
    }

    pipe.steps.push(currentStep.steps);
  }

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

  const promises = [];

  const updateObj = {
    $addToSet: {
      [`permissions.${table}.${doc}`]: role,
    },
  };

  if (table === 'consortia') {
    updateObj.$set = {
      [`consortiaStatuses.${doc}`]: 'none',
    };

    promises.push(
      db.collection('consortia').updateOne({ _id: doc }, {
        $addToSet: { [`${role}s`]: args.userId },
      })
    );
  }

  promises.push(
    db.collection('users').updateOne({ _id: args.userId }, updateObj)
  );

  return Promise.all(promises);
}

async function removeUserPermissions(args) {
  const db = database.getDbInstance();

  const promises = [];

  const user = await db.collection('users').findOne({ _id: args.userId }, {
    projection: { permissions: 1 },
  });

  const { permissions } = user;

  const index = permissions[args.table][args.doc].findIndex(p => p === args.role);
  permissions[args.table][args.doc].splice(index, 1);

  if (permissions[args.table][args.doc].length === 0) {
    const updateObj = {
      $unset: {
        [`permissions.${args.table}.${args.doc}`]: '',
      },
    };

    if (args.table === 'consortia') {
      updateObj.$unset[`consortiaStatuses.${args.doc}`] = '';
    }

    promises.push(
      db.collection('users').updateOne({ _id: args.userId }, updateObj)
    );
  } else {
    promises.push(
      db.collection('users').updateOne({ _id: args.userId }, {
        $pull: { [`permissions.${args.table}.${args.doc}`]: args.role },
      })
    );
  }

  if (args.table === 'consortia') {
    const updateObj = {
      $pull: {
        [`${args.role}s`]: args.userId,
      },
    };

    if (permissions[args.table][args.doc].length === 0) {
      updateObj.$pull.mappedForRun = args.userId;
    }

    promises.push(
      db.collection('consortia').updateOne({ _id: args.doc }, updateObj)
    );
  }

  return Promise.all(promises);
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
    fetchAllResults: () => {
      const db = database.getDbInstance();

      return db.collection('runs').find().toArray();
    },
    /**
     * Returns single pipeline
     * @param {object} args
     * @param {string} args.resultId  Requested pipeline ID
     * @return {object} Requested pipeline if id present, null otherwise
     */
    fetchResult: (_, args) => {
      if (!args.resultId) {
        return null;
      }

      const db = database.getDbInstance();

      return db.collection('runs').findOne({ _id: args.resultId });
    },
    /**
     * Fetches all public consortia and private consortia for which the current user has access
     * @return {array} All consortia to which the current user access
     */
    fetchAllConsortia: async ({ auth: { credentials } }) => {
      const db = database.getDbInstance();

      return db.collection('consortia').find({
        $or: [
          { isPrivate: false },
          { members: { $elemMatch: { $eq: credentials.username } } }
        ]
      });
    },
    /**
     * Returns single consortium.
     * @param {object} args
     * @param {string} args.consortiumId Requested consortium ID
     * @return {object} Requested consortium if id present, null otherwise
     */
    fetchConsortium: (_, args) => {
      if (!args.consortiumId) {
        return null;
      }

      const db = database.getDbInstance();

      return db.collection('consortia').findOne({ _id: args.consortiumId });
    },
    /**
     * Returns all computations.
     * @return {array} All computations
     */
    fetchAllComputations: () => {
      const db = database.getDbInstance();

      return db.collection('computations').find().toArray();
    },
    /**
     * Returns metadata for specific computation name
     * @param {object} args
     * @param {array} args.computationIds Requested computation ids
     * @return {array} List of computation objects
     */
    fetchComputation: (_, args) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('computations').getAll(...args.computationIds)
            .run(connection).then(res => connection.close().then(() => res))
        )
        .then((cursor) => cursor.toArray())
        .then((result) => {
          return result;
        });
    },
    /**
     * Returns all pipelines.
     * @return {array} List of all pipelines
     */
    fetchAllPipelines: () => {
      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('pipelines')
            .orderBy({ index: 'id' })
            .map(pipeline =>
              pipeline.merge(pipeline =>
                ({
                  steps: pipeline('steps').map(step =>
                    step.merge({
                      computations: step('computations').map(compId =>
                        rethink.table('computations').get(compId)
                      )
                    })
                  )
                })
              )
            )
            .run(connection).then(res => connection.close().then(() => res))
        )
        .then(cursor => cursor.toArray())
        .then(result => result);
    },
    /**
     * Returns single pipeline
     * @param {object} args
     * @param {string} args.pipelineId  Requested pipeline ID
     * @return {object} Requested pipeline if id present, null otherwise
     */
    fetchPipeline: (_, args) => {
      if (!args.pipelineId) {
        return null;
      } else {
        return helperFunctions.getRethinkConnection()
          .then(connection =>
            rethink.table('pipelines')
              .get(args.pipelineId)
              // Populate computations subfield with computation meta information
              .merge(pipeline =>
                ({
                  steps: pipeline('steps').map(step =>
                    step.merge({
                      computations: step('computations').map(compId =>
                        rethink.table('computations').get(compId)
                      )
                    })
                  )
                })
              )
              .run(connection).then(res => connection.close().then(() => res))
          )
          .then(result => result);
      }
    },
    /**
     * Returns single user.
     * @param {object} args
     * @param {string} args.userId Requested user ID, restricted to authenticated user for time being
     * @return {object} Requested user if id present, null otherwise
     */
    fetchUser: async ({ auth: { credentials } }, args) => {
      if (args.userId !== credentials.username) {
        return Boom.unauthorized('Unauthorized action');
      }

      const db = database.getDbInstance();

      const user = await db.collection('users').findOne({ _id: credentials._id });

      delete user.passwordHash;

      return user;
    },
    fetchAllUsers: () => {
      const db = database.getDbInstance();

      return db.collection('users').find().toArray();
    },
    fetchAllUserRuns: ({ auth: { credentials } }, args) => {
      let connection;
      return helperFunctions.getRethinkConnection()
        .then((db) => {
          connection = db;
          return rethink.table('runs')
            .orderBy({ index: 'id' })
            .filter(
              rethink.row('clients').contains(credentials.id).
              or(rethink.row('sharedUsers').contains(credentials.id))
            )
            .run(connection);
          }
        )
        .then(cursor => cursor.toArray())
        .then(res => connection.close().then(() => res));
    },
    fetchAllThreads: async ({ auth: { credentials } }) => {
      const db = database.getDbInstance();

      return db.collection('threads').find({
        users: {
          $elemMatch: { username: credentials.username }
        }
      });
    },
    validateComputation: (_, args) => {
      return new Promise();
    },
  },
  Mutation: {
    /**
     * Add computation to RethinkDB
     * @param {object} args
     * @param {object} args.computationSchema Computation object to add/update
     * @return {object} New/updated computation object
     */
    addComputation: ({ auth: { credentials } }, args) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('computations').insert(
            Object.assign({}, args.computationSchema, { submittedBy: credentials.id }),
            {
              conflict: "replace",
              returnChanges: true,
            }
          )
          .run(connection).then(res => connection.close().then(() => res))
        )
        .then((result) => {
          return result.changes[0].new_val;
        })
    },
    /**
     * Add new user role to user perms, currently consortia perms only
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.doc Id of the document to add role to
     * @param {string} args.role Role to add to perms
     * @param {string} args.userId Id of the user to be added
     * @return {object} Updated user object
     */
    addUserRole: async ({ auth: { credentials } }, args) => {
      const { permissions } = credentials

      const documentPermissions = permissions[args.table][args.doc];
      if (!documentPermissions || !documentPermissions.includes('owner')) {
        return Boom.forbidden('Action not permitted');
      }

      await addUserPermissions(args);

      return helperFunctions.getUserDetails(args.userId);
    },
    /**
     * Add run to RethinkDB
     * @param {String} consortiumId Run object to add/update
     * @return {object} New/updated run object
     */
    createRun: async ({ auth }, { consortiumId }) => {
      if (!auth || !auth.credentials) {
        // No authorized user, reject
        return Boom.unauthorized('User not authenticated');
      }

      try {
        const db = database.getDbInstance();

        const consortium = await db.collection('consortia').findOne({ _id: consortiumId });
        const pipeline = await fetchOnePipeline(consortium.activePipelineId);

        const result = await db.collection('runs').insertOne({
            clients: [...consortium.members],
            consortiumId,
            pipelineSnapshot: pipeline,
            startDate: Date.now(),
            type: 'decentralized',
        });

        const run = result.ops[0];

        await axios.post(
          `http://${config.host}:${config.pipelineServer}/startPipeline`, { run }
        );

        return result.ops[0]
      } catch (error) {
        console.log(error)
      }
    },
    /**
     * Deletes consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to delete
     * @return {object} Deleted consortium
     */
    deleteConsortiumById: ({ auth: { credentials: { permissions } } }, args) => {
      if (!permissions.consortia[args.consortiumId] || !permissions.consortia[args.consortiumId].includes('owner')) {
        return Boom.forbidden('Action not permitted');
      }

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          new Promise.all([
            rethink.table('consortia').get(args.consortiumId)
              .delete({ returnChanges: true })
              .run(connection),
            rethink.table('users').replace(user =>
              user.without({
                permissions: { consortia: args.consortiumId },
                consortiaStatuses: args.consortiumId
              })
            ).run(connection),
            rethink.table('pipelines').filter({ owningConsortium: args.consortiumId })
              .delete()
              .run(connection)
          ]).then(res => connection.close().then(() => res))
        )
        .then(([consortium]) => consortium.changes[0].old_val)
    },
    /**
     * Deletes pipeline
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.pipelineId Pipeline id to delete
     * @return {object} Deleted pipeline
     */
    deletePipeline: async ({ auth: { credentials: { permissions } } }, args) => {
      const connection = await helperFunctions.getRethinkConnection()
      const pipeline = await rethink.table('pipelines')
        .get(args.pipelineId)
        .run(connection)

      if (!permissions.consortia[pipeline.owningConsortium] ||
          !permissions.consortia[pipeline.owningConsortium].includes('owner')
      ) {
        return Boom.forbidden('Action not permitted')
      }

      const runsCount = await rethink.table('runs')('pipelineSnapshot')
        .filter({ id: args.pipelineId })
        .count()
        .run(connection)

      if (runsCount > 0) {
        return Boom.badData('Runs on this pipeline exist')
      }

      await rethink.table('pipelines')
        .get(args.pipelineId)
        .delete({ returnChanges: true })
        .run(connection)

      await rethink.table('consortia')
        .filter({ activePipelineId: args.pipelineId })
        .replace(rethink.row.without('activePipelineId'))
        .run(connection)

      await connection.close()

      return pipeline
    },
    /**
     * Add logged user to consortium members list
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to join
     * @return {object} Updated consortium
     */
    joinConsortium: async ({ auth: { credentials } }, args) => {
      const db = database.getDbInstance();
      const consortium = await db.collection('consortia').findOne({ _id: args.consortiumId });

      if (consortium.members.indexOf(credentials.id) !== -1) {
        return consortium;
      }

      await addUserPermissions({ userId: credentials.id, role: 'member', doc: args.consortiumId, table: 'consortia' });

      return db.collection('consortia').findOne({ _id: args.consortiumId });
    },
    /**
     * Remove logged user from consortium members list
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to join
     * @return {object} Updated consortium
     */
    leaveConsortium: async ({ auth: { credentials } }, args) => {
      await removeUserPermissions({ userId: credentials.id, role: 'member', doc: args.consortiumId, table: 'consortia' });

      return db.collection('consortia').findOne({ _id: args.consortiumId });
    },
    /**
     * Deletes computation
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.computationId Computation id to delete
     * @return {object} Deleted computation
     */
    removeComputation: ({ auth: { credentials } }, args) => {
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          new Promise.all([
            connection,
            rethink.table('computations').get(args.computationId).run(connection)
          ])
        )
        .then(([connection, comp]) => {
          if (comp.submittedBy !== credentials.id) {
            return Boom.forbidden('Action not permitted');
          }

          return rethink.table('computations').get(args.computationId)
            .delete({ returnChanges: true }).run(connection).then(res => connection.close().then(() => res))
        })
        .then(result => result.changes[0].old_val)
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
     * @return {object} Updated user object
     */
    removeUserRole: async ({ auth: { credentials } }, args) => {
      const { permissions } = credentials

      if (!permissions[args.table][args.doc] || !permissions[args.table][args.doc].includes('owner')) {
        return Boom.forbidden('Action not permitted');
      }

      await removeUserPermissions(args)

      return helperFunctions.getUserDetails(args.userId);
    },
    /**
     * Sets active pipeline on consortia object
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium to update
     * @param {string} args.activePipelineId Pipeline ID to mark as active
     */
    saveActivePipeline: async ({ auth: { credentials } }, args) => {
      // const { permissions } = credentials;
      /* TODO: Add permissions
      if (!permissions.consortia.write
          && args.consortium.id
          && !permissions.consortia[args.consortium.id].write) {
            return Boom.forbidden('Action not permitted');
      }*/

      const connection = await helperFunctions.getRethinkConnection()
      const result = await rethink.table('consortia')
        .get(args.consortiumId)
        .update({ activePipelineId: args.activePipelineId, mappedForRun: [] })
        .run(connection)
      await connection.close()

      return result
    },
    /**
     * Saves consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.consortium Consortium object to add/update
     * @return {object} New/updated consortium object
     */
    saveConsortium: async ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;

      const isUpdate = !!args.consortium.id;

      if (isUpdate && !permissions.consortia[args.consortium.id].includes('owner')) {
        return Boom.forbidden('Action not permitted');
      }

      const connection = await helperFunctions.getRethinkConnection();

      if (!isUpdate) {
        const count = await rethink.table('consortia')
          .filter({ name: args.consortium.name })
          .count()
          .run(connection)

        if (count > 0) {
          return Boom.forbidden('Consortium with same name already exists');
        }
      }

      const consortiumData = Object.assign(
        { ...args.consortium },
        !isUpdate && { createDate: Date.now() },
      )

      const result = await rethink.table('consortia')
        .insert(consortiumData, {
          conflict: 'update',
          returnChanges: true,
        })
        .run(connection);

      const consortiumId = consortiumData.id || result.changes[0].new_val.id;

      if (!isUpdate) {
        await addUserPermissions({ userId: credentials.id, role: 'owner', doc: consortiumId, table: 'consortia' });
        await addUserPermissions({ userId: credentials.id, role: 'member', doc: consortiumId, table: 'consortia' });
      }

      const consortium = await db.collection('consortia').findOne({ _id: args.consortiumId });

      await connection.close();

      return consortium;
    },
    /**
     * Saves run error
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.runId Run id to update
     * @param {string} args.error Error
     */
    saveError: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('runs').get(args.runId).update({ error: Object.assign({}, args.error), endDate: Date.now() })
          .run(connection).then(res => connection.close()));
          // .then(result => result.changes[0].new_val)
    },
    /**
     * Saves pipeline
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.pipeline Pipeline object to add/update
     * @return {object} New/updated pipeline object
     */
    savePipeline: async ({ auth: { credentials } }, args) => {
      // const { permissions } = credentials;
      /* TODO: Add permissions
      if (!permissions.consortia.write
          && args.consortium.id
          && !permissions.consortia[args.consortium.id].write) {
            return Boom.forbidden('Action not permitted');
      }*/
      const db = database.getDbInstance();

      if (args.pipeline && args.pipeline.steps) {
        const invalidData = args.pipeline.steps.some(step =>
          step.inputMap &&
          step.inputMap.covariates &&
          step.inputMap.covariates.ownerMappings &&
          step.inputMap.covariates.ownerMappings.some(variable =>
            !variable.type || !variable.source || !variable.name
          )
        );

        if (invalidData) {
          return Boom.badData('Some of the covariates are incomplete');
        }
      }

      let pipelineId;

      if (!args.pipeline.id) {
        const result = await db.collection('pipelines').insertOne(args.pipeline);
        pipelineId = result.ops[0]._id;
      } else {
        await db.collection('pipelines').updateOne({ _id: args.pipeline.id }, args.pipeline);
        pipelineId = args.pipeline.id;
      }

      return fetchOnePipeline(pipelineId);
    },
    /**
     * Saves run results
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.runId Run id to update
     * @param {string} args.results Results
     */
    saveResults: ({ auth: { credentials } }, args) => {
      console.log("save results was called");
      const { permissions } = credentials;
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('runs').get(args.runId).update({ results: Object.assign({}, args.results), endDate: Date.now() })
          .run(connection).then(res => connection.close()))
          // .then(result => result.changes[0].new_val)
    },
    setActiveComputation: (_, args) => {
      return new Promise();
    },
    setComputationInputs: (_, args) => {
      return new Promise();
    },
    /**
     * Updates run remote state
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.runId Run id to update
     * @param {string} args.data State data
     */
    updateRunState: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      return helperFunctions.getRethinkConnection()
        .then((connection) => {
          return rethink.table('runs').get(args.runId).update({ remotePipelineState: args.data })
          .run(connection).then(res => connection.close());
        });
          // .then(result => result.changes[0].new_val)
    },
    /**
     * Saves consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to update
     * @param {string} args.status New status
     * @return {object} Updated user object
     */
    updateUserConsortiumStatus: ({ auth: { credentials } }, { consortiumId, status }) =>
      helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('users')
          .get(credentials.id).update({
            consortiaStatuses: {
              [consortiumId]: status,
            },
          }).run(connection).then(res => connection.close().then(() => res))
        )
        .then(result =>
          helperFunctions.getUserDetails(credentials.username)
        )
        .then(result => result)
    ,
    /**
     * Updated consortium mapped users
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to update
     * @param {string} args.mappedForRun New mappedUsers
     * @return {object} Updated consortia
     */
    updateConsortiumMappedUsers: async ({ auth: { credentials } }, args) => {
      const connection = await helperFunctions.getRethinkConnection()
      const result = await rethink.table('consortia')
        .get(args.consortiumId)
        .update({ mappedForRun: args.mappedForRun })
        .run(connection)
      await connection.close()
      return result
    },
    /**
     * Updated consortia mapped users
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortia Mapped consortiums
     * @return {object} Updated consortia
     */
    updateConsortiaMappedUsers: async ({ auth: { credentials } }, args) => {
      const connection = await helperFunctions.getRethinkConnection()
      const result = await rethink.table('consortia')
        .getAll(...args.consortia)
        .filter(rethink.row('mappedForRun').contains(credentials.id))
        .update({ mappedForRun: rethink.row('mappedForRun').difference([credentials.id]) })
        .run(connection)

      return result
    },
    /**
     * Save message
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.threadId Thread Id
     * @param {string} args.title Thread title
     * @param {array} args.recipients Message recipients
     * @param {array} args.content Message content
     * @param {object} args.action Message action
     * @return {object} Updated message
     */
    saveMessage: async ({ auth: { credentials } }, args) => {
      const { threadId, title, recipients, content, action } = args;

      const connection = await helperFunctions.getRethinkConnection()

      const db = database.getDbInstance();

      const messageToSave = Object.assign(
        {
          _id: database.createUniqueId(),
          sender: credentials.id,
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
            users: uniq([...users.map(user => user.username), ...recipients])
              .map(user => ({ username: user, isRead: user === credentials.id }))
          }
        };

        const updateResult = await db.collection('threads').updateOne({ _id: threadId }, updateObj);

        result = updateResult.ops[0];
      } else {
        const thread = {
          owner: credentials.id,
          title: title,
          messages: [messageToSave],
          users: uniq([credentials.username, ...recipients])
            .map(user => ({ username: user, isRead: user === credentials.username })),
          date: Date.now(),
        };

        const insertResult = await db.collection('threads').insertOne(thread);

        result = insertResult.ops[0];
      }

      if (action && action.type === 'share-result') {
        await db.collection('runs').updateOne({ _id: action.detail.id }, {
          $addToSet: {
            sharedUsers: { $each: recipients }
          }
        });
      }

      return result;
    },
    /**
     * Set read mesasge
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.threadId Thread Id
     * @param {string} args.userId User Id
     * @return {object} None
     */
    setReadMessage: async (_, args) => {
      const { threadId, userId } = args;

      const db = database.getDbInstance();

      await db.collection('threads').updateOne({
        _id: threadId,
        'users.username': userId,
      }, {
        $set: {
          'users.$.isRead': true,
        }
      });
    }
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
        (payload, variables) => (variables.userId || payload.userId === variables.userId)
      )
    },
    /**
     * User Metadata subscription
     * @param {object} payload
     * @param {string} payload.userId The user changed
     * @param {object} variables
     * @param {string} variables.userId The user listened for
     */
    userMetadataChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('userMetadataChanged'),
        (payload, variables) => (variables.userId && payload.userId === variables.userId)
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
        (payload, variables) => (variables.userId && payload.userRunChanged.clients.indexOf(variables.userId) > -1)
      )
    },
  },
};

module.exports = {
  resolvers,
  pubsub,
};
