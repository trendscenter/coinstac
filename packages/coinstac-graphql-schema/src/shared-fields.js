/**
 * GraphQL schema fields that can be used by multiple queries or mutations
 */

const sharedFields = {
  computationMetadata: `
    id
    computation {
      dockerImage
      remote {
        type
        dockerImage
        command
      }
    }
    meta {
      name
      description
      version
      id
    }
    delete
    submittedBy
  `,
  consortiaFields: `
    id
    activePipelineId
    activeComputationInputs
    delete
    description
    name
    tags
    members
    owners
    isPrivate
    mappedForRun
    createDate
  `,
  pipelineFields: `
    id
    delete
    description
    name
    owner
    owningConsortium
    shared
    timeout
    limitOutputToOwner
    steps {
      id
      computations {
        id
        meta {
          name
          description
          version
          id
        }
        computation {
          type
          dockerImage
          command
          remote {
            type
            dockerImage
            command
          }
          input
          output
          display
        }
      }
      controller {
        id
        options
        type
      }
      inputMap
      dataMeta
    }
  `,
  runFields: `
    id
    clients
    consortiumId
    startDate
    endDate
    pipelineSnapshot
    remotePipelineState
    error
    results
    type
    sharedUsers
  `,
  userMetadata: `
    id
    email
    institution
    permissions
    consortiaStatuses
  `,
  userEmailIds: `
    id
    email
  `,
  resultFields: `
    id
    title
    pipelineId
    date
    results
  `,
  resultsFields: `
    runId
    results
  `,
  threadFields: `
    id
    owner
    title
    users {
      username
      isRead
    }
    date
    messages {
      id
      content
      sender
      recipients
      date
      action {
        type
        detail
      }
    }
  `,
};

module.exports = sharedFields;
