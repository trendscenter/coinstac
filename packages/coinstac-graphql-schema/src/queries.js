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
        ${sharedFields.pipelineOutputFields}
      }
    }
  `,
  fetchComputation: `
    {
      fetchComputation (computationName: $computationName) {
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
