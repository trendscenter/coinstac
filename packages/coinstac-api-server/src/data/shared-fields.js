const schemaFields = {
  consortiumFields: `
    activePipelineId: ID
    activeComputationInputs: [String]
    delete: Boolean
    description: String!
    name: String!
    tags: [String]
    owners: [ID]
    members: [ID]
    pipelines: [ID]
    results: [ID]
  `,
  computationFields: `
    input: JSON
    output: JSON
  `,
  computationMetaFields: `
    repository: String
    description: String
    name: String!
    tags: [String]
    version: String
    controller: String
  `,
  computationRemoteFields: `
    type: String
    dockerImage: String
    command: [String]
  `,
  pipelineFields: `
    name: String
    description: String
    owningConsortium: ID
    delete: Boolean
    shared: Boolean
  `,
  pipelineControllerFields: `
    id: ID
    options: JSON
    type: String
  `,
  pipelineStepFields: `
    inputMap: JSON 
    id: ID!
  `,
  userFields: `
    consortiaStatuses: JSON
    email: String!
    institution: String
    passwordHash: String!
    permissions: JSON
  `,
};

module.exports = schemaFields;
