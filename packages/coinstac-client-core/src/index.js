'use strict';

// app package deps
const tail = require('lodash/tail');
const bluebird = require('bluebird');
const csvParse = require('csv-parse');
const fs = require('fs');

bluebird.config({ warnings: false });
const osHomedir = require('os-homedir');
const path = require('path');
const winston = require('winston');

const Logger = winston.Logger;
const Console = winston.transports.Console;
const ComputationRegistry = require('coinstac-computation-registry');

/**
 * Create a user client for COINSTAC
 * @example <caption>construction and initialization</caption>
 * const client = new CoinstacClient();
 * client.initialize((err) => {
 *   if (err) { throw err; }
 *   client.logger.info('Success! I’ve initialized!');
 * });
 *
 * @class
 * @constructor
 * @param {object} opts
 * @property {string} [opts.appDirectory] Path to on-disk storage. Primarily
 * used for testing.
 * @param {Winston} [opts.logger] permit user injected logger vs default logger
 * @param {string} [opts.logLevel] npm log levels, e.g. 'verbose', 'error', etc
 * @param {object} [opts.db] coinstac-common dbRegistry service configuration
 * @param {string} [opts.hp] URL configutation for Halfpenny's `baseUrl`
 * @property {DBRegistry} dbRegistry
 * @property {object} dbConfig db registry configuration stashed for late initialization
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
    this.logger = opts.logger || new Logger({ transports: [new Console()] });
    this.appDirectory = opts.appDirectory ||
      CoinstacClient.getDefaultAppDirectory();

    // hack for electron-remote. generate full API, even if it's dead.
    this.computationRegistry = new ComputationRegistry();

    /* istanbul ignore if */
    if (opts.logLevel) {
      this.logger.level = opts.logLevel;
    }
  }

  /**
   * Get a metadata CSV's contents.
   *
   * @param {string} filename Full file path to CSV
   * @returns {Promise<Project>}
   */
  static getCSV(filename) {
    return bluebird.promisify(fs.readFile)(filename)
      .then(data => bluebird.promisify(csvParse)(data.toString()))
      .then(JSON.stringify);
  }

  /**
   * Get the default application storage directory.
   *
   * @returns {string}
   */
  static getDefaultAppDirectory() {
    return path.join(osHomedir(), '.coinstac');
  }

  /**
   * Load a metadata CSV file.
   *
   * @param {string} metaFilePath Path to metadata CSV
   * @param {Array[]} metaFile Metadata CSV's contents
   * @returns {File[]} Collection of files
   */
  static getFilesFromMetadata(metaFilePath, metaFile) {
    return tail(metaFile).map(([filename]) => ({
      filename: path.isAbsolute(filename) ?
        filename :
        path.resolve(path.join(path.dirname(metaFilePath), filename)),
      tags: {},
    }));
  }

  /**
   * Get a JSON schema contents.
   *
   * @param {string} filename Full file path to JSON Schema
   * @returns {Promise<Project>}
   */
  static getJSONSchema(filename) {
    return bluebird.promisify(fs.readFile)(filename)
      .then(data => JSON.parse(data.toString()));
  }
}

module.exports = CoinstacClient;
