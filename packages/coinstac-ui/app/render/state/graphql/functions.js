import { gql } from 'react-apollo';
import { mutations, queries } from 'coinstac-graphql-schema';

export const ADD_COMPUTATION_MUTATION = gql`
  mutation addComputation($computationSchema: ComputationInput!) 
    ${mutations.addComputation}
`;

export const ADD_USER_ROLE_MUTATION = gql`
  mutation addUserRole($userId: ID!, $table: String!, $doc: String!, $role: String!)
    ${mutations.addUserRole}
`;

export const DELETE_CONSORTIUM_MUTATION = gql`
  mutation deleteConsortiumById($consortiumId: ID!) {
    deleteConsortiumById(consortiumId: $consortiumId){
      id
    }
  }
`;

export const FETCH_ALL_PIPELINES_QUERY = gql`
  query fetchAllPipelines
    ${queries.fetchAllPipelines}
`;

export const FETCH_ALL_COMPUTATIONS_METADATA_QUERY = gql`
  query fetchAllComputationsMetadata
    ${queries.fetchAllComputationsMetadata}
`;

export const FETCH_ALL_CONSORTIA_QUERY = gql`
  query fetchAllConsortia
    ${queries.fetchAllConsortia}
`;

export const FETCH_COMPUTATION_QUERY = gql`
  query fetchComputation ($computationIds: [ID])
    ${queries.fetchComputation}
`;

export const FETCH_PIPELINE_QUERY = gql`
  query fetchPipeline ($pipelineId: ID)
    ${queries.fetchPipeline}
`;

export const JOIN_CONSORTIUM_MUTATION = gql`
  mutation joinConsortium($consortiumId: ID!) {
    joinConsortium(consortiumId: $consortiumId){
      id
      members
    }
  }
`;

export const LEAVE_CONSORTIUM_MUTATION = gql`
  mutation leaveConsortium($consortiumId: ID!) {
    leaveConsortium(consortiumId: $consortiumId){
      id
      members
    }
  }
`;

export const REMOVE_ALL_COMPUTATIONS_MUTATION = gql`
  mutation removeAllComputations {
    removeAllComputations
  }
`;

export const REMOVE_USER_ROLE_MUTATION = gql`
  mutation removeUserRole($userId: ID!, $table: String!, $doc: String!, $role: String!)
    ${mutations.removeUserRole}
`;

export const SAVE_CONSORTIUM_MUTATION = gql`
  mutation saveConsortium($consortium: ConsortiumInput!)
    ${mutations.saveConsortium}
`;
