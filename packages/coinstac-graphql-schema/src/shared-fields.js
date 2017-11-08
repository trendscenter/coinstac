const sharedFields = {
  computationMetadata: `
    id
    meta {
      name
      description
      version
    }
  `,
  consortiaInBrief: `
    id
    activeComputationId
    activeComputationInputs
    activePipeline
    description
    name
    tags
    owners
    users
  `,
  pipelineFields: `
    id
    description
    name
    owningConsortium
    shared
    steps {
      id
      computations {
        id
        meta {
          name
          description
          version
        }
      }
      controller {
        id
        options
      }
      ioMap
    }
  `,
};

module.exports = sharedFields;
