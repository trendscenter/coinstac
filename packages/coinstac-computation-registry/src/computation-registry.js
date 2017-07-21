'use strict';

const DecentralizedComputation =
  require('coinstac-common').models.DecentralizedComputation;
const helpers = require('./helpers.js');
const path = require('path');
const values = require('lodash/values');

const DELIMITER = '--';

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
 * @param {object[]} options.registry Collection of computation registry objects
 */
class ComputationRegistry {
  constructor(options) {
    if (!options.registry || !Array.isArray(options.registry)) {
      throw new TypeError('Expected registry of computations');
    }

    this.registry = options.registry;
    this.store = {};
  }

  /**
   * Actually add a computation to the store.
   * @private
   * @param {Object} options
   * @param {string} options.cwd
   * @param {object} options.definition Raw computation definition
   * @param {Object} options.meta Computation's metadata
   * @param {string} options.name
   * @param {string} options.url
   * @param {string} options.version
   * @returns {Promise} Resolves to `DecentralizedComputation` if match is found
   */
  _doAdd({ cwd, definition, name, meta, url, version }) {
    const model = new DecentralizedComputation(Object.assign(
      {
        cwd,
        meta,
        repository: { url },
      },
      definition
    ));

    this.store[ComputationRegistry.getId(name, version)] = model;

    return this.get(name, version);
  }

  /**
   * Get a computation definition from disk.
   * @private
   * @param {string} name
   * @param {string} version
   * @returns {Promise<Object>} Resolves to an object containing computation
   * definition and computation meta
   */
  static _getFromDisk(name) {
    return new Promise((resolve, reject) => {
      try {
        /* eslint-disable global-require, import/no-dynamic-require */
        resolve(require(name));
        /* eslint-enable global-require, import/no-dynamic-require */
      } catch (error) {
        reject(error);
      }
    })
      .then(definition => Promise.all([
        definition,
        helpers.getPackage(path.dirname(require.resolve(name))),
      ]))
      .then(
        ([
          definition,
          { coinstac: meta },
        ]) => ({
          definition,
          meta,
        })
      );
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
        `computation ${ComputationRegistry.getId(name, version)} not in registry`
      ));
    }

    // Check the store to see if computation exists
    return this.get(name, version)

      // Check disk to see if computation is saved
      .catch(() => ComputationRegistry._getFromDisk(name, version)
        .then(({ definition, meta }) => this._doAdd({
          cwd: ComputationRegistry.getComputationCwd(name, version),
          definition,
          meta,
          name,
          url: registryItem.url,
          version,
        })
      ));
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

    const id = ComputationRegistry.getId(name, version);

    if (!(id in this.store)) {
      return Promise.reject(new Error(
        `computation ${ComputationRegistry.getId(name, version)} not in registry`
      ));
    }

    return Promise.resolve(this.store[id]);
  }

  /**
   * Get a computation's path on disk.
   * @private
   * @static
   * @param {string} name
   * @param {string} version
   * @returns {string}
   */
  static getComputationCwd(name) {
    /**
     * @todo It's impossible to stub `require.resolve` or Node.js's module
     * internals. Determine better way to test.
     */
    /* istanbul ignore next */
    return path.dirname(require.resolve(name));
  }

  /**
   * Get a computation ID from its name and version.
   * @private
   *
   * @private
   * @param {string} name
   * @param {string} version
   * @returns {string}
   */
  static getId(name, version) {
    return `${name}${DELIMITER}${version}`;
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

ComputationRegistry.DIRECTORY_PATTERN = new RegExp(
  `^([\\w-\\.]+)${DELIMITER}([\\w-\\.]+)$`
);

module.exports = ComputationRegistry;
