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
    members
    owners
  `,
  userMetadata: `
    id
    email
    institution
    passwordHash
    permissions
  `,
  pipelineFields: `
    id
    description
    name
    owningConsortium
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
