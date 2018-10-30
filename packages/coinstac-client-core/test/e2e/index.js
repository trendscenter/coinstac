'use strict';

const { fork } = require('child_process');
const os = require('os');
const path = require('path');
const winston = require('winston');

const CONSORTIUM_ID = 'test';
const usernames = ['charmander', 'pikachu'];
const kids = [];

process.on('exit', () => kids.forEach(kid => kid && kid.kill()));

function getLogger(pid, level = 'info') {
  return function logger(data) {
    winston.log(level, `[${pid}]: ${data.toString()}`);
  };
}

function getChild() {
  return new Promise((resolve, reject) => {
    const child = fork(
      path.join(__dirname, 'client.js'), {
        silent: true,
      }
    );
    const logger = getLogger(child.pid);
    const errorLogger = getLogger(child.pid, 'error');

    function errorHandler(error) {
      errorLogger(error);
      reject(error);
    }

    child.stderr.on('data', errorLogger);
    child.stdout.on('data', logger);
    child.on('close', (code) => {
      if (code) {
        errorLogger(`Exited with code ${code}`);
      } else {
        logger('Exited');
      }
    });
    child.on('error', errorHandler);

    child.on('message', (m) => {
      if (m.response === 'READY') {
        child.removeListener('error', errorHandler);
        resolve(child);
      }
    });

    child.send({
      command: 'READY',
    });
  });
}

function startChild(
  child,
  {
    consortiumId, files, initiate, metaFilePath, username,
  }
) {
  return new Promise((resolve) => {
    child.on('message', (m) => {
      if (m.response === 'START') {
        resolve(child);
      }
    });

    child.send({
      command: 'START',
      data: {
        consortiumId,
        files,
        initiate,
        metaFilePath,
        username,
      },
    });
  });
}

Promise.all(usernames.map(getChild))
  .then((children) => {
    children.forEach(kid => kids.push(kid));

    return Promise.all(children.map((child, index) => startChild(child, {
      consortiumId: CONSORTIUM_ID,
      files: path.join(
        os.homedir(),
        `/Downloads/thalamus-analysis/{controls,patients}-${index}/*.txt`
      ),
      initiate: index === 0,
      metaFilePath: path.join(
        os.homedir(),
        `/Downloads/thalamus-analysis/manifest-${index}.csv`
      ),
      username: usernames[index],
    })));
  })
  .catch(winston.error);
