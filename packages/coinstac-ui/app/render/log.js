'use strict';

const loadConfig = require('../config.js');
const os = require('os');
const path = require('path');
const readLastLines = require('read-last-lines');
const { Tail } = require('tail');
const bluebird = require('bluebird');
const access = bluebird.promisify(require('fs').access);


const fileExists = (fPath) => {
  return access(fPath).then(() => [fPath, true], () => [fPath, false]);
};

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
    const targets = [
      path.join(
      process.env.HOME || process.env.TEMP,
      config.get('logLocations')[os.platform()],
      config.get('logFile')),
      path.join(
      process.env.HOME || process.env.TEMP,
      config.get('logLocations')[os.platform()],
      config.get('logFileBoot')),
    ];

    console.log(`Reading log: ${targets.toString()}`); // eslint-disable-line no-console

    // return Promise.all([targets.reduce((memo, target) => {
    //   if (fileExists(target)) {
    //     memo.push(target);
    //   }
    //   return memo;
    // }, [])])
    Promise.all([targets.map(target =>)])
    .then((existingTargets) => {
      debugger;
      Promise.all([
        existingTargets,
        ...existingTargets.map((target) => readLastLines.read(target, 50)),
      ]);
    });
  })
  .then((res) => {
    debugger;
    logData(lines);

    const tail = new Tail(target, {
      follow: true,
      logger: console,
    });

    tail.on('line', logData);
    tail.on('error', logError);
  })
  .catch(logError);

