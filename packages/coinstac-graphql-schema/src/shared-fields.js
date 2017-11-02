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
    activePipelineId
    activeComputationInputs
    description
    name
    tags
    owners
    users
  `,
  pipelineOutputFields: `
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
  pipelineInputFields: `
    steps {
      id
      computations
      controller {
        id
        options
      }
      ioMap
    }
  `,
  pipelineFields: `
    id
    description
    name
    owningConsortium
  `,
};

module.exports = sharedFields;
