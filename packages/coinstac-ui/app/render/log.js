'use strict';

const os = require('os');
const path = require('path');
const readLastLines = require('read-last-lines');
const { Tail } = require('tail');
const serializeError = require('serialize-error');
const pify = require('util').promisify;
const access = pify(require('fs').access);
const loadConfig = require('../config.js');

const outputEl = typeof document !== 'undefined'
  ? document.getElementById('output')
  : undefined;

function maybeAddOutput(output, logName, className) {
  if (outputEl) {
    const code = document.createElement('code');
    code.className = className;
    code.innerHTML = output;
    outputEl.appendChild(code);
    // http://stackoverflow.com/a/270628
    outputEl.scrollTop = outputEl.scrollHeight;
  }
}

function getDataLogger(logName, className) {
  return function dataLogger(data) {
    console.log(data); // eslint-disable-line no-console
    maybeAddOutput(data, logName, className);
  };
}

function getErrorLogger(logName, className) {
  return function errorLogger(error) {
    console.error(error); // eslint-disable-line no-console
    maybeAddOutput(
      JSON.stringify(serializeError(error), null, 2).replace(/\\n/g, '\n'),
      logName,
      `error ${className}`
    );
  };
}

loadConfig()
  .then((config) => {
    const base = config.get('logLocations')[os.platform()];
    const targets = [{
      className: 'standard-log',
      filename: path.join(base, config.get('logFile')),
      name: 'Log',
    }, {
      className: 'boot-log',
      filename: path.join(base, config.get('logFileBoot')),
      name: 'Boot log',
    }];

    /* eslint-disable no-console */
    console.log(
      `Reading logs: ${targets.map(({ filename }) => filename).toString()}`
    );
    /* eslint-enable no-console */

    return Promise.all(targets.map(target => access(target.filename).then(
      () => Object.assign({}, target, { exists: true }),
      () => Object.assign({}, target, { exists: false })
    )));
  })
  .then(targets => Promise.all(targets.reduce((memo, target) => (
    target.exists
      ? memo.concat(
        readLastLines.read(target.filename, 50)
          .then(lines => Object.assign({}, target, { lines }))
      )
      : memo
  ), [])))
  .then(targets => targets.forEach((target) => {
    const dataLogger = getDataLogger(target.name, target.className);
    const errorLogger = getErrorLogger(target.name, target.className);

    dataLogger(target.lines);

    const tail = new Tail(target.filename, {
      follow: true,
      logger: console,
    });

    tail.on('line', dataLogger);
    tail.on('error', errorLogger);
  }))
  .catch(getErrorLogger());
