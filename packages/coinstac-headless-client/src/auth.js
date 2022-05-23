const axios = require('axios');

async function authenticate(apiKey, headlessClientId) {
  const response = await axios.post(`${process.env.API_URL}/authenticateWithApiKey`, {
    apiKey,
    id: headlessClientId,
  });

  return response.data;
}

module.exports = authenticate;
