/* eslint-disable camelcase */
const axios = require('axios');
const config = require('./config');

axios.defaults.baseURL = `${config.protocol}://${config.apiServer}:${config.port}`;

const query = 'query fetchAllComputations($preprocess: Boolean) {fetchAllComputations(preprocess: $preprocess) {id, meta {  id,name,preprocess }}}';

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
  return axios.post('/graphql', payload, { headers });
}

async function fetchPreprocessComputations(username, password) {
  const id_token = await getIdToken(username, password);
  const { data } = await fetchComputations(id_token);
  return data;
}

module.exports = fetchPreprocessComputations;
