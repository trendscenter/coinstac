const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `
  type ActiveInputValue {
    name: String
    type: String
  }

  # Computation inputs are described by computation authors
  type ComputationInput {
    defaultValue: String
    type: String!
    label: String!
    help: String
    max: Int
    min: Int
    step: Float
    values: [String]
  }

  type ComputationMeta {
    description: String
    name: String!
    tags: [String]
  }

  type Computation {
    id: ID!
    meta: ComputationMeta
    name: String!
    url: String!
    version: String!
    inputs: [[ComputationInput]]
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
    # This is an individual mutation description
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
    fetchComputationById(computationId: ID): Computation
    fetchConsortiumById(consortiumId: ID): Consortium
    fetchRunForConsortium(consortiumId: ID): [Run]
    fetchRunForUser(username: String): [Run]
    fetchRunById: Run
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = schema;
