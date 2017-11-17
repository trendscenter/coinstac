const sharedFields = require('./shared-fields');

const queries = {
  allDockerImages: `
    {
      fetchAllComputations {
        computation {
          dockerImage
        }
      }
    }
  `,
  fetchAllComputationsMetadata: `
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
  fetchAllPipelines: `
    {
      fetchAllPipelines {
        ${sharedFields.pipelineFields}
      }
    }
  `,
  fetchComputation: `
    {
      fetchComputation(computationIds: $computationIds) {
        id
        computation {
          input
          output
        }
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
};

module.exports = queries;
