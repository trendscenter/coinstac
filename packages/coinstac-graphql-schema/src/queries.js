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
  fetchComputationDetails: `
    {
      fetchComputationDetails (computationIds: $computationIds) {
        id
        computation {
          input
          output
        }
      }
    }
  `,
};

module.exports = queries;
