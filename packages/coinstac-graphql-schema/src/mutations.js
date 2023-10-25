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
      addUserRole(userId: $userId, table: $table, doc: $doc, role: $role, roleType: $roleType) {
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
      removeUserRole(userId: $userId, table: $table, doc: $doc, role: $role, roleType: $roleType) {
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
  saveError: `
    {
      saveError(runId: $runId, error: $error)
    }
  `,
  savePipeline: `
    {
      savePipeline(pipeline: $pipeline) {
        ${sharedFields.pipelineFields}
      }
    }
  `,
  saveResults: `
    {
      saveResults(runId: $runId, results: $results)
    }
  `,
  updateRunState: `
    {
      updateRunState(runId: $runId, data: $data)
    }
  `,
  updateUserConsortiumStatus: `
    {
      updateUserConsortiumStatus(consortiumId: $consortiumId, status: $status) {
        ${sharedFields.userMetadata}
      }
    }
  `,
  updateConsortiumMappedUsers: `
    {
      updateConsortiumMappedUsers(consortiumId: $consortiumId, isMapped: $isMapped)
    }
  `,
  updateConsortiaMappedUsers: `
    {
      updateConsortiaMappedUsers(consortia: $consortia, isMapped: $isMapped)
    }
  `,
  updatePassword: `
    {
      updatePassword(currentPassword: $currentPassword, newPassword: $newPassword)
    }
  `,
  saveMessage: `
    {
      saveMessage(threadId: $threadId, title: $title, recipients: $recipients, content: $content, action: $action) {
        ${sharedFields.threadFields}
      }
    }
  `,
  setReadMessage: `
    {
      setReadMessage(threadId: $threadId, userId: $userId)
    }
  `,
  createIssue: `
    {
      createIssue(issue: $issue)
    }
  `,
  createHeadlessClient: `
    {
      createHeadlessClient(data: $data) {
        ${sharedFields.headlessClientFields}
      }
    }
  `,
  updateHeadlessClient: `
    {
      updateHeadlessClient(headlessClientId: $id, data: $data) {
        ${sharedFields.headlessClientFields}
      }
    }
  `,
  generateHeadlessClientApiKey: `
    {
      generateHeadlessClientApiKey(headlessClientId: $headlessClientId)
    }
  `,
  saveDataset: `
    {
      saveDataset(input: $input) {
        ${sharedFields.datasetFields}
      }
    }
  `,
  deleteDataset: `
    {
      deleteDataset(id: $id) {
        ${sharedFields.datasetFields}
      }
    }
  `,
  stopRun: `
    {
      stopRun(runId: $runId)
    }
  `,
  deleteRun: `
    {
      deleteRun(runId: $runId)
    }
  `,
  approveOrRejectConsortiumJoinRequest: `
    {
      approveOrRejectConsortiumJoinRequest(consortiumId: $consortiumId, userId: $userId, isApprove: $isApprove) {
        ${sharedFields.consortiaFields}
      }
    }
  `,
  sendConsortiumJoinRequest: `
    {
      sendConsortiumJoinRequest(consortiumId: $consortiumId) {
        ${sharedFields.consortiaFields}
      }
    }
  `,
  saveUser: `
    {
      saveUser(userId: $userId, data: $data) {
        ${sharedFields.userData}
      }
    }
  `,
  deleteUser: `
    {
      deleteUser(userId: $userId)
    }
  `,
};

module.exports = mutations;
