const express = require('express');
const multer = require('multer');
const path = require('path');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));
const fs = require('fs');
const pify = require('util').promisify;
const rmrf = pify(require('rimraf'));
const crypto = require('crypto');
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
      try {
        const fp = path.join(activePipelines[req.body.runId].baseDirectory, req.body.clientId);
        mkdirp(fp)
          .then(() => {
            cb(
              null,
              fp
            );
          })
          .catch(e => cb(e));
      } catch (e) {
        debugger
        cb(e);
      }
    },
    filename: (req, file, cb) => {
      try {
        cb(null, req.body.filename);
      } catch (e) {
        debugger
        cb(e);
      }
    },
  });

  const upload = multer({ storage }).single('file');
  const app = express();
  app.use(express.json({ limit: '1000mb' }));
  app.use(express.urlencoded({ limit: '1000mb' }));

  app.post('/transfer', (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        debugger
        return res.status(500).send(err.stack);
        // An unknown error occurred when uploading.
      }
      const received = Date.now();
      res.end();
      const {
        clientId, runId, filename, md5,
      } = req.body;
      const client = remoteClients[clientId][runId];
      const workDir = path.join(
        activePipelines[runId].baseDirectory,
        clientId
      );
      const transferedFile = path.join(workDir, filename);

      const md5Sum = crypto.createHash('md5');
      const stream = fs.createReadStream(transferedFile);
      stream.on('data', (chunk) => {
        md5Sum.update(chunk);
      });
      stream.on('end', () => {
        if (md5 !== md5Sum.digest('hex')) {
          res.status(400).send('MD5 check failed, malformed file data');
          return fs.unlink(transferedFile, (err) => {
            debugger
            if (err) logger.error(`Error deleting malformed file: ${err}`);
          });
        }
        res.end();
        Promise.resolve().then(() => {
          // is this file the last?
          if (client.files.expected.length !== 0
            && client.files.expected
              .every(e => [filename, ...client.files.received].includes(e))) {
            remoteClients[clientId][runId].debug.received = received;

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
            .push(filename);
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
            // clear past iteration remote transfered files (if any) and start run
            clearClientFileList(runId);
            rmrf(path.join(activePipelines[runId].systemDirectory, '*'))
              .then(() => {
                printClientTimeProfiling(runId, 'Transmission with files');
                activePipelines[runId].remote
                  .resolve({ debug: { received }, success: false });
              });
          }
        }).catch((error) => {
          debugger
          if (!activePipelines[runId]) return logger.error(`File Transmission attempt on invalid runId ${runId} error: ${error} `);
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
      debugger
      logger.error(`File server error: ${e}`);
    });
  });
}

module.exports = expressFileServerSetup;
