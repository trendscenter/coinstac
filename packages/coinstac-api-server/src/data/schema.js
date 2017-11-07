const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');
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
    meta: ComputationMeta
    computation: ComputationField
  }

  input ComputationInput {
    id: ID
    meta: ComputationMetaInput
    computation: ComputationFieldInput
  }

  # Should owners/users be an array of user objects?
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

  type Run {
    id: ID!,
    consortiumId: ID!
    startDate: String
    endDate: String
    userErrors: String
    globalResults: String
    userResults: String
  }

  type User {
    username: String!
  }

  # This is the general mutation description
  type Mutation {
    # Stringify incoming computation, parse prior to insertion call
    addComputation(computationSchema: ComputationInput): Computation
    removeComputation(compId: ID): JSON
    deleteConsortiumById(consortiumId: ID): Consortium
    joinConsortium(consortiumId: ID): Consortium
    setActiveComputation(computationId: ID, consortiumId: ID): String
    setComputationInputs(consortiumId: ID, fieldIndex: Int, values: String ): String
    leaveConsortium(consortiumId: ID): Consortium
    saveConsortium(consortium: ConsortiumInput): Consortium
  }

  # This is a description of the queries
  type Query {
    # This is a description of the fetchAllComputations query
    fetchAllComputations: [Computation]
    fetchComputation(computationIds: [ID]): [Computation]
    fetchAllConsortia: [Consortium]
    fetchPipeline(pipelineId: ID): Pipeline
    fetchAllPipelines: [Pipeline]
    validateComputation(compId: ID): Boolean
    fetchConsortiumById(consortiumId: ID): Consortium
    fetchRunForConsortium(consortiumId: ID): [Run]
    fetchRunForUser(username: String): [Run]
    fetchRunById: Run
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = schema;
