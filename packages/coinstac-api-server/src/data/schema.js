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

  type Consortium {
    id: ID!
    activeComputationId: ID
    activeComputationInputs: [String]
    description: String!
    name: String!
    tags: [String]
    owners: [ID]
    members: [ID]
    pipelines: [ID]
    results: [ID]
  }

  input ConsortiumInput {
    id: ID
    activeComputationId: ID
    activeComputationInputs: [String]
    description: String!
    name: String!
    tags: [String]
    owners: [String]
    members: [String]
    pipelines: [ID]
    results: [ID]
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
    removeComputation(compId: ID): JSON
    removeAllComputations: JSON
    deleteConsortiumById(consortiumId: ID): Consortium
    joinConsortium(consortiumId: ID): Consortium
    setActiveComputation(computationId: ID, consortiumId: ID): String
    setComputationInputs(consortiumId: ID, fieldIndex: Int, values: String ): String
    leaveConsortium(consortiumId: ID): Consortium
    saveConsortium(consortium: ConsortiumInput): Consortium
    addUserRole(userId: ID, table: String, doc: String, role: String): User
    removeUserRole(userId: ID, table: String, doc: String, role: String): User
  }

  # This is a description of the queries
  type Query {
    # This is a description of the fetchAllComputations query
    fetchAllComputations: [Computation]
    fetchComputation(computationIds: [ID]): [Computation]
    fetchAllConsortia: [Consortium]
    validateComputation(compId: ID): Boolean
    fetchConsortiumById(consortiumId: ID): Consortium
    fetchRunForConsortium(consortiumId: ID): [Run]
    fetchRunForUser(username: String): [Run]
    fetchRunById: Run
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = schema;
