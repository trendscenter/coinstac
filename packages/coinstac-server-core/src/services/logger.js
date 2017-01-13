'use strict';

const mkdirp = require('mkdirp');
const path = require('path');
const touch = require('touch');
const winston = require('winston');

const LOG_FILE = '/var/log/coinstac/application.log';

mkdirp.sync(path.dirname(LOG_FILE));
touch.sync(LOG_FILE);

winston.add(winston.transports.File, {
  filename: LOG_FILE,
  level: 'silly',
});

module.exports = winston;
