const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `
  type ActiveInputValue {
    name: String
    type: String
  }

  type ComputationInput {
    _id: ID!,
    defaultValue: [String]
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
    _id: ID!
    meta: ComputationMeta
    name: String!
    url: String!
    version: String!
    inputs: [ComputationInput]
  }

  # Should owners/users be an array of user objects?
  type Consortium {
    _id: ID!
    activeComputationId: ID
    activeComputationInputs: [String]
    description: String!
    label: String!
    tags: [String]
    owners: [String]
    users: [String]
  }

  input ConsortiumInput {
    _id: ID!
    activeComputationId: ID
    activeComputationInputs: [String]
    description: String!
    label: String!
    tags: [String]
    owners: [String]
    users: [String]
  }

  type Run {
    _id: ID!,
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

  type Mutation {
    deleteConsortiumById(consortiumId: ID): String
    joinConsortium(username: String, consortiumId: ID): Consortium
    setActiveComputation(computationId: ID, consortiumId: ID): String
    setComputationInputs(consortiumId: ID, fieldIndex: Int, values: String ): String
    leaveConsortium(username: String, consortiumId: ID): String
    saveConsortium(consortium: ConsortiumInput): String
  }

  type Query {
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
