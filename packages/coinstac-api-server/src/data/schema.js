const { makeExecutableSchema } = require('graphql-tools');
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

  type PipelineController {
    ${sharedFields.pipelineControllerFields}
  }

  input PipelineControllerInput {
    ${sharedFields.pipelineControllerFields}
  }

  type PipelineStep {
    id: ID!
    controller: PipelineController
    computations: [Computation]
    ${sharedFields.pipelineStepFields}
  }

  input PipelineStepInput {
    id: ID
    controller: PipelineControllerInput
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
    clients: [ID]
    members: JSON
    consortiumId: ID!
    startDate: String
    endDate: String
    pipelineSnapshot: JSON
    error: JSON
    results: JSON
    remotePipelineState: JSON
    type: String
    sharedUsers: [ID]
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

  input IssueInput {
    title: String
    body: String
  }

  # This is the general mutation description
  type Mutation {
    # Stringify incoming computation, parse prior to insertion call
    addComputation(computationSchema: ComputationInput): Computation
    addUserRole(userId: ID!, table: String!, doc: String!, role: String!, userName: String): User
    createRun(consortiumId: ID): Run
    deleteConsortiumById(consortiumId: ID): Consortium
    deletePipeline(pipelineId: ID): Pipeline
    joinConsortium(consortiumId: ID!): Consortium
    leaveConsortium(consortiumId: ID!): Consortium
    removeComputation(computationId: ID): Computation
    removeUserRole(userId: ID!, table: String!, doc: String!, role: String!, userName: String): User
    saveActivePipeline(consortiumId: ID, activePipelineId: ID): JSON
    saveConsortium(consortium: ConsortiumInput!): Consortium
    saveError(runId: ID, error: JSON): JSON
    savePipeline(pipeline: PipelineInput): Pipeline
    saveResults(runId: ID, results: JSON): JSON
    setActiveComputation(computationId: ID, consortiumId: ID): String
    setComputationInputs(consortiumId: ID, fieldIndex: Int, values: String ): String
    updateRunState(runId: ID, data: JSON): JSON
    updateUserConsortiumStatus(consortiumId: ID, status: String): User
    updateConsortiumMappedUsers(consortiumId: ID, isMapped: Boolean): JSON
    updateConsortiaMappedUsers(consortia: [ID], isMapped: Boolean): JSON
    updatePassword(currentPassword: String!, newPassword: String!): Boolean
    saveMessage(threadId: ID, title: String!, recipients: JSON, content: String!, action: ActionInput): Thread
    setReadMessage(threadId: ID, userId: ID): JSON
    createIssue(issue: IssueInput!): JSON
  }

  # This is a description of the queries
  type Query {
    # This is a description of the fetchAllComputations query
    fetchAllComputations: [Computation]
    fetchAllConsortia: [Consortium]
    fetchAllPipelines: [Pipeline]
    fetchAllResults: [Result]
    fetchAllUsers: [User]
    fetchAllUserRuns: [Run]
    fetchComputation(computationIds: [ID]): [Computation]
    fetchConsortium(consortiumId: ID): Consortium
    fetchPipeline(pipelineId: ID): Pipeline
    fetchResult(resultId: ID): Result
    fetchUser(userId: ID): User
    fetchAllThreads: [Thread]
    validateComputation(compId: ID): Boolean
    fetchUsersOnlineStatus: JSON
  }

  type Subscription {
    computationChanged(computationId: ID): Computation
    consortiumChanged(consortiumId: ID): Consortium
    pipelineChanged(pipelineId: ID): Pipeline
    threadChanged(threadId: ID): Thread
    userRunChanged(userId: ID): Run
    userChanged(userId: ID): User
    usersOnlineStatusChanged: JSON
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = {
  schema,
  pubsub,
};
