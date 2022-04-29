// const config = {
//   protocol: 'https',
//   apiServer: 'coinstac.rs.gsu.edu',
//   port: '443',
//   path: '/api',
// };

const config = {
  protocol: 'http',
  apiServer: process.env.API_SERVER_HOSTNAME,
  port: process.env.API_SERVER_PORT,
  path: '',
};

module.exports = config;
