const rethink = require('rethinkdb');
const Boom = require('boom');
const GraphQLJSON = require('graphql-type-json');
const Promise = require('bluebird');
const { PubSub, withFilter } = require('graphql-subscriptions');
const helperFunctions = require('../auth-helpers');
const initSubscriptions = require('./subscriptions');

/**
 * Helper function to retrieve all members of given table
 * @param {string} table - The table name
 * @return {array} The contents of the requested table
 */
function fetchAll(table) {
  return helperFunctions.getRethinkConnection()
    .then(connection =>
      rethink.table(table).orderBy({ index: 'id' }).run(connection)
    )
    .then(cursor => cursor.toArray());
}

/**
 * Helper function to retrieve a single entry in a table
 * @param {string} table - The table name
 * @param {string} id - The entry id
 * @return {object} The requested table entry
 */
function fetchOne(table, id) {
  return helperFunctions.getRethinkConnection()
    .then(connection =>
      rethink.table(table).get(id).run(connection)
    );
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
    fetchAllResults: () => fetchAll('run'),
    /**
     * Returns single pipeline
     * @param {object} args
     * @param {string} args.resultId  Requested pipeline ID
     * @return {object} Requested pipeline if id present, null otherwise
     */
    fetchResult: (_, args) => {
      if (!args.resultId) {
        return null;
      } else {
        return helperFunctions.getRethinkConnection()
          .then(connection =>
            rethink.table('run')
              .get(args.resultId)
              .run(connection)
          )
          .then(result => result);
      }
    },
    /**
     * Returns all consortia.
     * @return {array} All consortia
     */
    fetchAllConsortia: () => fetchAll('consortia'),
    /**
     * Returns single consortium.
     * @param {object} args
     * @param {string} args.consortiumId Requested consortium ID
     * @return {object} Requested consortium if id present, null otherwise
     */
    fetchConsortium: (_, args) => args.consortiumId ? fetchOne('consortia', args.consortiumId) : null,
    /**
     * Returns all computations.
     * @return {array} All computations
     */
    fetchAllComputations: () => fetchAll('computations'),
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
            .run(connection)
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
            .run(connection)
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
              .run(connection)
          )
          .then(result => result);
      }
    },
    fetchAllUserRuns: ({ auth: { credentials } }, args) => {
      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('runs')
            .orderBy({ index: 'id' })
            .filter(rethink.row('clients').contains(credentials.id))
            .run(connection)
        )
        .then(cursor => cursor.toArray());
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
          .run(connection)
        )
        .then((result) => {
          return result.changes[0].new_val;
        })
    },
    // TODO: add table variable to args
    /**
     * Add new user role to user perms, currently consortia perms only
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.doc Id of the document to add role to
     * @param {string} args.role Role to add to perms
     * @return {object} Updated user object
     */
    addUserRole: ({ auth: { credentials } }, args) => {
      // UserID arg could be used by admin to add/remove roles, ignored for now
      const { permissions } = credentials

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('users').get(credentials.id)('permissions').run(connection)
          .then((perms) => {
            let newRoles = [args.role];

            // Grab existing roles if present
            if (perms[args.table][args.doc] && perms[args.table][args.doc].indexOf(args.role) === -1) {
              newRoles = newRoles.concat(perms[args.table][args.doc]);
            } else if (perms[args.table][args.doc]) {
              newRoles = perms[args.table][args.doc];
            }

            const updateObj = { permissions: { [args.table]: { [args.doc]: newRoles } } };

            // Add entry to user statuses object
            if (args.table === 'consortia') {
              updateObj.consortiaStatuses = {};
              updateObj.consortiaStatuses[args.doc] = 'none';
            }

            return rethink.table('users').get(credentials.id).update(
              updateObj, { returnChanges: true }
            ).run(connection);
          })
        )
        .then(result =>
          helperFunctions.getUserDetails({ username: credentials.id })
        )
        .then(result => result)
    },
    /**
     * Add run to RethinkDB
     * @param {String} consortiumId Run object to add/update
     * @return {object} New/updated run object
     */
    createRun: ({ auth }, { consortiumId }) => {
      if (!auth || !auth.credentials) {
        // No authorized user, reject
        return Boom.unauthorized('User not authenticated');
      }

      return fetchOne('consortia', consortiumId)
        .then(consortium => Promise.all([
          consortium,
          fetchOne('pipelines', consortium.activePipelineId),
          helperFunctions.getRethinkConnection()
        ]))
        .then(([consortium, pipelineSnapshot, connection]) =>
          rethink.table('runs').insert(
            {
              clients: [...consortium.members, ...consortium.owners],
              consortiumId,
              pipelineSnapshot,
              startDate: Date.now(),
            },
            { 
              conflict: "replace",
              returnChanges: true,
            }
          )
          .run(connection)
        )
        .then((result) => {
          return result.changes[0].new_val;
        })
    },
    /**
     * Deletes consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to delete
     * @return {object} Deleted consortium
     */
    deleteConsortiumById: ({ auth: { credentials: { permissions } } }, args) => {
      if (!permissions.consortia[args.consortiumId]
          || !permissions.consortia[args.consortiumId].write
      ) {
        return Boom.forbidden('Action not permitted');
      }

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          new Promise.all([
            rethink.table('consortia').get(args.consortiumId)
              .delete({ returnChanges: true })
              .run(connection),
            rethink.table('users').replace(user =>
              user.without({ permissions: { consortia: args.consortiumId } })
            ).run(connection)
          ])
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
    deletePipeline: ({ auth: { credentials: { permissions } } }, args) => {
      return helperFunctions.getRethinkConnection()
        .then(connection =>
          new Promise.all([
            connection,
            rethink.table('pipelines').get(args.pipelineId)
              .run(connection)
          ])
        )
        .then(([connection, pipeline]) => {
          if (!permissions.consortia[pipeline.owningConsortium] ||
              !permissions.consortia[pipeline.owningConsortium].write
          ) {
            return Boom.forbidden('Action not permitted');
          } else {
            return rethink.table('pipelines').get(args.pipelineId)
              .delete({ returnChanges: true })
              .run(connection)
          }
        })
        .then((pipeline) => pipeline.changes[0].old_val)
    },
    /**
     * Add user id to consortium members list
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to join
     * @return {object} Updated consortium
     */
    joinConsortium: ({ auth: { credentials } }, args) => {
      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('consortia').get(args.consortiumId)
            .update(
              { "members": rethink.row("members").append(credentials.id)}, { returnChanges: true }
            ).run(connection)
        )
        .then(result => result.changes[0].new_val)
    },
    /**
     * Add user id to consortium members list
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium id to join
     * @return {object} Updated consortium
     */
    leaveConsortium: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('consortia').get(args.consortiumId)
          .update(function(row){
            return{
              "members": row("members").setDifference([credentials.id]),
            }
          }, {returnChanges: true})
          .run(connection)
        )
        .then(result => result.changes[0].new_val)
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
            .delete({ returnChanges: true }).run(connection)
        })
        .then(result => result.changes[0].old_val)
    },
    /**
     * Add new user role to user perms, currently consortia perms only
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.doc Id of the document to add role to
     * @param {string} args.role Role to add to perms
     * @return {object} Updated user object
     */
    removeUserRole: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials
      let updateObj = {
        permissions: { [args.table]: {
          [args.doc]: rethink.table('users')
            .get(credentials.id)('permissions')(args.table)(args.doc)
            .filter(role => role.ne(args.role)),
        } },
      };

      // Remove entry from user statuses object if updating consortia
      if (args.table === 'consortia') {
        const statuses = Object.assign({}, credentials.consortiaStatuses);
        delete statuses[args.doc];
        updateObj.consortiaStatuses = statuses;
      }

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('users')
          .get(credentials.id).update(updateObj, { nonAtomic: true }).run(connection)
        )
        .then(result =>
          helperFunctions.getUserDetails({ username: credentials.id })
        )
        .then(result => result)
    },
    /**
     * Sets active pipeline on consortia object
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {string} args.consortiumId Consortium to update
     * @param {string} args.activePipelineId Pipeline ID to mark as active
     */
    saveActivePipeline: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      /* TODO: Add permissions
      if (!permissions.consortia.write
          && args.consortium.id
          && !permissions.consortia[args.consortium.id].write) {
            return Boom.forbidden('Action not permitted');
      }*/
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('consortia').get(args.consortiumId).update({activePipelineId: args.activePipelineId})
          .run(connection)
        )
    },
    /**
     * Saves consortium
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.consortium Consortium object to add/update
     * @return {object} New/updated consortium object
     */
    saveConsortium: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      if (!permissions.consortia.write
          && args.consortium.id
          && !permissions.consortia[args.consortium.id].write) {
            return Boom.forbidden('Action not permitted');
      }

      return helperFunctions.getRethinkConnection()
        .then(connection =>
          rethink.table('consortia').insert(
            args.consortium,
            { 
              conflict: "update",
              returnChanges: true,
            }
          )
          .run(connection)
        )
        .then(result => result.changes[0].new_val)
    },
    /**
     * Saves pipeline
     * @param {object} auth User object from JWT middleware validateFunc
     * @param {object} args
     * @param {object} args.pipeline Pipeline object to add/update
     * @return {object} New/updated pipeline object
     */
    savePipeline: ({ auth: { credentials } }, args) => {
      const { permissions } = credentials;
      /* TODO: Add permissions
      if (!permissions.consortia.write
          && args.consortium.id
          && !permissions.consortia[args.consortium.id].write) {
            return Boom.forbidden('Action not permitted');
      }*/
      return helperFunctions.getRethinkConnection()
        .then((connection) =>
          rethink.table('pipelines').insert(
            args.pipeline,
            {
              conflict: "update",
              returnChanges: true,
            }
          )
          .run(connection)
          .then((result) => rethink.table('pipelines')
            .get(result.changes[0].new_val.id)
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
            .run(connection)
        ))
        .then(result => result)
    },
    setActiveComputation: (_, args) => {
      return new Promise();
    },
    setComputationInputs: (_, args) => {
      return new Promise();
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
          }).run(connection)
        )
        .then(result =>
          helperFunctions.getUserDetails({ username: credentials.id })
        )
        .then(result => result)
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
     * Result subscription
     * @param {object} payload
     * @param {string} payload.resultId The consortium changed
     * @param {object} variables
     * @param {string} variables.resultId The consortium listened for
     */
    resultChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('resultChanged'),
        (payload, variables) => (!variables.resultId || payload.resultId === variables.resultId)
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
     * Run subscription
     * @param {object} payload
     * @param {string} payload.runId The run changed
     * @param {object} variables
     * @param {string} variables.userId The user listened for
     */
    userRunChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('userRunChanged'),
        (payload, variables) => (payload.userRunChanged.clients.indexOf(variables.userId) > -1)
      )
    },
  },
};

module.exports = {
  resolvers,
  pubsub,
};
