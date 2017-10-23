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
  userMetadata: `
    id
    email
    institution
    passwordHash
    permissions
  `,
};

module.exports = sharedFields;
