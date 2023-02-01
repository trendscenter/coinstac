'use strict';
const stream = require('stream');
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
    /*
    @return Promise<stream>
    */
    pull: async (dockerImage) => {
        const dockerImageName = dockerImage.replace(':latest', '');
        const localImage = dockerImageName.replaceAll('/', '_');
        /*
          get the the docker digest from the dockerhub image passed in
          @return {Promise<string>}
         */
        const getLatestDockerDigest = (dockerImageName) => {
          return new Promise((resolve, reject)=>{
              const latestDigest = spawn(
                path.join(__dirname, 'utils', 'get-docker-digest.sh'),
                [dockerImageName]
              );
              let error = '';
              let stderr = '';
              let digest = '';
              latestDigest.stderr.on('data', (data) => { stderr += data; });
              latestDigest.stdout.on('data', (data) => { digest += data; });
              latestDigest.on('error', (e) => {
                error = e;
              });
              latestDigest.on('close', (code) => {
                if (error) {
                  reject(new Error(error));
                }
                if (code !== 0) {
                  reject(new Error(stderr));
                }
                resolve(digest);
              });
          });
        }
        /*
          check local singularity image digest against latest docker image
          @return {boolean}
         */
        const isSingularityImageLatest = async (digest, localImage) => {
          const files = await readdir(imageDirectory);
          const savedImage = files.find(file => file.includes(localImage));
          if (savedImage && savedImage.includes(`${localImage}-${digest.split(':')[1]}`)) {
            return true;
          }
          return false;
        };
        /*
          pull latest docker image and convert to local singularity image
          @return {stream}
         */
        const pullAndConvertDockerToSingularity =  (digest, localImage) => {
              const conversionProcess = spawn(
                path.join(__dirname, 'utils', 'singularity-docker-build-conversion.sh'),
                [
                  path.join(imageDirectory, `${localImage}-${digest.split(':')[1]}`),
                  dockerImageName,
                ]
              );
              /*
                in order to maintain api parity with the docker service, we have to wrap
                the conversion process spawn events to mimic the docker pull's returned stream
               */
              let convStderr = '';
              conversionProcess.stderr.on('data', (data) => { convStderr += data; });
              conversionProcess.stdout.on('data', (data) => { conversionProcess.emit('data', data); });
              // we're ignoring the .on('error') event as its handled
              // by the caller of the manager api
              // but we need to wrap and emit cases from the script itself erroring
              conversionProcess.on('close', async (code) => {
                if (code !== 0) {
                  return conversionProcess.emit('error', new Error(convStderr));
                }
                conversionProcess.emit('end');
              });
              return conversionProcess;
          };

        const createImageIsLatestStream = ()=>{
          // This stream is here to mimic the behavior of the docker api completing a download stream
          const myStream = stream.Readable({
            read(){
              this.push(null);
            }
          })
          return myStream;
        }

        const digest = await getLatestDockerDigest(dockerImageName);
        if(await isSingularityImageLatest(digest, localImage)){
          return createImageIsLatestStream();         
        } else{
          return pullAndConvertDockerToSingularity(digest, localImage);
        }
    },
    setImageDirectory(imageDir) {
      imageDirectory = imageDir;
    },
  };
};

module.exports = SingularityService;
