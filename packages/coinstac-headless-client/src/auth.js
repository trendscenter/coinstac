const axios = require('axios');

async function authenticate(apiKey, name) {
  const response = await axios.post(`${process.env.API_URL}/authenticateWithApiKey`, {
    apiKey,
    name,
  });

  return response.data;
}

module.exports = authenticate;
