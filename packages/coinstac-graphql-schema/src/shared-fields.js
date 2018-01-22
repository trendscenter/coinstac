const sharedFields = {
  computationMetadata: `
    id
    meta {
      name
      description
      version
    }
    delete
    submittedBy
  `,
  consortiaFields: `
    id
    activePipelineId
    activeComputationInputs
    delete
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
    delete
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
  pipelineSaveFields: `
    id
    delete
    description
    name
    owningConsortium
    shared
  `,
  resultFields: `
    id
    title
    pipelineId
    date
    results
  `,
};

module.exports = sharedFields;
