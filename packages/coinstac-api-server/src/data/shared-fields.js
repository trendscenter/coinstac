const schemaFields = {
  consortiumFields: `
    activePipelineId: ID
    activeComputationInputs: [String]
    description: String!
    name: String!
    tags: [String]
    owners: [ID]
    users: [ID]
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
  `,
  pipelineControllerFields: `
    id: ID
    options: JSON
    type: String
  `,
  pipelineStepFields: `
    ioMap: JSON 
    id: ID!
  `,
};

module.exports = schemaFields;
