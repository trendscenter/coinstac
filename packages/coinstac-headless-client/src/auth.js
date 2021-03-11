const axios = require('axios');

async function authenticate(config) {
  const { apiServer } = config;
  const API_URL = `${apiServer.protocol}//${apiServer.hostname}${apiServer.port ? `:${apiServer.port}` : ''}${apiServer.pathname}`;

  const response = await axios.post(`${API_URL}/authenticate`, {
    username: process.env.SERVER_API_USERNAME,
    password: process.env.SERVER_API_PASSWORD,
  });

  return response.data;
}

module.exports = authenticate;
