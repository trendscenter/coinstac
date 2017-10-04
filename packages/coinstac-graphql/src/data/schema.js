const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');
const compFields = require('./computation-fields');

const typeDefs = `
  scalar JSON

  type ComputationMeta {
    ${compFields.computationMetaFields()}
  }

  input ComputationMetaInput {
    ${compFields.computationMetaFields()}
  }

  type Computation {
    id: ID!
    meta: ComputationMeta
    local: JSON
    remote: JSON
  }

  input ComputationInput {
    id: ID
    meta: ComputationMetaInput
    local: JSON
    remote: JSON
  }

  # Should owners/users be an array of user objects?
  type Consortium {
    id: ID!
    activeComputationId: ID
    activeComputationInputs: [String]
    description: String!
    name: String!
    tags: [String]
    owners: [ID]
    users: [ID]
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
    users: [String]
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
    username: String!
  }

  # This is the general mutation description
  type Mutation {
    # Stringify incoming computation, parse prior to insertion call
    addComputation(computationSchema: ComputationInput): Computation
    removeComputation(compId: ID): JSON
    removeAllComputations: JSON
    deleteConsortiumById(consortiumId: ID): Consortium
    joinConsortium(username: String, consortiumId: ID): Consortium
    setActiveComputation(computationId: ID, consortiumId: ID): String
    setComputationInputs(consortiumId: ID, fieldIndex: Int, values: String ): String
    leaveConsortium(username: String, consortiumId: ID): String
    saveConsortium(consortium: ConsortiumInput): Consortium
  }

  # This is a description of the queries
  type Query {
    # This is a description of the fetchAllComputations query
    fetchAllComputations: [Computation]
    fetchComputationMetadataByName(computationName: String): Computation
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
