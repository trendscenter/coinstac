const operationName = 'addComputation';
const query = `mutation addComputation($computationSchema: ComputationInput!) {
  addComputation(computationSchema: $computationSchema) {
    id
  }
}
`;
let config = {
  graphql: {
    query,
    operationName,
  },
};

if(process.env.NODE_ENV === 'DEVELOPMENT') {
  config = Object.assign(config,
    {
      protocol: 'http',
      apiServer: 'localhost',
      port: '3100',
    });
} else {
  config = Object.assign(config,
    {
      protocol: 'https',
      apiServer: 'coinstac.rs.gsu.edu',
      port: '443',
    });
}
module.exports = {

};
