'use strict';

require('./utils/boot');
const fail = (err) => {
  console.error(err); // eslint-disable-line
  console.error(err.stack); // eslint-disable-line
  process.exit(1);
};

process.on('uncaughtExpection', fail);
process.on('unhandledRejection', fail);

require('./model-service');
require('./sub-api/authentication-service.js');
require('./sub-api/computation-service');
require('./sub-api/consortia-service');
require('./sub-api/project-service');
require('./coinstac-client');
