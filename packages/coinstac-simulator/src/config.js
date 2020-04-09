const operationName = 'addComputation';
const query = `mutation addComputation($computationSchema: ComputationInput!) {
  addComputation(computationSchema: $computationSchema) {
    id
  }
}
`;

module.exports = {
  apiServer: 'localhost',
  port: '3100',
  graphql: {
    query,
    operationName,
  },
};
