'use strict';

const loadConfig = require('../config.js');
const os = require('os');
const path = require('path');
const readLastLines = require('read-last-lines');
const { Tail } = require('tail');
const bluebird = require('bluebird');
const access = bluebird.promisify(require('fs').access);


const fileExists = (fPath) => {
  return access(fPath).then(
    () => ({ target: fPath, exists: true }),
    () => ({ target: fPath, exists: false })
  );
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

    return Promise.all(targets.map(target => fileExists(target)))
    .then((targetInfo) =>
      Promise.all(
        targetInfo.reduce((memo, target) => {
          return target.exists ?
            memo.concat(readLastLines.read(target.target, 50)
              .then(lines => ({ target: target.target, lines }))) :
            memo;
        }, [])
      )
    );
  })
  .then((reads) => {
    reads.forEach((read) => {
      logData(read.lines);
      const tail = new Tail(read.target, {
        follow: true,
        logger: console,
      });

      tail.on('line', logData);
      tail.on('error', logError);
    });
  })
  .catch(logError);

