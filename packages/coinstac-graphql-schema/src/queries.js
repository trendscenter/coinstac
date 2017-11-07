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
        ${sharedFields.consortiaInBrief}
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
      fetchComputation (computationIds: $computationIds) {
        id
        computation {
          input
          output
        }
      }
    }
  `,
  fetchPipeline: `
    {
      fetchPipeline (pipelineId: $pipelineId) {
        ${sharedFields.pipelineFields}
      }
    }
  `,
};

module.exports = queries;
