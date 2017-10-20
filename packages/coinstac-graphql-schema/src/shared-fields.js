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
    members
    owners
  `,
};

module.exports = sharedFields;
