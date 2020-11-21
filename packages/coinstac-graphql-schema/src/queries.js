const sharedFields = require('./shared-fields');

const queries = {
  allDockerImages: `
    {
      fetchAllComputations {
        id
        computation {
          dockerImage
        }
        meta {
          name
        }
      }
    }
  `,
  computationChanged: `
  {
    computationChanged(computationId: $computationId) {
      ${sharedFields.computationMetadata}
    }
  }
  `,
  consortiumChanged: `
  {
    consortiumChanged(consortiumId: $consortiumId) {
      ${sharedFields.consortiaFields}
    }
  }
  `,
  threadChanged: `
  {
    threadChanged(threadId: $threadId) {
      ${sharedFields.threadFields}
    }
  }
  `,
  resultChanged: `
  {
    resultChanged(resultId: $resultId) {
      ${sharedFields.resultFields}
    }
  }
  `,
  fetchAllComputations: `
    {
      fetchAllComputations {
        ${sharedFields.computationMetadata}
      }
    }
  `,
  fetchAllConsortia: `
    {
      fetchAllConsortia {
        ${sharedFields.consortiaFields}
      }
    }
  `,
  fetchAllUserRuns: `
    {
      fetchAllUserRuns {
        ${sharedFields.runFields}
      }
    }
  `,
  fetchConsortium: `
    {
      fetchConsortium(consortiumId: $consortiumId) {
        ${sharedFields.consortiaFields}
      }
    }
  `,
  fetchPipeline: `
    {
      fetchPipeline(pipelineId: $pipelineId) {
        ${sharedFields.pipelineFields}
      }
    }
  `,
  fetchResult: `
    {
      fetchResult(resultId: $resultId) {
        ${sharedFields.resultFields}
      }
    }
  `,
  fetchUser: `
    {
      fetchUser(userId: $userId) {
        ${sharedFields.userMetadata}
      }
    }
  `,
  fetchAllUsers: `
    {
      fetchAllUsers {
        ${sharedFields.userData}
      }
    }
  `,
  fetchAllPipelines: `
    {
      fetchAllPipelines {
        ${sharedFields.pipelineFields}
      }
    }
  `,
  fetchAllResults: `
    {
      fetchAllResults {
        ${sharedFields.resultFields}
      }
    }
  `,
  fetchComputation: `
    {
      fetchComputation(computationIds: $computationIds) {
        id
        computation {
          display
          input
          output
        }
      }
    }
  `,
  fetchAllThreads: `
    {
      fetchAllThreads {
        ${sharedFields.threadFields}
      }
    }
  `,
  pipelineChanged: `
    {
      pipelineChanged(pipelineId: $pipelineId) {
        ${sharedFields.pipelineFields}
      }
    }
  `,
  userChanged: `
    {
      userChanged(userId: $userId) {
        ${sharedFields.userData}
      }
    }
  `,
  userRunChanged: `
    {
      userRunChanged(userId: $userId) {
        ${sharedFields.runFields}
      }
    }
  `,
};

module.exports = queries;
