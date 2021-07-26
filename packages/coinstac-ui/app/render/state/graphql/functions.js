import { gql } from '@apollo/client';
import { mutations, queries } from 'coinstac-graphql-schema';

export const ADD_COMPUTATION_MUTATION = gql`
  mutation addComputation($computationSchema: ComputationInput!) 
    ${mutations.addComputation}
`;

export const ADD_USER_ROLE_MUTATION = gql`
  mutation addUserRole($userId: ID!, $table: String!, $doc: String!, $role: String!, $roleType: String!)
    ${mutations.addUserRole}
`;

export const COMPUTATION_CHANGED_SUBSCRIPTION = gql`
  subscription computationChanged($computationId: ID)
    ${queries.computationChanged}
`;

export const CONSORTIUM_CHANGED_SUBSCRIPTION = gql`
  subscription consortiumChanged($consortiumId: ID)
    ${queries.consortiumChanged}
`;

export const CONSORTIUM_PIPELINE_CHANGED_SUBSCRIPTION = gql`
  subscription consortiumPipelineChanged
    ${queries.consortiumPipelineChanged}
`;

export const THREAD_CHANGED_SUBSCRIPTION = gql`
  subscription threadChanged($threadId: ID)
    ${queries.threadChanged}
`;

export const CREATE_RUN_MUTATION = gql`
  mutation createRun($consortiumId: ID!)
    ${mutations.createRun}
`;

export const DELETE_CONSORTIUM_MUTATION = gql`
  mutation deleteConsortiumById($consortiumId: ID!) {
    deleteConsortiumById(consortiumId: $consortiumId){
      id
    }
  }
`;

export const DELETE_PIPELINE_MUTATION = gql`
  mutation deletePipeline($pipelineId: ID!) {
    deletePipeline(pipelineId: $pipelineId){
      id
    }
  }
`;

export const FETCH_ALL_PIPELINES_QUERY = gql`
  query fetchAllPipelines
    ${queries.fetchAllPipelines}
`;

export const FETCH_ALL_COMPUTATIONS_QUERY = gql`
  query fetchAllComputations
    ${queries.fetchAllComputations}
`;

export const FETCH_ALL_CONSORTIA_QUERY = gql`
  query fetchAllConsortia
    ${queries.fetchAllConsortia}
`;

export const FETCH_ALL_USER_RUNS_QUERY = gql`
  query fetchAllUserRuns
    ${queries.fetchAllUserRuns}
`;

export const FETCH_CONSORTIUM_QUERY = gql`
  query fetchConsortium ($consortiumId: ID)
    ${queries.fetchConsortium}
`;

export const FETCH_COMPUTATION_QUERY = gql`
  query fetchComputation ($computationIds: [ID])
    ${queries.fetchComputation}
`;

export const FETCH_PIPELINE_QUERY = gql`
  query fetchPipeline ($pipelineId: ID)
    ${queries.fetchPipeline}
`;

export const FETCH_USER_QUERY = gql`
  query fetchUser ($userId: ID)
    ${queries.fetchUser}
`;

export const FETCH_ALL_RESULTS_QUERY = gql`
  query fetchAllResults
    ${queries.fetchAllResults}
`;

export const FETCH_ALL_USERS_QUERY = gql`
  query fetchAllUsers
    ${queries.fetchAllUsers}
`;

export const FETCH_RESULT_QUERY = gql`
  query fetchResult ($resultId: ID)
    ${queries.fetchResult}
`;

export const FETCH_ALL_THREADS_QUERY = gql`
  query fetchAllThreads
    ${queries.fetchAllThreads}
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

export const RESULT_CHANGED_SUBSCRIPTION = gql`
  subscription resultChanged($resultId: ID)
    ${queries.resultChanged}
`;

export const PIPELINE_CHANGED_SUBSCRIPTION = gql`
  subscription pipelineChanged($pipelineId: ID)
    ${queries.pipelineChanged}
`;

export const REMOVE_COMPUTATION_MUTATION = gql`
  mutation removeComputation($computationId: ID!) {
    removeComputation(computationId: $computationId){
      id
    }
  }
`;

export const USER_CHANGED_SUBSCRIPTION = gql`
  subscription userChanged($userId: ID)
    ${queries.userChanged}
