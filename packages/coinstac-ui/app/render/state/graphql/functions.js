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

export const fetchAllComputationsMetadataFunc = gql`
  query FetchAllComputationsMetadataQuery
    ${queries.fetchAllComputationsMetadata}
`;

export const fetchAllConsortiaFunc = gql`
  query FetchAllConsortiaQuery
    ${queries.fetchAllConsortia}
`;

export const fetchAllPipelinesFunc = gql`
  query FetchAllPipelinesQuery
    ${queries.fetchAllPipelines}
`;

export const savePipelineFunc = gql`
  mutation SavePipelineMutation($pipeline: PipelineInput!)
    ${mutations.savePipeline}
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

export const saveActivePipelineFunc = gql`
  mutation SaveActivePipelineMutation($consortiumId: ID, $activePipeline: ID){
    saveActivePipeline(consortiumId: $consortiumId, activePipeline: $activePipeline)
  }
`
