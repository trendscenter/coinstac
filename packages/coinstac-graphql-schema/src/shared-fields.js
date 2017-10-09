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
};

module.exports = sharedFields;
