const graphqlSchema = {
  addComputation: `
    {
      addComputation(computationSchema: $computationSchema) {
        id
        meta {
          name
          description
          version
          dockerImage
        }
      }
    }
  `,
  allDockerImages: `
    {
      fetchAllComputations {
        meta {
          dockerImage
        }
      }
    }
  `,
  allMetadata: `
    {
      fetchAllComputations {
        id
        meta {
          name
          description
          version
          dockerImage
        }
      }
    }
  `,
  localIOByName: `
    {
      fetchComputationMetadataByName (computationName: $computationName) {
        id
        local
      }
    }
  `,
};

module.exports = graphqlSchema;
