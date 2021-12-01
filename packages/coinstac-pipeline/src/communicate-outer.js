const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const pify = require('util').promisify;
const mv = pify(require('mv'));
const { splitFilesFromStream, getFilesAndDirs } = require('./pipeline-manager/helpers');

async function communicateOuter({
  message,
  activePipelines,
  pipeline,
  logger,
  clientId,
  messageIteration,
  publishData,
  transferFiles,
}) {
  if (message instanceof Error) { // eslint-disable-line no-lonely-if
    if (!activePipelines[pipeline.id].registered) {
      activePipelines[pipeline.id].stashedOutput = message;
    } else {
      publishData('run', {
        id: clientId,
        runId: pipeline.id,
        error: message,
        debug: { sent: Date.now() },
      });
      activePipelines[pipeline.id].stashedOutput = undefined;
    }
  } else {
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
          if (!activePipelines[pipeline.id].registered) {
            activePipelines[pipeline.id].stashedOutput = message;
          } else {
            const archive = archiver('tar', {
              gzip: true,
              gzipOptions: {
                level: 9,
              },
            });

            const archiveFilename = `${pipeline.id}-${clientId}-tempOutput.tar.gz`;
            const splitProm = splitFilesFromStream(
              archive,
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
              logger.debug('############# Local client sending out data with files');
              publishData('run', {
                id: clientId,
                runId: pipeline.id,
                output: message,
                files: [...files],
                iteration: messageIteration,
                debug: { sent: Date.now() },
              });
              activePipelines[pipeline.id].stashedOutput = undefined;
              transferFiles(
                'post',
                100,
                [...files],
                clientId,
                pipeline.id,
                activePipelines[pipeline.id].systemDirectory
              ).catch((e) => {
                // files failed to send, bail
                logger.error(`Client file send error: ${e}`);
                publishData('run', {
                  id: clientId,
                  runId: pipeline.id,
                  error: { stack: e.stack, message: e.message },
                  debug: { sent: Date.now() },
                }, 1);
              });
            }).catch((e) => {
              publishData('run', {
                id: clientId,
                runId: pipeline.id,
                error: e,
                debug: { sent: Date.now() },
              });
              throw e;
            });
          }
        } else {
          if (!activePipelines[pipeline.id].registered) { // eslint-disable-line no-lonely-if, max-len
            activePipelines[pipeline.id].stashedOutput = message;
          } else {
            logger.debug('############# Local client sending out data');
            publishData('run', {
              id: clientId,
              runId: pipeline.id,
              output: message,
              iteration: messageIteration,
              debug: { sent: Date.now() },
            }, 1);
            activePipelines[pipeline.id].stashedOutput = undefined;
          }
        }
      })
      .catch((e) => {
        publishData('run', {
          id: clientId,
          runId: pipeline.id,
          error: e,
          debug: { sent: Date.now() },
        });
        throw e;
      });
  }
}

module.exports = communicateOuter;
