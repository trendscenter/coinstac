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
      input
    }
    meta {
      name
      description
      version
      id
      compspecVersion
      preprocess
      repository
      testData
    }
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
    activeMembers
    isPrivate
    isJoinByRequest
    joinRequests
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
          compspecVersion
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
      controller
      inputMap
      dataMeta
    }
    headlessMembers
  `,
  runFields: `
    id
    clients
    observers
    consortiumId
    startDate
    endDate
    pipelineSnapshot
    remotePipelineState
    error
    results
    type
    sharedUsers
    status
    delete
    shouldUploadAssets
    assetsUploaded
  `,
  userMetadata: `
    id
    email
    institution
    username
    permissions
    photo
    photoID
    name
    consortiaStatuses
  `,
  userData: `
    id
    email
    permissions
    username
    photo
    photoID
    delete
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
    users
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
  headlessClientFields: `
    id
    name
    owners
    computationWhitelist
    hasApiKey
    delete
  `,
  datasetFields: `
    id
    datasetDescription
    participantsDescription
    otherInfo
    owner
  `,
};

module.exports = sharedFields;
