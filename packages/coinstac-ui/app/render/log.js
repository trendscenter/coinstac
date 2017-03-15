'use strict';

const loadConfig = require('../config.js');
const os = require('os');
const path = require('path');
const readLastLines = require('read-last-lines');
const { Tail } = require('tail');

function maybeAddOutput(output, className) {
  if (typeof document !== 'undefined') {
    const outputEl = document.getElementById('output');
    const code = document.createElement('code');
    code.className = className;
    code.innerHTML = output;
    outputEl.appendChild(code);
    // http://stackoverflow.com/a/270628
    outputEl.scrollTop = outputEl.scrollHeight;
  }
}

function logData(data) {
  console.log(data); // eslint-disable-line no-console
  maybeAddOutput(data);
}

function logError(error) {
  console.error(error); // eslint-disable-line no-console
  maybeAddOutput(error.message, 'error');
}

loadConfig()
  .then((config) => {
    const target = path.join(
      os.homedir(),
      config.get('logLocations')[os.platform()],
      config.get('logFile')
    );

    console.log(`Reading log: ${target}`); // eslint-disable-line no-console

    return Promise.all([target, readLastLines.read(target, 50)]);
  })
  .then(([target, lines]) => {
    logData(lines);

    const tail = new Tail(target, {
      follow: true,
      logger: console,
    });

    tail.on('line', logData);
    tail.on('error', logError);
  })
  .catch(logError);

