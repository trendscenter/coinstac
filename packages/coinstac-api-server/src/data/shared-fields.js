const schemaFields = {
  consortiumFields: `
    activePipelineId: ID
    activeComputationInputs: [String]
    delete: Boolean
    description: String!
    name: String!
    tags: [String]
    owners: JSON
    members: JSON
    activeMembers: JSON
    pipelines: [ID]
    results: [ID]
    isPrivate: Boolean
    mappedForRun: [ID]
    createDate: String
  `,
  computationFields: `
    display: JSON
    input: JSON
    output: JSON
  `,
  computationMetaFields: `
    repository: String
    description: String
    name: String!
    id: String!
    tags: [String]
    version: String
    compspecVersion: Int
    controller: String
    preprocess: Boolean
  `,
  computationRemoteFields: `
    type: String
    dockerImage: String
    command: [String]
  `,
  pipelineFields: `
    name: String
    description: String
    owner: ID
    owningConsortium: ID
    delete: Boolean
    shared: Boolean
    timeout: Int
    limitOutputToOwner: Boolean
    headlessMembers: JSON
  `,
  pipelineStepFields: `
    id: ID!
    inputMap: JSON
    dataMeta: JSON
  `,
  resultFields: `
    id: ID!
    title: String
    pipelineId: ID
    date: String
    results: JSON
  `,
  userFields: `
    consortiaStatuses: JSON
    email: String!
    institution: String
    username: String!
    permissions: JSON
    photo: String
    photoID: String
    name: String
    delete: Boolean
  `,
};

module.exports = schemaFields;
