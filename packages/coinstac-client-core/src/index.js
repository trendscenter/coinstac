'use strict';

/* eslint-disable no-unused-vars */
// app package deps
const pify = require('util').promisify;
const csvParse = require('csv-parse');
const mkdirp = pify(require('mkdirp'));
const Emitter = require('events');
const axios = require('axios');
const nes = require('nes');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const { ncp } = require('ncp');

// set w/ config etc post release
process.LOGLEVEL = 'silly';

const { Logger, transports: { Console } } = winston;

const Manager = require('coinstac-manager');
const PipelineManager = require('coinstac-pipeline');


/**
 * Create a user client for COINSTAC
 * @example <caption>construction and initialization</caption>
 *
 * @class
 * @constructor
 * @param {object} opts
 * @property {string} [opts.appDirectory] Path to on-disk storage. Primarily
 * used for testing.
 * @param {Winston} [opts.logger] permit user injected logger vs default logger
 * @param {string} [opts.logLevel] npm log levels, e.g. 'verbose', 'error', etc
 * @param {string} [opts.userId] Currently logged-in user
 * @property {Winston} logger
 * @property {string} appDirectory
 * @property {Auth} auth
 * @property {Project} project
 */
class CoinstacClient {
  constructor(opts) {
    if (!opts || !(opts instanceof Object)) {
      throw new TypeError('coinstac-client requires configuration opts');
    }
    this.options = opts;
    this.logger = opts.logger || new Logger({ transports: [new Console()] });
    this.appDirectory = opts.appDirectory;
    this.clientServerURL = opts.clientServerURL;

    this.Manager = Manager;
    this.Manager.setLogger(this.logger);

    /* istanbul ignore if */
    if (opts.logLevel) {
      this.logger.level = opts.logLevel;
    }

    this.clientId = opts.userId;
    this.token = opts.token;

    if (this.clientServerURL) {
      this.initializeSocket();
    }
  }

  initialize() {
    return PipelineManager.create({
      mode: 'local',
      clientId: this.options.userId,
      logger: this.logger,
      operatingDirectory: path.join(this.appDirectory),
      remotePort: this.options.fileServer.port,
      remoteProtocol: this.options.fileServer.protocol,
      remotePathname: this.options.fileServer.pathname,
      remoteURL: this.options.fileServer.hostname,
      mqttRemotePort: this.options.mqttServer.port,
      mqttRemoteWSPort: this.options.mqttWSServer.port,
      mqttRemoteProtocol: this.options.mqttServer.protocol,
      mqttRemoteWSProtocol: this.options.mqttWSServer.protocol,
      mqttRemoteWSPathname: this.options.mqttWSServer.pathname,
      mqttRemoteURL: this.options.mqttServer.hostname,
    }).then((manager) => {
      this.pipelineManager = manager;
      return manager;
    });
  }

  async initializeSocket() {
    const websocketURL = `ws://${new URL(this.clientServerURL).host}`;

    this.socketClient = new nes.Client(websocketURL);
    await this.socketClient.connect();
  }

  setClientServerURL(clientServerURL) {
    this.clientServerURL = clientServerURL;
  }

  /**
   * Get a metadata CSV's contents.
   *
   * @param {string} filename Full file path to CSV
   * @returns {Promise<Project>}
   */
  static getCSV(filename) {
    return fs.readFile(filename)
      .then(data => pify(csvParse)(data.toString()))
      .then(JSON.stringify);
  }

  /**
   * Get array index of metadata file column
   *
   * @param {array} arr metadata array set
   * @returns {index}
   */
  static getFileIndex(arr) {
    let key = '';
    arr.shift();
    arr[0].forEach((str, i) => {
      if (str && typeof str === 'string') {
        const match = str.match(/(?:\.([a-zA-Z]+))?$/);
        if (match[0] !== '' && match[1] !== 'undefined') {
          key = i;
        }
      }
    });
    return key;
  }

