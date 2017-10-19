import {
  gql,
} from 'react-apollo';
import { mutations, queries } from 'coinstac-graphql-schema';

export const ADD_COMPUTATION_MUTATION = gql`
  mutation addComputation($computationSchema: ComputationInput!) 
    ${mutations.addComputation}
`;

export const FETCH_ALL_COMPUTATIONS_METADATA_QUERY = gql`
  query fetchAllComputationsMetadata
    ${queries.fetchAllComputationsMetadata}
`;

export const FETCH_COMPUTATION_QUERY = gql`
  query fetchComputation ($computationName: String!)
    ${queries.fetchComputation}
`;
