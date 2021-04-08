const axios = require('axios');

async function authenticate() {
  const response = await axios.post(`${process.env.API_URL}/authenticateWithApiKey`, {
    apiKey: process.env.API_KEY,
    name: process.env.HEADLESS_CLIENT_NAME,
  });

  return response.data;
}

module.exports = authenticate;
