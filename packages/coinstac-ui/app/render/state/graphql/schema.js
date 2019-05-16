import gql from 'graphql-tag';

const typeDefs = gql`
  type AssociatedConsortium {
    id: ID!
    activePipelineId: ID
  }

  type Query {
    getAllAssociatedConsortia: [AssociatedConsortium]!
  }

  extend type Mutation {
    saveAssociatedConsortium(consortiumId: ID!, activePipelineId: ID): AssociatedConsortium
    deleteAssociatedConsortium(consortiumId: ID!): AssociatedConsortium
  }
`;

export default typeDefs;
