import gql from 'graphql-tag';

const typeDefs = gql`
  scalar JSON

  extend type Consortium {
    isMapped: Boolean!
    pipelineSteps: [PipelineStep]
    runs: Int
    stepIO: JSON
  }

  type Collection {
    name: String!
    associatedConsortium: ID
    fileGroups: JSON
  }

  extend type Mutation {
    syncRemoteLocalConsortium(remoteConsortium: Consortium!, pipelineSteps: [PipelineStep]): Consortium!
    saveCollection(name: String!, associatedConsortium: ID, fileGroups: JSON): Collection
    saveConsortiumMapping(consortiumId: ID, stepIO: JSON): Consortium
    updateConsortiumPipelineSteps(consortiumId: ID, pipelineId: ID): Consortium
  }
`;

export default typeDefs;
