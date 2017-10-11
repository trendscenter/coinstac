import {
  gql,
} from 'react-apollo';
import { mutations, queries } from 'coinstac-graphql-schema';

export const addComputationFunc = gql`
  mutation AddComputationMutation($computationSchema: ComputationInput!) 
    ${mutations.addComputation}
`;

export const deleteConsortiumByIdFunc = gql`
  mutation DeleteConsortiumMutation($consortiumId: ID!) {
    deleteConsortiumById(consortiumId: $consortiumId){
      id
    }
  }
`;

export const fetchAllComputationsMetadataFunc = gql`
  query FetchAllComputationsMetadataQuery
    ${queries.fetchAllComputationsMetadata}
`;

export const fetchAllConsortiaFunc = gql`
  query FetchAllConsortiaQuery
    ${queries.fetchAllConsortia}
`;

export const fetchComputationDetailsFunc = gql`
  query FetchComputationDetailsQuery ($computationIds: [ID])
    ${queries.fetchComputationDetails}
`;

export const removeAllComputationsFunc = gql`
  mutation RemoveAllComputationsMutation {
    removeAllComputations
  }
`;

export const saveConsortiumFunc = gql`
  mutation SaveConsortiumMutation($consortium: ConsortiumInput!)
    ${mutations.saveConsortium}
`;
