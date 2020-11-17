'use strict';

const axios = require('axios');
const fs = require('fs');
const { get } = require('lodash');
const { services } = require('coinstac-common');

const config = require('./config');

axios.defaults.baseURL = `${config.protocol}://${config.apiServer}:${config.port}`;

const compspecUpload = (username, password, logger) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.post('/authenticate', { username, password });

      const json = JSON.parse(fs.readFileSync('./compspec.json'));
      const validationResult = services.validator.validate(json, 'computation');
      if (validationResult.error) {
        let err = 'Computation schema is not valid:';
        validationResult.error.details.forEach((error) => {
          err += ` ${error.path}: ${error.message}\n`;
        });

        throw new Error(err);
      }

      const payload = JSON.stringify({
        operationName: config.graphql.operationName,
        query: config.graphql.query,
        variables: {
          computationSchema: json,
        },
      });

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.id_token}`,
      };

      const { data: createdData } = await axios.post('/graphql', payload, { headers });

      if (createdData.errors) {
        throw new Error(get(createdData, 'errors.0.message', 'Failed to upload computation'));
      }

      logger.info('Successfully uploaded computation schema');
      resolve();
    } catch (error) {
      let message;
      if (error.message && error.message.includes('JSON')) return reject(new Error(`Compspec JSON parsing failed\n ${error.message}`));
      const code = error.code || (error.response ? error.response.status : '');
      switch (code) {
        case 401:
          message = get(error, 'response.data.message');
          break;
        case 403:
          message = get(error, 'response.data.message');
          break;
        case 'ENOTFOUND':
          message = 'Could not contact coinstac servers';
          break;
        case 'ECONNREFUSED':
          message = 'Could not contact coinstac servers';
          break;
        default:
          message = error.message || error;
      }
      reject(new Error(message));
    }
  });
};

module.exports = {
  compspecUpload,
};