  /**
   * Parse metadata and shift data column if need be.
   *
   * @param {Array[]} metaFile Metadata CSV's contents
   * @returns {Array[]} metaFile Metadata CSV's contents
   */
  static parseMetaFile(metaFile) {
    const filesKey = this.getFileIndex([...metaFile]);
    if (filesKey !== 0) {
      metaFile = metaFile.map((row) => {
        const r = [...row];
        const data = r[filesKey];
        r.splice(filesKey, 1);
        r.unshift(data);
        return r;
      });
    }
    return metaFile;
  }


  /**
   * Load a metadata CSV file.
   *
   * @param {string} metaFilePath Path to metadata CSV
   * @param {Array[]} metaFile Metadata CSV's contents
   * @returns {File[]} Collection of files
   */
  static getFilesFromMetadata(metaFilePath, metaFile) {
    const files = this.parseMetaFile(metaFile).map((filecol) => {
      const file = filecol[0];
      return path.isAbsolute(file)
        ? file
        : path.resolve(path.join(path.dirname(metaFilePath), file));
    });
    files.shift();
    return files;
  }


  /**
   * Get JSON schema contents.
   *
   * @param {string} filename Full file path to JSON Schema
   * @returns {Promise<Project>}
   */
  static getJSONSchema(filename) {
    return fs.readFile(filename)
      .then(data => JSON.parse(data.toString()));
  }

  /**
    * Get array of file paths recursively
    *
    * @param {object} group
    * @param {array} group.paths the paths to traverse
    * @param {string} group.parentDir parent directory if diving into subdir
    * @param {string} group.error present if error found
    */
  static async getSubPathsAndGroupExtension(group, multext) {
    let pathsArray = [];
    let extension = null;

    // Empty subdirectory
    if (group.paths.length === 0) {
      return null;
    }

    // Return error
    if (group.error) {
      return group;
    }

    // Iterate through all paths
    await Promise.all(group.paths.map(async (filePath) => {
      let p = filePath;
      // Combine path with parent dir to get absolute path
      if (group.parentDir) {
        p = path.join(group.parentDir, p);
      }

      const stats = await fs.stat(p);

      if (stats.isDirectory()) {
        const dirs = await fs.readdir(p);
        const paths = [...dirs.filter(item => !(/(^|\/)\.[^/.]/g).test(item))];
        // Recursively retrieve path contents of directory
        const subGroup = await this.getSubPathsAndGroupExtension({
          paths,
          extension: group.extension,
          parentDir: p,
        });
        if (subGroup) {
          if (subGroup.error) {
            return subGroup;
          }

          if (!multext && extension && subGroup.extension && extension !== subGroup.extension) {
            return { error: `Group contains multiple extensions - ${extension} & ${subGroup.extension}.` };
          }

          extension = subGroup.extension; // eslint-disable-line prefer-destructuring
          pathsArray = pathsArray.concat(subGroup.paths);
        }
      } else {
        const thisExtension = path.extname(p);

        if ((!multext && group.extension && thisExtension !== group.extension)
             || (!multext && extension && extension !== thisExtension)) {
          return { error: `Group contains multiple extensions - ${thisExtension} & ${group.extension || extension}.` };
        }

        extension = thisExtension;
        pathsArray.push(p);
      }
    }));
    return { paths: pathsArray, extension };
  }

