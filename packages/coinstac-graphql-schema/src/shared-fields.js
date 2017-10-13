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
    description
    name
    tags
    owners
    users
  `,
  pipelineFields: `
    id
    computations
    controller {
      options
      id
    }
    name
    description
  `,
};

module.exports = sharedFields;
