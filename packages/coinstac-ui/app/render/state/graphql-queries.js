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

export const saveConsortiumFunc = gql`
  mutation SaveConsortiumMutation($consortium: ConsortiumInput!) {
    saveConsortium(consortium: $consortium) {
      id
      name
      description
      pipelines
      results
    }
  }
`;

export const deleteAllComputations = gql`
  mutation DeleteAllJsonSchema {
    removeAllComputations
  }
`;

export const fetchAllComputationsFunc = gql`
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

export const fetchComputationDetailsFunc = gql`
  query ComputationIOQuery ($computationIds: [ID]) {
    fetchComputationDetails (computationIds: $computationIds) {
      id
      local
    }
  }
`;

export const fetchAllConsortiaFunc = gql`
  query FetchAllConsortiaQuery {
    fetchAllConsortia {
      id
      activeComputationId
      activeComputationInputs
      description
      name
      tags
      owners
      users
    }
  }
`;
