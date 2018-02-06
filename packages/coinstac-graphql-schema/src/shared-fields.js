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
  `,
  pipelineFields: `
    id
    delete
    description
    name
    owningConsortium
    shared
    steps {
      id
      computations {
        id
        meta {
          name
          description
          version
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
        }
      }
      controller {
        id
        options
        type
      }
      inputMap
    }
  `,
  runFields: `
    id
    clients
    consortiumId
    startDate
    endDate
    pipelineSnapshot
    userErrors
    globalResults
    results
    userResults
  `,
  userMetadata: `
    id
    email
    institution
    passwordHash
    permissions
    consortiaStatuses
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
};

module.exports = sharedFields;
