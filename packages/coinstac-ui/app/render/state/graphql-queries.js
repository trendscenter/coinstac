import {
  gql,
} from 'react-apollo';
import graphqlSchema from 'coinstac-graphql-schema';

export const addComputationMetadata = gql`
  mutation AddJsonSchema($computationSchema: ComputationInput!) 
    ${graphqlSchema.addComputation}
`;

export const deleteAllComputations = gql`
  mutation DeleteAllJsonSchema {
    removeAllComputations
  }
`;

export const fetchComputationMetadata = gql`
  query ComputationMetadataQuery
    ${graphqlSchema.allMetadata}
`;

export const fetchComputationLocalIO = gql`
  query ComputationInput ($computationName: String!)
    ${graphqlSchema.localIOByName}
`;
