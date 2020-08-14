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
        logger.error('Computation schema is not valid');

        validationResult.error.details.forEach((error) => {
          logger.error(`${error.path}: ${error.message}`);
        });

        reject();
        return;
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
        logger.error(get(createdData, 'errors.0.message', 'Failed to upload computation'));
        reject();
        return;
      }

      logger.info('Successfully uploaded computation schema');
      resolve();
    } catch (error) {
      let message = get(error, 'response.data.message');

      if (!message) {
        const { response, data } = error;

        if (!response) {
          message = 'Failed to parse computation schema.';
        } else if (get(data, 'statusCode') === 404) {
          message = 'Network failed.';
        } else {
          message = 'Failed to upload computation schema.';
        }
      }

      logger.error(message);
      reject();
    }
  });
};

module.exports = {
  compspecUpload,
};
