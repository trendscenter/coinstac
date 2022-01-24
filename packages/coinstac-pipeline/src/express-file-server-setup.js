const express = require('express');
const multer = require('multer');
const path = require('path');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const fs = require('fs');
const pify = require('util').promisify;
const rmrf = pify(require('rimraf'));
const { extractTar } = require('./pipeline-manager-helpers');

const {
  unlink,
} = fs.promises;

async function expressFileServerSetup({
  activePipelines,
  remoteClients,
  waitingOnForRun,
  logger,
  clearClientFileList,
  printClientTimeProfiling,
  clientPublish,
  remotePort,
}) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fp = path.join(activePipelines[req.body.runId].baseDirectory, req.body.clientId);
      mkdirp(fp)
        .then(() => {
          cb(
            null,
            fp
          );
        });
    },
    filename: (req, file, cb) => {
      cb(null, req.body.filename);
    },
  });

  const upload = multer({ storage });
  const app = express();
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb' }));

  app.post('/transfer', upload.single('file'), (req, res) => {
    const received = Date.now();
    res.end();
    const { clientId, runId } = req.body;
    const client = remoteClients[clientId][runId];


    Promise.resolve().then(() => {
      // is this file the last?
      if (client.files.expected.length !== 0
        && client.files.expected
          .every(e => [req.body.filename, ...client.files.received].includes(e))) {
        remoteClients[clientId][runId].debug.received = Date.now();
        const workDir = path.join(
          activePipelines[runId].baseDirectory,
          clientId
        );
        const tars = client.files.expected
          .map(file => path.join(workDir, file))
          .sort((a, b) => parseInt(path.extname(a), 10) > parseInt(path.extname(b), 10));
        return extractTar(tars, workDir)
          .then(() => Promise.all(tars.map(tar => unlink(tar))));
      }
    }).then(() => {
      // we add the file here, otherwise there can be a race condition
      // with multiple clients untaring
      client.files.received
        .push(req.body.filename);
      const waitingOn = waitingOnForRun(runId);
      activePipelines[runId].currentState.waitingOn = waitingOn;
      const stateUpdate = Object.assign(
        {},
        activePipelines[runId].pipeline.currentState,
        activePipelines[runId].currentState
      );
      activePipelines[runId].stateEmitter
        .emit('update', stateUpdate);
      logger.silly(JSON.stringify(stateUpdate));
      if (waitingOn.length === 0) {
        activePipelines[runId].stateStatus = 'Received all nodes data and files';
        logger.silly('Received all nodes data and files');
        // clear transfer and start run
        clearClientFileList(runId);
        rmrf(path.join(activePipelines[runId].systemDirectory, '*'))
          .then(() => {
            printClientTimeProfiling(runId, 'Transmission with files');
            activePipelines[runId].remote
              .resolve({ debug: { received }, success: false });
          });
      }
    }).catch((error) => {
      const runError = Object.assign(
        error,
        {
          error: `Pipeline error from pipeline central node, Error details: ${error.error}`,
          message: `Pipeline error from pipeline central node, Error details: ${error.message}`,
        }
      );
      activePipelines[runId].state = 'error';
      activePipelines[runId].stateStatus = 'Received node error';
      activePipelines[runId].error = runError;
      clientPublish(
        activePipelines[runId].clients,
        { runId, error: runError }
      );
      activePipelines[runId].remote.reject(runError);
    });
  });

  app.get('/transfer', (req, res) => {
    const file = path.join(
      activePipelines[req.query.runId].systemDirectory,
      req.query.file
    );
    fs.exists(file, (exists) => {
      if (exists) {
        res.download(file);
      } else {
        res.sendStatus(404);
      }
    });
  });
  await new Promise((resolve) => {
    const server = app.listen(remotePort, () => {
      logger.silly(`File server up on port ${remotePort}`);
      resolve();
    });
    server.on('error', (e) => {
      logger.error(`File server error: ${e}`);
    });
  });
}

module.exports = expressFileServerSetup;
