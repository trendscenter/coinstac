import {
  gql,
} from 'react-apollo';
import { mutations, queries } from 'coinstac-graphql-schema';

export const ADD_COMPUTATION_MUTATION = gql`
  mutation addComputation($computationSchema: ComputationInput!) 
    ${mutations.addComputation}
`;

export const deleteConsortiumByIdFunc = gql`
  mutation DeleteConsortiumMutation($consortiumId: ID!) {
    deleteConsortiumById(consortiumId: $consortiumId){
      id
    }
  }
`;

export const leaveConsortiumFunc = gql`
  mutation LeaveConsortiumMutation($consortiumId: ID!) {
    leaveConsortium(consortiumId: $consortiumId){
      id
      users
    }
  }
`;

export const joinConsortiumFunc = gql`
  mutation JoinConsortiumMutation($consortiumId: ID!) {
    joinConsortium(consortiumId: $consortiumId){
      id
      users
    }
  }
`;

export const fetchAllConsortiaFunc = gql`
  query FetchAllConsortiaQuery
    ${queries.fetchAllConsortia}
`;

export const fetchAllPipelinesFunc = gql`
  query FetchAllPipelinesQuery
    ${queries.fetchAllPipelines}
`;

export const FETCH_ALL_COMPUTATIONS_METADATA_QUERY = gql`
  query fetchAllComputationsMetadata
    ${queries.fetchAllComputationsMetadata}
`;

export const FETCH_COMPUTATION_QUERY = gql`
  query fetchComputation ($computationName: String!)
    ${queries.fetchComputation}
`;

export const FETCH_PIPELINE_QUERY = gql`
  query fetchPipeline ($pipelineId: ID)
    ${queries.fetchPipeline}
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
