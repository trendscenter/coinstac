/**
 * GraphQL schema fields that can be used by multiple queries or mutations
 */

const sharedFields = {
  computationMetadata: `
    id
    computation {
      dockerImage
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
  userMetadata: `
    id
    email
    institution
    passwordHash
    permissions
    consortiaStatuses
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
      }
      controller {
        id
        options
      }
      ioMap
    }
  `,
};

module.exports = sharedFields;
