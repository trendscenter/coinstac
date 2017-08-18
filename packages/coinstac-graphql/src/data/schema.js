const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `
  type ComputationIOItem {
    type: String
    defaultValue: [String]
    values: [String]
    help: String
    label: String
    items: String
    max: Int
    min: Int
    step: Float
  }

  # Computation inputs are described by computation authors
  type ComputationRemoteInput {
    betaCount: ComputationIOItem
    userCount: ComputationIOItem
    localMeanY: ComputationIOItem
    yLabel: ComputationIOItem
    xLabel: ComputationIOItem
  }

  type ComputationRemoteOutput {
    averageBetaVector: ComputationIOItem
    globalMeanY: ComputationIOItem
    xLabel: ComputationIOItem
    yLabel: ComputationIOItem
  }

  type ComputationLocalInput {
    freeSurferRegion: ComputationIOItem
    lambda: ComputationIOItem
    covariates: ComputationIOItem
  }

  type ComputationLocalOutput {
    betaVector: ComputationIOItem
    localCount: ComputationIOItem
    localMeanY: ComputationIOItem
    rSquared: ComputationIOItem
    tValue: ComputationIOItem
    pValue: ComputationIOItem
    biasedX: ComputationIOItem
    y: ComputationIOItem
  }

  union ComputationLocaleInput = ComputationLocalInput | ComputationRemoteInput

  union ComputationLocaleOutput = ComputationLocalOutput | ComputationRemoteOutput

  type ComputationLocale {
    type: String
    command: String
    input: ComputationLocaleInput
    output: ComputationLocaleOutput
  }

  type ComputationMeta {
    description: String
    name: String!
    tags: [String]
    version: String
    dockerImage: String
  }

  type Computation {
    id: ID!
    meta: ComputationMeta
    local: ComputationLocale
    remote: ComputationLocale
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
    addComputation(computation: String): String
    removeComputation(compId: ID): String
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
    fetchComputationMetadataByName(computationName: String): Computation
    validateComputation(compId: ID): Boolean
    fetchConsortiumById(consortiumId: ID): Consortium
    fetchRunForConsortium(consortiumId: ID): [Run]
    fetchRunForUser(username: String): [Run]
    fetchRunById: Run
  }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = schema;
