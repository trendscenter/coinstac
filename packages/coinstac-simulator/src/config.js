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

if (process.env.API_SERVER_HOSTNAME) {
  config = Object.assign(config,
    {
      protocol: 'http',
      apiServer: process.env.API_SERVER_HOSTNAME,
      port: process.env.API_SERVER_PORT,
    });
} else {
  config = Object.assign(config,
    {
      protocol: 'https',
      apiServer: 'coinstac.rs.gsu.edu',
      port: '443',
    });
}
module.exports = config;
