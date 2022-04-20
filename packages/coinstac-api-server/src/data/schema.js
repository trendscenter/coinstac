const { makeExecutableSchema } = require('apollo-server-hapi');
const { pubsub, resolvers } = require('./resolvers');
const sharedFields = require('./shared-fields');

const typeDefs = `
  scalar JSON

  type ComputationMeta {
    ${sharedFields.computationMetaFields}
  }

  input ComputationMetaInput {
    ${sharedFields.computationMetaFields}
  }

  type ComputationRemote {
    ${sharedFields.computationRemoteFields}
  }

  input ComputationRemoteInput {
    ${sharedFields.computationRemoteFields}
  }

  type ComputationField {
    ${sharedFields.computationRemoteFields}
    ${sharedFields.computationFields}
    remote: ComputationRemote
  }

  input ComputationFieldInput {
    ${sharedFields.computationRemoteFields}
    ${sharedFields.computationFields}
    remote: ComputationRemoteInput
  }

  type Computation {
    id: ID!
    delete: Boolean
    meta: ComputationMeta
    computation: ComputationField
    submittedBy: ID!
  }

  input ComputationInput {
    id: ID
    meta: ComputationMetaInput
    computation: ComputationFieldInput
  }

  type Consortium {
    id: ID!
    ${sharedFields.consortiumFields}
  }

  input ConsortiumInput {
    id: ID
    ${sharedFields.consortiumFields}
  }

  type PipelineStep {
    controller: JSON
    computations: [Computation]
    ${sharedFields.pipelineStepFields}
  }

  input PipelineStepInput {
    controller: JSON
    computations: [ID]
    ${sharedFields.pipelineStepFields}
  }

  type Pipeline {
    id: ID!
    steps: [PipelineStep]
    ${sharedFields.pipelineFields}
  }

  input PipelineInput {
    id: ID
    steps: [PipelineStepInput]
    ${sharedFields.pipelineFields}
  }

  type Result {
    ${sharedFields.resultFields}
  }

  type Run {
    id: ID!,
    clients: JSON
    consortiumId: ID!
    startDate: String
    endDate: String
    pipelineSnapshot: JSON
    error: JSON
    results: JSON
    remotePipelineState: JSON
    type: String
    sharedUsers: [ID]
    status: String!
    delete: Boolean
  }

  type User {
    id: ID!
    ${sharedFields.userFields}
  }

  type UserInput {
    id: ID
    ${sharedFields.userFields}
  }

  input ActionInput {
    type: String
    detail: JSON
  }

  type ActionOutput {
    type: String
    detail: JSON
  }

  type MessageOutput {
    id: ID
    sender: JSON
    recipients: JSON
    content: String
    date: String
    action: ActionOutput
  }

  type Thread {
    id: ID
    messages: [MessageOutput]
    owner: JSON
    title: String
    users: JSON
    date: String
  }

  type HeadlessClient {
    id: ID!
    name: String!
    computationWhitelist: JSON
    owners: JSON
    hasApiKey: Boolean
    delete: Boolean
  }

  input HeadlessClientInput {
    id: ID
    name: String
    computationWhitelist: JSON
    owners: JSON
  }

  type Dataset {
    id: ID
    datasetDescription: JSON
    participantsDescription: JSON
    otherInfo: JSON
    owner: JSON
  }

  type DebugString {
    info: String
  }

  input IssueInput {
    title: String
    body: String
  }

  input DatasetInput {
    id: ID
    datasetDescription: JSON
    participantsDescription: JSON
    otherInfo: JSON
  }

  # This is the general mutation description
  type Mutation {
    # Stringify incoming computation, parse prior to insertion call
    addComputation(computationSchema: ComputationInput): Computation
    addUserRole(userId: ID!, table: String!, doc: String!, role: String!, userName: String, roleType: String!): User
    createRun(consortiumId: ID): Run
    deleteConsortiumById(consortiumId: ID): Consortium
    deletePipeline(pipelineId: ID): Pipeline
    joinConsortium(consortiumId: ID!): Consortium
    leaveConsortium(consortiumId: ID!): Consortium
    removeComputation(computationId: ID): Computation
    removeUserRole(userId: ID!, table: String!, doc: String!, role: String!, userName: String, roleType: String!): User
    saveActivePipeline(consortiumId: ID, activePipelineId: ID): JSON
    saveConsortium(consortium: ConsortiumInput!): Consortium
    saveError(runId: ID, error: JSON): JSON
    savePipeline(pipeline: PipelineInput): Pipeline
    saveResults(runId: ID, results: JSON): JSON
    updateRunState(runId: ID, data: JSON): JSON
    updateUserConsortiumStatus(consortiumId: ID, status: String): User
    updateConsortiumMappedUsers(consortiumId: ID, isMapped: Boolean): JSON
    updateConsortiaMappedUsers(consortia: [ID], isMapped: Boolean): JSON
    updatePassword(currentPassword: String!, newPassword: String!): Boolean
    saveMessage(threadId: ID, title: String!, recipients: JSON, content: String!, action: ActionInput): Thread
    setReadMessage(threadId: ID, userId: ID): JSON
    createIssue(issue: IssueInput!): JSON
    createHeadlessClient(data: HeadlessClientInput!): HeadlessClient
    updateHeadlessClient(headlessClientId: ID!, data: HeadlessClientInput!): HeadlessClient
    deleteHeadlessClient(headlessClientId: ID!): HeadlessClient
    generateHeadlessClientApiKey(headlessClientId: ID!): String
    saveDataset(input: DatasetInput!): Dataset
    deleteDataset(id: ID!): Dataset
    saveConsortiumActiveMembers(consortiumId: ID!, members: JSON): Consortium
    deleteUser(userId: ID!): String
    stopRun(runId: ID): JSON
    deleteRun(runId: ID): JSON
  }

  # This is a description of the queries
  type Query {
    # This is a description of the fetchAllComputations query
    fetchAllComputations(preprocess: Boolean): [Computation]
    fetchAllConsortia: [Consortium]
    fetchAllPipelines: [Pipeline]
    fetchAllResults: [Result]
    fetchAllUsers: [User]
    fetchAllUserRuns: [Run]
    fetchRun(runId: ID!): Run
    fetchAllHeadlessClients: [HeadlessClient]
    fetchAccessibleHeadlessClients: [HeadlessClient]
    fetchComputation(computationIds: [ID]): [Computation]
    fetchConsortium(consortiumId: ID): Consortium
    fetchPipeline(pipelineId: ID): Pipeline
    fetchResult(resultId: ID): Result
    fetchUser(userId: ID): User
    fetchHeadlessClient(id: ID!): HeadlessClient
    fetchHeadlessClientConfig: JSON
    fetchAllThreads: [Thread]
    fetchUsersOnlineStatus: JSON
    fetchAvailableHeadlessClients: [HeadlessClient]
    fetchAllDatasetsSubjectGroups: [String]
    searchDatasets(searchString: String, subjectGroups: [String], modality: String): [Dataset]
    fetchDataset(id: ID!): Dataset
    getPipelines: DebugString
  }

  type Subscription {
    computationChanged(computationId: ID): Computation
    consortiumChanged(consortiumId: ID): Consortium
    consortiumPipelineChanged: Consortium
    pipelineChanged(pipelineId: ID): Pipeline
    threadChanged(threadId: ID): Thread
    userRunChanged(userId: ID): Run
    runStarted(userId: ID): Run
    userChanged(userId: ID): User
    usersOnlineStatusChanged: JSON
    headlessClientChanged: HeadlessClient
    runWithHeadlessClientStarted(clientId: ID): Run
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = {
  schema,
  typeDefs,
  resolvers,
  pubsub,
};
