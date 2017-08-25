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

const pullImage = (computation) => {
  return new Promise ((res) => {
    docker.pull(computation, (err, stream) => {
    
    });
  });
};

const pullComputations = (computations) => {
  const compsP = payload.comps.reduce((arr, img) => {
      arr.push(pullImage(img));
      return arr;
    }, []);

    return Promise.all(compsP)
    .then(res => res)
    .catch(console.log);
};

module.exports = {
  pullComputations,
  queueJob,
};