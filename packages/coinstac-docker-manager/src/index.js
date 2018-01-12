'use strict';

const Docker = require('dockerode');

// TODO: ENV specific socket
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const streamPool = {};
const jobPool = {};

const manageStream = (stream, jobId) => {
  streamPool[jobId] = { stream, data: '' };

  stream.on('data', (chunk) => {
    streamPool[jobId].data += chunk;
  });

  return new Promise((resolve, reject) => {
    stream.on('end', () => {
      const container = jobPool[jobId];

      resolve(streamPool[jobId].data);
      streamPool[jobId] = undefined;

      container.remove()
      .then(() => {
        jobPool[jobId] = undefined;
      });
    });
    stream.on('error', (err) => {
      const container = jobPool[jobId];

      streamPool[jobId] = undefined;

      container.stop()
      .then(() => container.remove())
      .then(() => {
        jobPool[jobId] = undefined;
      });
      reject(err);
    });
  });
};

const queueJob = (jobId, input, opts) => {
  const jobOpts = Object.assign(
    {
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Cmd: ['python', '/computation/computation.py', `${JSON.stringify(input)}`],
    },
    opts
  );
  return docker.createContainer(jobOpts).then((container) => {
    jobPool[jobId] = container;

    // Return a Promise that resolves when the container's data stream 2closes,
    // which should happen when the comp is done.
    const dataFinished = new Promise((resolve, reject) => {
      container.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
        if (!err) {
          resolve(manageStream(stream, jobId));
        }

        reject(err);
      });
    });

    return container.start()
    .then(() => dataFinished);
  });
};

/**
 * Retrieve list of all local Docker images
 * @return {Object[]} Array of objects containing locally stored Docker images
 */
const getAllImages = () => {
  return docker.listImages();
};

/**
 * Pull individual image from Docker hub
 * @param {String} computation Docker image name
 * @return {Object} Returns stream of docker pull output
 */
const pullImage = (computation) => {
  return new Promise((resolve, reject) => {
    docker.pull(computation, (err, stream) => {
      if (err) {
        reject(err);
      }

      resolve(stream);
    });
  });
};

/**
 * Remove the Docker image associated with the image id
 * @param {string} imgId ID of image to remove
 * @return {Promise}
 */
const removeImage = (imageId) => {
  return docker.getImage(imageId).remove();
};

module.exports = {
  getAllImages,
  pullImage,
  removeImage,
  queueJob,
};
