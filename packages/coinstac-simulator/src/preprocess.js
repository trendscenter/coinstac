/* eslint-disable camelcase */
const axios = require('axios');
const config = require('./config');

axios.defaults.baseURL = `${config.protocol}://${config.apiServer}:${config.port}`;

const query = 'query fetchAllComputations($preprocess: Boolean) {fetchAllComputations(preprocess: $preprocess) {id, computation {dockerImage, input}, meta {  id,name,preprocess }}}';

async function getIdToken(username, password) {
  const { data } = await axios.post('/authenticate', { username, password });
  return data.id_token;
}

async function fetchComputations(id_token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${id_token}`,
  };

  const payload = {
    operationName: 'fetchAllComputations',
    query,
    variables: {
      preprocess: true,
    },
  };
  const response = await axios.post('/graphql', payload, { headers });
  return response.data.data.fetchAllComputations;
}

async function fetchPreprocessComputations(username, password) {
  const id_token = await getIdToken(username, password);
  const computations = await fetchComputations(id_token);
  return computations;
}


module.exports = { fetchPreprocessComputations };
