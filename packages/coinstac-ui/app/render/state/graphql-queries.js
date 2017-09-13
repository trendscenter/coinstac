import {
  gql,
} from 'react-apollo';

export const addComputationMetadata = gql`
  mutation AddJsonSchema($computationSchema: ComputationInput!) {
    addComputation(computationSchema: $computationSchema) {
      id
      meta {
        name
        description
        version
        dockerImage
      }
    }
  }
`;

export const deleteAllComputations = gql`
  mutation DeleteAllJsonSchema {
    removeAllComputations
  }
`;

export const fetchComputationMetadata = gql`
  query ComputationMetadataQuery {
    fetchAllComputations {
      id
      meta {
        name
        description
        version
        dockerImage
      }
    }
  }
`;

export const fetchComputationLocalIO = gql`
  query ComputationIOQuery ($computationName: String!) {
    fetchComputationMetadataByName (computationName: $computationName) {
      id
      local
    }
  }
`;
