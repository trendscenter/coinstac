import {
  gql,
} from 'react-apollo';
import { mutations, queries } from 'coinstac-graphql-schema';

export const addComputationFunc = gql`
  mutation AddComputationMutation($computationSchema: ComputationInput!) 
    ${mutations.addComputation}
`;

export const removeAllComputationsFunc = gql`
  mutation RemoveAllComputationsMutation {
    removeAllComputations
  }
`;

export const fetchAllComputationsMetadataFunc = gql`
  query FetchAllComputationsMetadataQuery
    ${queries.fetchAllComputationsMetadata}
`;

export const fetchComputationDetailsFunc = gql`
  query FetchComputationDetailsQuery ($computationName: String!)
    ${queries.fetchComputationDetails}
`;
