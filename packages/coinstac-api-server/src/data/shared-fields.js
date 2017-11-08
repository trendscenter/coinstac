const computationFields = {
  consortiumFields: `
    activeComputationId: ID
    activeComputationInputs: [String]
    activePipeline: ID
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
    shared: Boolean
  `,
  pipelineControllerFields: `
    id: ID
    options: JSON
    type: String
  `,
  pipelineStepFields: `
    ioMap: JSON 
  `,
};

module.exports = computationFields;
