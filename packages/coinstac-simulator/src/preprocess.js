/* eslint-disable camelcase */
const axios = require('axios');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const winston = require('winston');
const { freesurferRegions } = require('coinstac-common');
const config = require('./config');

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.cli() }),
  ],
});

axios.defaults.baseURL = `${config.protocol}://${config.apiServer}:${config.port}${config.path}`;

const query = 'query fetchAllComputations($preprocess: Boolean) {fetchAllComputations(preprocess: $preprocess) {id, computation {type, dockerImage, command, input}, meta {  id,name,preprocess }}}';

async function getIdToken(username, password) {
  try {
    const { data } = await axios.post('/authenticate', { username, password });
    return data.id_token;
  } catch (error) {
    logger.error('Error connecting to API');
    if (error.response && error.response.status && error.response.status === 401) {
      logger.error('Unauthorized: Check username and password.');
    }
    throw error;
  }
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
  try {
    const response = await axios.post('/graphql', payload, { headers });
    return response.data.data.fetchAllComputations;
  } catch (error) {
    logger.error('Error connecting to API');
    throw error;
  }
}

async function fetchPreprocessComputations(username, password) {
  const id_token = await getIdToken(username, password);
  const computations = await fetchComputations(id_token);
  return computations;
}

function createInputMap(baseInputSpec, csvPath) {
  const inputMap = JSON.parse(JSON.stringify(baseInputSpec));
  Object.keys(inputMap).forEach((key) => {
    if (inputMap[key].source === 'owner') {
      inputMap[key] = { value: inputMap[key].default };
    }
  });
  inputMap.data = {
    value: [{
      type: 'NiFTI', value: freesurferRegions,
    }],
  };
  inputMap.covariates = { value: {} };
  const records = parse(fs.readFileSync(csvPath));
  const headers = records[0];
  for (let i = 1; i < records.length; i += 1) {
    const record = records[i];
    const covariate = {};
    for (let j = 1; j < headers.length; j += 1) {
      covariate[headers[j]] = record[j];
    }
    inputMap.covariates.value[records[i][0]] = covariate;
  }
  return inputMap;
}

async function prepareDirectory(pipelineSpec, baseDir) {
  await fs.promises.mkdir(path.resolve(baseDir, 'input/local0/simulatorRun'), { recursive: true });
  return Promise.all(Object.keys(pipelineSpec.steps[0].inputMap.covariates.value)
    .map((filename) => {
      return fs.promises.link(filename, path.join(baseDir, `input/local0/simulatorRun/${filename}`));
    }));
}

module.exports = { fetchPreprocessComputations, createInputMap, prepareDirectory };
