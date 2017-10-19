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
};

module.exports = queries;
