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

  type PipelineController {
    ${sharedFields.pipelineControllerFields}
  }

  input PipelineControllerInput {
    ${sharedFields.pipelineControllerFields}
  }

  type PipelineStep {
    controller: PipelineController
    computations: [Computation]
    ${sharedFields.pipelineStepFields} 
  }

  input PipelineStepInput {
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
    clients: [String]
    consortiumId: ID!
    startDate: String
    endDate: String
    pipelineSnapshot: JSON
    error: JSON
    results: JSON
    remotePipelineState: JSON
    type: String
  }

  type User {
    id: ID!
    ${sharedFields.userFields}
  }

  type UserInput {
    id: ID
    ${sharedFields.userFields}
  }

  # This is the general mutation description
  type Mutation {
    # Stringify incoming computation, parse prior to insertion call
    addComputation(computationSchema: ComputationInput): Computation
    addUserRole(userId: ID!, table: String!, doc: String!, role: String!): User
    createRun(consortiumId: ID): Run
    deleteConsortiumById(consortiumId: ID): Consortium
    deletePipeline(pipelineId: ID): Pipeline
    joinConsortium(consortiumId: ID!): Consortium
    leaveConsortium(consortiumId: ID!): Consortium
    removeComputation(computationId: ID): Computation
    removeUserRole(userId: ID!, table: String!, doc: String!, role: String!): User
    saveActivePipeline(consortiumId: ID, activePipelineId: ID): String
    saveConsortium(consortium: ConsortiumInput!): Consortium
    saveError(runId: ID, error: JSON): JSON
    savePipeline(pipeline: PipelineInput): Pipeline
    saveResults(runId: ID, results: JSON): JSON
    setActiveComputation(computationId: ID, consortiumId: ID): String
    setComputationInputs(consortiumId: ID, fieldIndex: Int, values: String ): String
    updateRunState(runId: ID, data: JSON): JSON
    updateUserConsortiumStatus(consortiumId: ID, status: String): User
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
    validateComputation(compId: ID): Boolean
  }

  type Subscription {
    computationChanged(computationId: ID): Computation
    consortiumChanged(consortiumId: ID): Consortium
    pipelineChanged(pipelineId: ID): Pipeline
    userRunChanged(userId: ID): Run
    userChanged(userId: ID): User
    userMetadataChanged(userId: ID): User
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = {
  schema,
  pubsub,
};
