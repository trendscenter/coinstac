/**
 * GraphQL schema fields that can be used by multiple queries or mutations
 */
 const computationMetadata = `
 id
 computation {
   dockerImage
   remote {
     type
     dockerImage
     command
   }
   input
   output
   display
 }
 meta {
  repository
  description
  name
  id
  tags
  version
  compspecVersion
  controller
  preprocess
  testData
 }
 delete
 submittedBy
`
const sharedFields = {
  computationMetadata: computationMetadata,
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
      computations {${computationMetadata}}
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
