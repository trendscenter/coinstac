'use strict';

const { spawn } = require('child_process');
const path = require('path');
const utils = require('../utils');
const { ServiceFunctionGenerator } = require('./serviceFunction');

/**
 * returns an instance of the singularity service for usage
 */
const SingularityService = () => {
  let imageDirectory = './';
  const Container = ({ opts, commandArgs, serviceId }) => {
    let error;
    let stderr = '';
    // mimics docker api for compat
    const State = { Running: false };
    const process = spawn(
      'singularity',
      [
        'instance',
        'start',
        '--containall',
        '-B',
        opts.binds,
        opts.image,
        serviceId,
        `${commandArgs}`,
      ]
    );

    return new Promise((resolve, reject) => {
      process.stderr.on('data', (data) => { stderr += data; });
      process.on('error', e => reject(e));
      process.on('close', (code) => {
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
  };

  const startContainer = (args) => {
    return Container(args);
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
        return startContainer({ opts, commandArgs, serviceId })
          .then((container) => {
            utils.logger.silly(`Starting singularity cointainer: ${serviceId}`);
            utils.logger.silly(`Returning service for ${serviceId}`);
            const serviceFunction = ServiceFunctionGenerator({ port });
            return { service: serviceFunction, container };
          });
      };
      return tryStartService();
    },
    pull: (imageName, callback) => {
      try {
        const pullProcess = spawn('singularity', ['pull', path.join(imageDirectory, imageName), `library://${imageName}:latest`]);
        callback(null, pullProcess.stdout);

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
