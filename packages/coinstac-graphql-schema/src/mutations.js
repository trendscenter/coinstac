const sharedFields = require('./shared-fields');

const mutations = {
  addComputation: `
    {
      addComputation(computationSchema: $computationSchema) {
        ${sharedFields.computationMetadata}
      }
    }
  `,
  addUserRole: `
    {
      addUserRole(userId: $userId, table: $table, doc: $doc, role: $role) {
        ${sharedFields.userMetadata}
      }
    }
  `,
  createRun: `
    {
      createRun(consortiumId: $consortiumId) {
        ${sharedFields.runFields}
      }
    }
  `,
  removeComputation: `
    {
      removeComputation(computationId) {
        ${sharedFields.computationMetadata}
      }
    }
  `,
  removeUserRole: `
    {
      removeUserRole(userId: $userId, table: $table, doc: $doc, role: $role) {
        ${sharedFields.userMetadata}
      }
    }
  `,
  saveConsortium: `
    {
      saveConsortium(consortium: $consortium) {
        ${sharedFields.consortiaFields}
      }
    }
  `,
  savePipeline: `
    {
      savePipeline(pipeline: $pipeline) {
        ${sharedFields.pipelineFields}
      }
    }
  `,
  updateUserConsortiumStatus: `
    {
      updateUserConsortiumStatus(consortiumId: $consortiumId, status: $status) {
        ${sharedFields.userMetadata}
      }
    }
  `,
};

module.exports = mutations;
