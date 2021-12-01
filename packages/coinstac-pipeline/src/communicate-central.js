const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const uuid = require('uuid/v4');
const pify = require('util').promisify;
const mv = pify(require('mv'));
const { getFilesAndDirs, splitFilesFromStream } = require('./pipeline-manager/helpers');

async function communicateCentral({
  message,
  activePipelines,
  pipeline,
  clientPublish,
  logger,
  clientId,
  success,
  messageIteration,
  publishData,
}) {
  if (message instanceof Error) {
    const runError = Object.assign(
      message,
      {
        error: `Pipeline error from central node\n Error details: ${message.error}`,
        message: `Pipeline error from central node\n Error details: ${message.message}`,
        stack: message.stack,
      }
    );
    activePipelines[pipeline.id].state = 'error';
    activePipelines[pipeline.id].stateStatus = 'Central node error';
    activePipelines[pipeline.id].error = runError;
    activePipelines[pipeline.id].remote.reject(runError);
    clientPublish(
      activePipelines[pipeline.id].clients,
      { runId: pipeline.id, error: runError }
    );
  } else {
    logger.silly('############ Sending out remote data');
    await getFilesAndDirs(activePipelines[pipeline.id].transferDirectory)
      .then((data) => {
        return Promise.all([
          ...data.files.map((file) => {
            return mv(
              path.join(activePipelines[pipeline.id].transferDirectory, file),
              path.join(activePipelines[pipeline.id].systemDirectory, file)
            );
          }),
          ...data.directories.map((dir) => {
            return mv(
              path.join(activePipelines[pipeline.id].transferDirectory, dir),
              path.join(activePipelines[pipeline.id].systemDirectory, dir),
              { mkdirp: true }
            );
          }),
        ]).then(() => data);
      })
      .then((data) => {
        if (data && (data.files.length !== 0 || data.directories.length !== 0)) {
          const archive = archiver('tar', {
            gzip: true,
            gzipOptions: {
              level: 9,
            },
          });
          const archiveFilename = `${pipeline.id}-${uuid()}-tempOutput.tar.gz`;
          const splitProm = splitFilesFromStream(
            archive, // stream
            path.join(activePipelines[pipeline.id].systemDirectory, archiveFilename),
            22428800 // 20MB chunk size
          );
          data.files.forEach((file) => {
            archive.append(
              fs.createReadStream(
                path.join(activePipelines[pipeline.id].systemDirectory, file)
              ),
              { name: file }
            );
          });
          data.directories.forEach((dir) => {
            archive.directory(
              path.join(activePipelines[pipeline.id].systemDirectory, dir),
              dir
            );
          });
          archive.finalize();
          return splitProm.then((files) => {
            if (success) {
              activePipelines[pipeline.id].finalTransferList = new Set();
            }
            clientPublish(
              activePipelines[pipeline.id].clients,
              {
                runId: pipeline.id,
                output: message,
                success,
                files: [...files],
                iteration: messageIteration,
                debug: { sent: Date.now() },
              },
              {
                success,
                limitOutputToOwner: activePipelines[pipeline.id].limitOutputToOwner,
                owner: activePipelines[pipeline.id].owner,
              }
            );
          });
        }
        clientPublish(
          activePipelines[pipeline.id].clients,
          {
            runId: pipeline.id,
            output: message,
            success,
            iteration: messageIteration,
            debug: { sent: Date.now() },
          },
          {
            success,
            limitOutputToOwner: activePipelines[pipeline.id].limitOutputToOwner,
            owner: activePipelines[pipeline.id].owner,
          }

        );
      }).catch((e) => {
        logger.error(e);
        publishData('run', {
          id: clientId,
          runId: pipeline.id,
          error: `Error from central node ${e}`,
          debug: { sent: Date.now() },
        });
      });
  }
}

module.exports = communicateCentral;