  /**
   * Validate client pipeline against run pipeline snapshot before link data files
   *
   * TODO: Create cleanup function to unlink files after run
   *
   * @param {string} consortiumId The id of the consortium running this pipeline
   * @param {*} clientPipeline The client's copy of the consortium's active pipeline
   * @param {*} filesArray An array of all the files used by the client's data mapping
   *                        for this pipeline
   * @param {*} runId The id if this particular pipeline run
   * @param {*} runPipeline The run's copy of the current pipeline
   */
  startPipeline(
    clients,
    consortiumId,
    clientPipeline,
    filePaths,
    runId,
    runPipeline,
    networkVolume = false
  ) {
    const runObj = { spec: clientPipeline, runId, timeout: clientPipeline.timeout };

    if (clients) {
      runObj.clients = clients;
    }

    if (!this.clientServerURL) {
      const fp = path.join(this.appDirectory, 'input', this.clientId, runId);
      const dataType = clientPipeline.steps[0].inputMap.data.type;

      if (dataType === 'directory') {
        return mkdirp(fp)
          .then(() => {
            return new Promise((resolve) => {
              ncp(filePaths.baseDirectory, fp, (e) => {
                if (e) {
                  throw e;
                }
                resolve();
              });
            }).then(() => this.pipelineManager.startPipeline(runObj));
          });
      }

      if (dataType !== 'directory') {
        return mkdirp(fp)
          .then(() => {
          // TODO: validate runPipeline against clientPipeline
            const linkPromises = [];

            if (filePaths) {
              debugger
              let stageFiles = process.env.CI ? fs.copyFile : fs.link;
              if (networkVolume) {
                stageFiles = fs.symlink;
                runObj.alternateInputDirectory = filePaths.baseDirectory;
              }

              for (let i = 0; i < filePaths.files.length; i += 1) {
                const mkdir = path.normalize(filePaths.files[i])
                === path.basename(filePaths.files[i])
                  ? Promise.resolve()
                  : mkdirp(path.resolve(fp, path.dirname(filePaths.files[i])));

                linkPromises.push( // eslint-disable-next-line no-loop-func
                  mkdir.then(() => stageFiles(
                    path.resolve(filePaths.baseDirectory, filePaths.files[i]),
                    path.resolve(fp, path.basename(filePaths.files[i]))
                  )
                    .catch((e) => {
                      // permit dupes
                      if (e.code && e.code !== 'EEXIST') {
                        throw e;
                      }
                    }))
                );
              }
            }

            return Promise.all(linkPromises)
              .then(() => this.pipelineManager.startPipeline(runObj));
          });
      }
    }

    const run = {
      ...runObj,
      consortiumId,
      pipelineSnapshot: clientPipeline,
    };

    return axios.post(
      `${this.clientServerURL}/startPipeline/${this.clientId}`,
      { run },
      { headers: { Authorization: `Bearer ${this.token}` } }
    )
      .then(({ data }) => {
        return new Promise((resolve) => {
          const stateEmitter = new Emitter();

          function getResult(socketClient) {
            return new Promise((resResolve, resReject) => {
              socketClient.subscribe(`/pipelineResult/${runId}`, (res) => {
                if (res.event === 'update') {
                  stateEmitter.emit('update', res.data);
                }

                if (res.event === 'result') {
                  socketClient.unsubscribe(`/pipelineResult/${runId}`);
                  resResolve(res.data);
                }

                if (res.event === 'error') {
                  socketClient.unsubscribe(`/pipelineResult/${runId}`);
                  resReject(res.data);
                }
              });
            });
          }

          resolve({
            pipeline: {
              ...data.pipeline,
              stateEmitter,
            },
            result: getResult(this.socketClient),
          });
        });
      });
  }

  /**
   * Requests a pipeline stop by notifying the pipeline controller
   * the pipeline will then stop via an error event and terminate as if an error
   * were thrown
   * @param {string} pipelineId The id of the pipeline running
   * @param {string} runId The id of the pipeline run
   */
  requestPipelineStop(runId) {
    this.pipelineManager.stopPipeline(runId);
  }

  unlinkFiles(runId) {
    const fullPath = path.join(this.appDirectory, 'input', this.clientId, runId);

    return fs.stat(fullPath).then((stats) => {
      return stats.isDirectory();
    })
      .catch((err) => {
        if (err.code === 'ENOENT') return false;
        throw err;
      })
      .then((exists) => {
        if (!exists) {
          return [];
        }

        return fs.readdir(fullPath);
      })
      .then((filesArray) => {
        const unlinkPromises = [];
        filesArray.forEach(async (file) => {
          file = path.resolve(fullPath, file);
          fs.stat(file).then(async (fstats) => {
            const hasFiles = await fs.readdir(file);
            if (fstats.isDirectory() && hasFiles) {
              unlinkPromises.push(
                fs.rmdir(file, { recursive: true })
              );
            } else {
              unlinkPromises.push(
                fs.unlink(file)
              );
            }
          });
        });
        return Promise.all(unlinkPromises);
      });
  }
}

module.exports = CoinstacClient;
