'use strict';

const assign = require('lodash/assign');
const DecentralizedComputation =
    require('../../models/decentralized-computation.js');
const fs = require('fs');
const path = require('path');
const values = require('lodash/values');

/**
 * Get a computation ID from its name and version.
 *
 * @private
 * @param {string} name
 * @param {string} version
 * @returns {string}
 */
function getId(name, version) {
  return `${name}--${version}`;
}

/**
 * Get a registry filter function.
 *
 * @private
 * @param {string} name
 * @param {string} version
 * @returns {function}
 */
function registryFilter(name, version) {
  return function registryFilterer(registryItem) {
    return (
      registryItem.name === name &&
      registryItem.tags.indexOf(version) !== -1
    );
  };
}

/**
 * Computation registry.
 * @class
 *
 * @example
 * const instance = new ComputationRegistry({
 *   path: path.join(__dirname, 'computations'),
 *   registry: [{
 *     name: 'my-computation',
 *     tags: ['1.0.0'],
 *     url: 'https://github.com/MRN-Code/coinstac-my-computation',
 *   }, {
 *     name: 'my-other-computation',
 *     tags: ['0.5.1', '0.6.0'],
 *     url: 'https://github.com/MRN-Code/coinstac-my-other-computation',
 *   }],
 * });
 *
 * @param {object} options
 * @param {string} options.path Path on disk to cache computations
 * @param {object[]} options.registry Collection of computation registry objects
 */
class ComputationRegistry {
  constructor(options) {
    if (!options.path) {
      throw new TypeError('Expected path');
    }

    if (!options.registry || !Array.isArray(options.registry)) {
      throw new TypeError('Expected registry of computations');
    }

    this.path = options.path;
    this.registry = options.registry;
    this.store = {};
  }

  /**
   * Actually add a computation to the store.
   * @private
   * @param {Object} options
   * @param {object} option.definition Raw computation definition
   * @param {string} options.name
   * @param {string} options.url
   * @param {string} options.version
   * @returns {Promise} Resolves to `DecentralizedComputation` if match is found
   */
  _doAdd({ definition, name, url, version }) {
    const model = new DecentralizedComputation(assign(
      {},
      {
        cwd: this._getComputationPath(name, version),
        repository: { url },
      },
      definition
    ));

    this.store[getId(name, version)] = model;

    return this.get(name, version);
  }

  /**
   * Get a computation's path on disk.
   * @private
   * @param {string} name
   * @param {string} version
   * @returns {string}
   */
  _getComputationPath(name, version) {
    return path.join(this.path, `/${getId(name, version)}`);
  }

  /**
   * Get a computation definition from disk.
   * @private
   * @param {string} name
   * @param {string} version
   * @returns {Promise} Resolves to computation definition
   */
  _getFromDisk(name, version) {
    const computationPath = this._getComputationPath(name, version);

    return new Promise((resolve, reject) => {
      fs.stat(computationPath, (err) => {
        if (err) {
          return reject(err);
        }

        try {
          resolve(require(computationPath)); // eslint-disable-line global-require
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Add a decentralized computation to the store.
   *
   * @param {string} name
   * @param {string} version
   * @returns {Promise}
   */
  add(name, version) {
    const registryItem = this.registry.find(registryFilter(name, version));

    // Check registry to make sure name/version is valid
    if (!registryItem) {
      return Promise.reject(new Error(
        `computation ${getId(name, version)} not in registry`
      ));
    }

    // Check the store to see if computation exists
    return this.get(name, version)

      // Check disk to see if computation is saved
      .catch(() => this._getFromDisk(name, version))
      .then(definition => this._doAdd({
        definition,
        name,
        url: registryItem.url,
        version,
      }));
  }

  /**
   * Get all decentralized computations from store.
   *
   * @returns {Promise}
   */
  all() {
    return Promise.resolve(values(this.store));
  }

  /**
   * Get a single decentralized computation from store.
   *
   * @param {string} name
   * @param {string} version
   * @returns {Promise} Resolves to `DecentralizedComputation` if match is found
   */
  get(name, version) {
    if (!name || !version) {
      return Promise.reject(new TypeError('expected name and version'));
    }

    const id = getId(name, version);

    if (!(id in this.store)) {
      return Promise.reject(new Error(
              `computation ${getId(name, version)} not in registry`
          ));
    }

    return Promise.resolve(this.store[id]);
  }

  /**
   * Get a computation's name and version from its directory.
   *
   * @todo  Test it
   * @static
   * @param {string} directory
   * @returns {(array|null)}
   */
  static getNameAndVersion(directory) {
    const matches = directory.match(ComputationRegistry.DIRECTORY_PATTERN);
    if (matches) {
      return [matches[1], matches[2]];
    }
    return null;
  }
}

ComputationRegistry.DIRECTORY_PATTERN = /^([\w-\.]+)--([\w-\.]+)$/;

module.exports = ComputationRegistry;
