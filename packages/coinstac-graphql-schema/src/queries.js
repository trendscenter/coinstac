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
  fetchComputationDetails: `
    {
      fetchComputationDetails (computationName: $computationName) {
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
