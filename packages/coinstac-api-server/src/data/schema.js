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
    id: ID
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
    activeComputationId: ID
    activeComputationInputs: [String]
    description: String!
    label: String!
    tags: [String]
    owners: [String]
    users: [String]
  }

  input ConsortiumInput {
    id: ID!
    activeComputationId: ID
    activeComputationInputs: [String]
    description: String!
    label: String!
    tags: [String]
    owners: [String]
    users: [String]
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
    removeAllComputations: JSON
    deleteConsortiumById(consortiumId: ID): String
    joinConsortium(username: String, consortiumId: ID): Consortium
    setActiveComputation(computationId: ID, consortiumId: ID): String
    setComputationInputs(consortiumId: ID, fieldIndex: Int, values: String ): String
    leaveConsortium(username: String, consortiumId: ID): String
    saveConsortium(consortium: ConsortiumInput): String
  }

  # This is a description of the queries
  type Query {
    # This is a description of the fetchAllComputations query
    fetchAllComputations: [Computation]
    fetchComputationDetails(computationName: String): Computation
    validateComputation(compId: ID): Boolean
    fetchConsortiumById(consortiumId: ID): Consortium
    fetchRunForConsortium(consortiumId: ID): [Run]
    fetchRunForUser(username: String): [Run]
    fetchRunById: Run
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = schema;
