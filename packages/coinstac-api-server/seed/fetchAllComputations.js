const axios = require('axios');
const config = require('./config');

axios.defaults.baseURL = `${config.protocol}://${config.apiServer}:${config.port}${config.path}`;

const query = 'query fetchAllComputations($preprocess: Boolean) {fetchAllComputations(preprocess: $preprocess) {id, computation {type, dockerImage, command, input}, meta {  id,name,preprocess }}}';

async function fetchAllComputations() {
  const headers = {
    'Content-Type': 'application/json',
  };

  const payload = {
    operationName: 'fetchAllComputations',
    query,
  };
  const response = await axios.post('/graphql', payload, { headers });
  const computations = response.data.data.fetchAllComputations;

  // delete existing ids
  return computations.map((computation) => {
    delete computation.id;
    return computation;
  });
}

module.exports = (fetchAllComputations);