`;

export const REMOVE_USER_ROLE_MUTATION = gql`
  mutation removeUserRole($userId: ID!, $table: String!, $doc: String!, $role: String!, $roleType: String!)
    ${mutations.removeUserRole}
`;

export const USER_RUN_CHANGED_SUBSCRIPTION = gql`
  subscription userRunChanged($userId: ID)
    ${queries.userRunChanged}
`;

export const SAVE_ACTIVE_PIPELINE_MUTATION = gql`
  mutation saveActivePipeline($consortiumId: ID, $activePipelineId: ID){
    saveActivePipeline(consortiumId: $consortiumId, activePipelineId: $activePipelineId)
  }
`;

export const SAVE_CONSORTIUM_MUTATION = gql`
  mutation saveConsortium($consortium: ConsortiumInput!)
    ${mutations.saveConsortium}
`;

export const SAVE_PIPELINE_MUTATION = gql`
  mutation savePipeline($pipeline: PipelineInput!)
    ${mutations.savePipeline}
`;

export const UPDATE_USER_CONSORTIUM_STATUS_MUTATION = gql`
  mutation updateUserConsortiumStatus($consortiumId: ID, $status: String)
    ${mutations.updateUserConsortiumStatus}
`;

export const UPDATE_CONSORTIUM_MAPPED_USERS_MUTATION = gql`
  mutation updateConsortiumMappedUsers($consortiumId: ID, $isMapped: Boolean)
    ${mutations.updateConsortiumMappedUsers}
`;

export const UPDATE_CONSORTIA_MAPPED_USERS_MUTATION = gql`
  mutation updateConsortiaMappedUsers($consortia: [ID], $isMapped: Boolean)
    ${mutations.updateConsortiaMappedUsers}
`;

export const UPDATE_PASSWORD_MUTATION = gql`
  mutation updatePassword($currentPassword: String!, $newPassword: String!)
    ${mutations.updatePassword}
`;

export const SAVE_MESSAGE_MUTATION = gql`
  mutation saveMessage($threadId: ID, $title: String!, $recipients: JSON, $content: String!, $action: ActionInput)
    ${mutations.saveMessage}
`;

export const SET_READ_MESSAGE_MUTATION = gql`
  mutation setReadMessage($threadId: ID!, $userId: ID!)
    ${mutations.setReadMessage}
`;

export const FETCH_USERS_ONLINE_STATUS = gql`
  query fetchUsersOnlineStatus {
    fetchUsersOnlineStatus
  }
`;

export const USERS_ONLINE_STATUS_CHANGED_SUBSCRIPTION = gql`
  subscription usersOnlineStatusChanged {
    usersOnlineStatusChanged
  }
`;

export const CREATE_ISSUE_MUTATION = gql`
  mutation createIssue($issue: IssueInput!)
    ${mutations.createIssue}
`;

export const FETCH_ALL_HEADLESS_CLIENTS = gql`
  query fetchAllHeadlessClients
    ${queries.fetchAllHeadlessClients}
`;

export const FETCH_HEADLESS_CLIENT = gql`
  query fetchHeadlessClient($id: ID!)
    ${queries.fetchHeadlessClient}
`;

export const HEADLESS_CLIENT_CHANGED_SUBSCRIPTION = gql`
  subscription headlessClientChanged
    ${queries.headlessClientChanged}
`;

export const CREATE_HEADLESS_CLIENT_MUTATION = gql`
  mutation createHeadlessClient($data: HeadlessClientInput!)
    ${mutations.createHeadlessClient}
`;

export const UPDATE_HEADLESS_CLIENT_MUTATION = gql`
  mutation updateHeadlessClient($id: ID!, $data: HeadlessClientInput!)
    ${mutations.updateHeadlessClient}
`;

export const DELETE_HEADLESS_CLIENT_MUTATION = gql`
  mutation deleteHeadlessClient($headlessClientId: ID!) {
    deleteHeadlessClient(headlessClientId: $headlessClientId){
      id
    }
  }
`;

export const GENERATE_HEADLESS_CLIENT_API_KEY_MUTATION = gql`
  mutation generateHeadlessClientApiKey($headlessClientId: ID)
    ${mutations.generateHeadlessClientApiKey}
`;
