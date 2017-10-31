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
    name
    description
    owningConsortia
    steps
    controller {
      options
      id
    }
  `,
};

module.exports = sharedFields;
