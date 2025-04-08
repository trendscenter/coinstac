const stream = require('stream');
const { spawn, execFile, spawnSync } = require('child_process');
const path = require('path');
const { readdir, rm } = require('fs').promises;
const utils = require('../utils');
const { ServiceFunctionGenerator } = require('./serviceFunction');

/**
 * returns an instance of the singularity service for usage
 */
const SingularityService = () => {

  detectSingularityOrApptainer = () => {
    // Check for singularity
    const singularityCheck = spawnSync('which', ['singularity']);
    if (singularityCheck.status === 0) {
      return 'singularity';
    }

    // Check for apptainer
    const apptainerCheck = spawnSync('which', ['apptainer']);
    if (apptainerCheck.status === 0) {
      return 'apptainer';
    }
  }

  const service = detectSingularityOrApptainer();

  let imageDirectory = './';
  const Container = (
    commandArgs,
    serviceId,
    port,
    { mounts, dockerImage }
  ) => {
    let error;
    let stderr = '';
    let stdout = '';

    // mimics docker api for compat
    const State = { Running: false };
    const localImage = dockerImage.replaceAll('/', '_');

    return readdir(imageDirectory).then((files) => {
      const savedImage = files.find(file => file.includes(localImage));
      if (!savedImage) throw new Error(`No singularity ${localImage} image found in ${imageDirectory}`);
      const instanceProcess = spawn(
        service,
        [
          'run',
          '--containall',
          '--writable-tmpfs',
          '-e',
          '--env',
          `PYTHONUNBUFFERED=1,COINSTAC_PORT=${port}`,
          '-B',
          `${mounts.join(',')},/tmp:/tmp:rw`, // mnt local tmp for spm fix
          path.join(imageDirectory, savedImage),
          ...(commandArgs ? ['node', '/server/index.js', `${commandArgs.replace(/"/g, '\\"')}`] : []),
        ]
      );
      return new Promise((resolve, reject) => {
        instanceProcess.stderr.on('data', (data) => { 
          stderr += data;
          return stderr;
        });
        instanceProcess.stdout.on('data', (data) => { 
          stdout += data; 
          return stdout;
        });
        instanceProcess.on('error', e => reject(e));
        instanceProcess.on('close', (code) => {
          // for whatever reason singularity is outputting
          // error info on stdout and info on stderr......
          if (code !== 0 || stdout) {
            error = stdout || stderr;
            utils.logger.error(error);
            State.Running = false;
            return reject(new Error(error));
          }
          State.Running = true;

        });
        resolve({
          error,
          State,
          inspect(cb) {
            if (output.instances.length > 0) {
              cb(null, { State });
            } else if (State.Running === false) {
              return cb(new Error('Singularity container not running'));
            }
          },
          stop() {
            return new Promise((resolve, reject) => {
              try {
                const wasKilled = instanceProcess.kill(); // returns true if success, false if the process was not running
                if (!wasKilled) {
                  return reject(new Error('Failed to kill process: not running'));
                }
                State.Running = false;
                resolve(true);

              } catch (err) {
                reject(err);
              }
            });
          }
        });
      });
    });
  };

  const startContainer = (...args) => {
    return Container(...args);
  };
  /*
  @param {string} imageDirectory
  @return {Promise<Array<string>>} image names
  */
  const listImages = async (imageDirectory) => {
    return readdir(imageDirectory);
  };

  const removeOldImages = async (baseImageName, imageNameWithHash) => {
    const images = await listImages(imageDirectory);
    const imagesToRemove = images.filter((image) => {
      return image.includes(baseImageName) && !image.includes(imageNameWithHash);
    });
    const unlinkPromises = imagesToRemove.map((image) => {
      return rm(path.join(imageDirectory, image), { recursive: true, force: true });
    });
    return Promise.all(unlinkPromises);
  };

  const pull = async (dockerImage) => {
    const dockerImageName = dockerImage.replace(':latest', '');
    const localImage = dockerImageName.replaceAll('/', '_');
    /*
      get the the docker digest from the dockerhub image passed in
      @return {Promise<string>}
     */
    const getLatestDockerDigest = (dockerImageName) => {
      return new Promise((resolve, reject) => {
        execFile(
          path.join(__dirname, 'utils', 'get-docker-digest.sh'),
          [dockerImageName],
          (error, stdout, stderr) => {
            if (error) {
              reject(new Error(error + stdout + stderr));
            }
            resolve(stdout);
          }
        );
      });
    };
    /*
      check local singularity image digest against latest docker image
      @return {boolean}
     */
    const isSingularityImageLatest = async (imageNameWithHash) => {
      const images = await listImages(imageDirectory);
      const savedImage = images.find(image => image.includes(localImage));
      if (savedImage && savedImage.includes(imageNameWithHash)) {
        return true;
      }
      return false;
    };
    /*
      pull latest docker image and convert to local singularity image
      @return {stream}
     */
    const pullAndConvertDockerToSingularity = (dockerImageName, imageNameWithHash) => {
      const conversionProcess = execFile(
        service,
        [
          'pull',
          path.join(imageDirectory, imageNameWithHash),
          `docker://${dockerImageName}`,
        ],
        (error, stdout, stderr) => {
          /*
            In order to maintain API parity with the Docker service,
            we wrap spawn events to mimic the Docker pull's returned stream.
          */
          if (error) {
            conversionProcess.emit(
              'error',
              new Error(error + stdout + stderr)
            );
          } else {
            removeOldImages(localImage, imageNameWithHash)
              .then(() => {
                conversionProcess.emit('data', stdout + stderr);
                conversionProcess.emit('end');
              })
              .catch((e) => {
                conversionProcess.emit('data', stdout + stderr);
                conversionProcess.emit('error', e);
              });
          }
        }
      );
      // const conversionProcess = execFile(
      //   path.join(__dirname, 'utils', 'singularity-docker-build-conversion.sh'),
      //   [
      //     path.join(imageDirectory, imageNameWithHash),
      //     dockerImageName,
      //   ],
      //   (error, stdout, stderr) => {
      //     /*
      //     in order to maintain api parity with the docker service, we have to wrap
      //     the conversion process spawn events to mimic the docker pull's returned stream
      //     */
      //     if (error) {
      //       conversionProcess.emit('error', new Error(error + stdout + stderr));
      //     } else {
      //       removeOldImages(localImage, imageNameWithHash)
      //         .then(() => {
      //           conversionProcess.emit('data', stdout + stderr);
      //           conversionProcess.emit('end');
      //         }).catch((e) => {
      //           conversionProcess.emit('data', stdout + stderr);
      //           conversionProcess.emit('error', e);
      //         });
      //     }
      //   }
      // );
      return conversionProcess;
    };

    const createImageIsLatestStream = () => {
      // This stream is here to mimic the behavior of the docker api completing a download stream
      const myStream = stream.Readable({
        read() {
          // verify that this stread triggers an 'end' event that gets consumed by main
          this.push('Image already downloaded');
          this.push(null);
        },
      });
      return myStream;
    };

    const digest = '0:1';//await getLatestDockerDigest(dockerImageName);
    const imageNameWithHash = `${localImage}-${digest.split(':')[1]}`;
    if (await isSingularityImageLatest(imageNameWithHash)) {
      return createImageIsLatestStream();
    }
    return pullAndConvertDockerToSingularity(dockerImageName, imageNameWithHash);
  };

  const pullImagesFromList = async (comps) => {
    const streams = await Promise.all(
      comps.map((image) => { return pull(`${image}:latest`); })
    );
    return streams.map((stream, index) => ({ stream, compId: comps[index] }));
  };

  return {
    createService(serviceId, port, opts) {
      utils.logger.silly(`Request to start service ${serviceId}`);
      let commandArgs = '';
      if (opts.version === 1) {
        commandArgs = JSON.stringify({
          level: process.LOGLEVEL,
          server: 'ws',
          port,
        });
      }
      const tryStartService = () => {
        utils.logger.silly(`Starting service ${serviceId} at port: ${port}`);
        return startContainer(commandArgs, serviceId, port, opts)
          .then((container) => {
            utils.logger.silly(`Starting singularity cointainer: ${serviceId}`);
            utils.logger.silly(`Returning service for ${serviceId}`);
            const serviceFunction = ServiceFunctionGenerator({
              port, compspecVersion: opts.version,
            });
            return { service: serviceFunction, container };
          });
      };
      return tryStartService();
    },
    /*
    @return Promise<stream>
    */
    pull,
    pullImagesFromList,
    setImageDirectory(imageDir) {
      imageDirectory = imageDir;
    },
  };
};

module.exports = SingularityService;
