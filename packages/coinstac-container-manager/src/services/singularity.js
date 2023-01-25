'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { readdir } = require('fs').promises;
const utils = require('../utils');
const { ServiceFunctionGenerator } = require('./serviceFunction');

/**
 * returns an instance of the singularity service for usage
 */
const SingularityService = () => {
  let imageDirectory = './';
  const Container = (
    commandArgs, serviceId,
    { mounts, dockerImage }
  ) => {
    let error;
    let stderr = '';
    // mimics docker api for compat
    const State = { Running: false };
    const localImage = dockerImage.replaceAll('/', '_');

    return readdir(imageDirectory).then((files) => {
      const savedImage = files.find(file => file.includes(localImage));
      if (!savedImage) throw new Error(`No singularity ${localImage} image found in ${imageDirectory}`);
      const instanceProcess = spawn(
        'singularity',
        [
          'instance',
          'start',
          '--containall',
          '-B',
          mounts.join(','),
          path.join(imageDirectory, savedImage),
          serviceId,
          `${commandArgs}`,
        ]
      );
      return new Promise((resolve, reject) => {
        instanceProcess.stderr.on('data', (data) => { stderr += data; });
        instanceProcess.on('error', e => reject(e));
        instanceProcess.on('close', (code) => {
          if (code !== 0) {
            error = stderr;
            utils.logger.error(error);
            State.Running = false;
            return reject(new Error(error));
          }
          State.Running = true;

          resolve({
            error,
            State,
            inspect(cb) {
              let stderr = '';
              let stdout = '';
              const process = spawn(
                'singularity',
                [
                  'instance',
                  'list',
                  '--json',
                  `${serviceId}`,
                ]
              );
              process.stdout.on('data', (data) => { stdout += data; });
              process.stderr.on('data', (data) => { stderr += data; });
              process.on('error', e => reject(e));
              process.on('close', (code) => {
                if (code !== 0) {
                  utils.logger.error(stderr);
                  return cb(new Error(stderr));
                }
                const output = JSON.parse(stdout);
                if (output.instances.length > 0) {
                  cb(null, { State });
                } else {
                  return cb(new Error('Singularity container not running'));
                }
              });
            },
            stop() {
              return new Promise((resolve, reject) => {
                let stderr = '';
                const process = spawn(
                  'singularity',
                  [
                    'instance',
                    'stop',
                    `${serviceId}`,
                  ]
                );
                process.stderr.on('data', (data) => { stderr += data; });
                process.on('error', e => reject(e));
                process.on('close', (code) => {
                  if (code !== 0) {
                    utils.logger.error(stderr);
                    return reject(new Error(stderr));
                  }
                  resolve(true);
                });
              });
            },
          });
        });
      });
    });
  };

  const startContainer = (...args) => {
    return Container(...args);
  };
  return {
    createService(serviceId, port, opts) {
      utils.logger.silly(`Request to start service ${serviceId}`);
      const commandArgs = JSON.stringify({
        level: process.LOGLEVEL,
        server: 'ws',
        port,
      });
      const tryStartService = () => {
        utils.logger.silly(`Starting service ${serviceId} at port: ${port}`);
        return startContainer(commandArgs, serviceId, opts)
          .then((container) => {
            utils.logger.silly(`Starting singularity cointainer: ${serviceId}`);
            utils.logger.silly(`Returning service for ${serviceId}`);
            const serviceFunction = ServiceFunctionGenerator({ port });
            return { service: serviceFunction, container };
          });
      };
      return tryStartService();
    },
    pull: (dockerImage, callback) => {
      try {
        const localImage = dockerImage.replaceAll('/', '_');
        const latestDigest = spawn(
          path.join(__dirname, 'utils', 'get-docker-digest.sh'),
          [dockerImage.replace(':latest', '')]
        );
        let error = '';
        let stderr = '';
        let digest = '';
        latestDigest.stderr.on('data', (data) => { stderr += data; });
        latestDigest.stdout.on('data', (data) => { digest += data; });
        latestDigest.on('error', (e) => {
          error = e;
        });
        latestDigest.on('close', async (code) => {
          if (error) {
            return callback(error);
          }
          if (code !== 0) {
            callback(new Error(stderr));
          }
          const files = await readdir(imageDirectory);
          const savedImage = files.find(file => file.includes(localImage));
          if (savedImage && savedImage.inludes(`${localImage}-${digest.split(':')[1]}`)) return callback(null, 'Image already downloaded');
          const conversionProcess = spawn(
            path.join(__dirname, 'utils', 'singularity-docker-build-conversion.sh'),
            [
              path.join(imageDirectory, `${localImage}-${digest.split(':')[1]}`),
              `docker://${dockerImage}`,
            ]
          );
          /*
            in order to maintain api parity with the docker service, we have to wrap
            the conversion process spawn events to mimic the docker pull's returned stream
           */
          let error = '';
          let stderr = '';
          conversionProcess.stderr.on('data', (data) => { digest += data; });
          conversionProcess.stdout.on('data', (data) => { conversionProcess.emit('data', data); });
          // we're ignoring the .on('error') event as its handled by the caller in the docker api
          // but we need to wrap and emit cases from the script itself erroring
          conversionProcess.on('close', async (code) => {
            if (code !== 0) {
              return conversionProcess.emit('error', new Error(stderr));
            }
            conversionProcess.emit('end');
          });
          callback(null, conversionProcess);
        });
        // if the command fails internally this catch won't catch
      } catch (err) {
        callback(err);
      }
    },
    setImageDirectory(imageDir) {
      imageDirectory = imageDir;
    },
  };
};

module.exports = SingularityService;
