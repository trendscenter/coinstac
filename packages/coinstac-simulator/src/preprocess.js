/* eslint-disable camelcase */
const axios = require('axios');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
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


function createInputSpec(baseInputSpec, csvPath) {
  const inputSpec = baseInputSpec;
  Object.keys(inputSpec).forEach((key) => {
    if (inputSpec[key].source === 'owner') {
      inputSpec[key] = { value: inputSpec[key].default };
    }
  });
  inputSpec.data = {
    value: [{
      type: 'NiFTI', value: brainRegionKeys,
    }],
  };
  inputSpec.covariates = { value: {} };
  const records = parse(fs.readFileSync(csvPath));
  const headers = records[0];
  for (let i = 1; i < records.length; i++) {
    const record = records[i];
    const covariate = {};
    for (let j = 1; j < headers.length; j++) {
      covariate[headers[j]] = record[j];
    }
    inputSpec.covariates.value[records[i][0]] = covariate;
  }
  return inputSpec;
}

module.exports = { fetchPreprocessComputations, createInputSpec };

