/* eslint-disable camelcase */
const axios = require('axios');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const winston = require('winston');
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

async function fetchComputations() {
  const headers = {
    'Content-Type': 'application/json',
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
    if (response.data?.errors?.[0]) {
      throw response.data.errors[0].message;
    }
    return response.data.data.fetchAllComputations;
  } catch (error) {
    logger.error('Error connecting to API');
    logger.error(error);
    throw error;
  }
}

async function fetchPreprocessComputations() {
  const computations = await fetchComputations();
  return computations;
}

const brainRegionKeys = [
  '3rd-Ventricle',
  '4th-Ventricle',
  '5th-Ventricle',
  'Brain-Stem',
  'BrainSegVol',
  'BrainSegVol-to-eTIV',
  'BrainSegVolNotVent',
  'BrainSegVolNotVentSurf',
  'CC_Anterior',
  'CC_Central',
  'CC_Mid_Anterior',
  'CC_Mid_Posterior',
  'CC_Posterior',
  'CortexVol',
  'CorticalWhiteMatterVol',
  'CSF',
  'EstimatedTotalIntraCranialVol',
  'Left-Accumbens-area',
  'Left-Amygdala',
  'Left-Caudate',
  'Left-Cerebellum-Cortex',
  'Left-Cerebellum-White-Matter',
  'Left-choroid-plexus',
  'Left-Hippocampus',
  'Left-Inf-Lat-Vent',
  'Left-Lateral-Ventricle',
  'Left-non-WM-hypointensities',
  'Left-Pallidum',
  'Left-Putamen',
  'Left-Thalamus-Proper',
  'Left-VentralDC',
  'Left-vessel',
  'Left-WM-hypointensities',
  'lhCortexVol',
  'lhCorticalWhiteMatterVol',
  'lhSurfaceHoles',
  'MaskVol',
  'MaskVol-to-eTIV',
  'non-WM-hypointensities',
  'Optic-Chiasm',
  'rhCortexVol',
  'rhCorticalWhiteMatterVol',
  'rhSurfaceHoles',
  'Right-Accumbens-area',
  'Right-Amygdala',
  'Right-Caudate',
  'Right-Cerebellum-Cortex',
  'Right-Cerebellum-White-Matter',
  'Right-choroid-plexus',
  'Right-Hippocampus',
  'Right-Inf-Lat-Vent',
  'Right-Lateral-Ventricle',
  'Right-non-WM-hypointensities',
  'Right-Pallidum',
  'Right-Putamen',
  'Right-Thalamus-Proper',
  'Right-VentralDC',
  'Right-vessel',
  'Right-WM-hypointensities',
  'SubCortGrayVol',
  'SupraTentorialVol',
  'SupraTentorialVolNotVent',
  'SupraTentorialVolNotVentVox',
  'SurfaceHoles',
  'TotalGrayVol',
  'WM-hypointensities',
];


function createInputMap(baseInputSpec, csvPath) {
  const inputMap = JSON.parse(JSON.stringify(baseInputSpec));
  Object.keys(inputMap).forEach((key) => {
    if (inputMap[key].source === 'owner') {
      inputMap[key] = { value: inputMap[key].default };
    }
  });
  inputMap.data = {
    value: [{
      type: 'NiFTI', value: brainRegionKeys,
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
      return fs.promises.mkdir(path.join(baseDir, 'input/local0/simulatorRun/', path.dirname(filename)), { recursive: true })
        .then(() => {
          return fs.promises.link(filename, path.join(baseDir, `input/local0/simulatorRun/${filename}`));
        });
    }));
}

module.exports = { fetchPreprocessComputations, createInputMap, prepareDirectory };
