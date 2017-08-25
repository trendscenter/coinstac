import {
  gql,
} from 'react-apollo';

export const addComputationMetadata = gql`
  mutation AddJsonSchema($computationSchema: ComputationInput!) {
    addComputation(computationSchema: $computationSchema)
  }
`;

export const fetchComputationMetadata = gql`
  query ComputationMetadataQuery {
    fetchAllComputations {
      id
      meta {
        name
        description
        version
        dockerImage
      }
    }
  }
`;

export const fetchComputationLocalIO = gql`
  query ComputationInput ($computationName: String!) {
    fetchComputationMetadataByName (computationName: $computationName) {
      id
      local {
        input {
          freeSurferRegion {
            type
            defaultValue
            help
            label
            items
          }
          lambda {
            defaultValue
            label
            max
            min
            step
            type
          }
          iterationCount {
            defaultValue
            label
            type
          }
          covariates {
            label
            type
            items
          }
        }
        output {
          betaVector {
            type
            label
            items
          }
          localCount {
            type
            label
            items
          }
          localMeanY {
            type
            label
          }
          rSquared {
            type
            label
          }
          tValue {
            type
            label
          }
          pValue {
            type
            label
          }
          biasedX {
            type
            label
          }
          y {
            type
            label
          }
        }
      }
    }
  }
`;