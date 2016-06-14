'use strict';
const ComputationRegistry = require('./classes/computation-registry.js');
const DBRegistry = require('./classes/db-registry');
const defaultRegistry = require('../decentralized-computations.json');
const fs = require('fs');
const os = require('os');
const GitHubApi = require('github');
const path = require('path');

/**
 * Computation registry factory.
 * @module services/computation-registry-factory
 * @description Get a properly configured `ComputationRegistry` class.
 * @example <caption>Remote configuration</caption>
 * computationRegistryFactory({
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
 * // => Promise that resolves to ComputationRegistry instance
 */

/**
 *
 * @example <caption>Local configuration</caption>
 * // Configure your app-wide DBRegistry instance:
 * const myDbRegistry = dbRegistry({
 *   isLocal: true,
 *   path: 'path/to/leveldown/dir/',
 *   remote: {
 *     db: 'http://localhost:5984',
 *   },
 * });
 *
 * // Pass it to the factory
 * computationRegistryFactory({
 *   dbRegistry: myDbRegistry,
 *   isLocal: true,
 * });
 * // => Promise that resolves to ComputationRegistry instance
 *
 * @param {object} options
 * @param {object[]} options.registry Collection of registered computations (see
 * example for formatting)
 * @param {boolean} [options.isLocal=false] Configures instance for local
 * (client) use by setting the instance's path. Override the path by setting
 * `options.path`.
 * @param {string} [options.path] Configure's the instance's path. This
 * overrides `options.isLocal`.
 * @param {boolean} [options.scanDisk=false] Scan for computations cached on the
 * file system and add them to the registry.
 * @param {DbRegistry} [options.dbRegistry] Reference to a `DbRegistry`
 * instance. This is only necessary if `options.isLocal` is true.
 * @returns {Promise} Resolves to ComputationRegistry instance
 */
function computationRegistryFactory(options) {
  if (typeof options === 'undefined') {
    options = {};
  }

    /**
    * Configure GitHub client.
    * {@link https://github.com/mikedeboer/node-github#example}
    */
  const github = new GitHubApi({
    headers: {
      'user-agent': 'COINSTAC',
    },
    host: 'api.github.com',
    protocol: 'https',
    timeout: 8000,
    version: '3.0.0',
  });

  let computationsPath;
  let registry;

  if (options.isLocal) {
    computationsPath = path.join(os.homedir(), '.coinstac', 'computations');
    registry = [];
  } else {
    computationsPath = path.join(__dirname, '..', '..', 'computations');
    registry = defaultRegistry;
  }

    // Override environment path-setting
  if (options.path) {
    computationsPath = options.path;
  }

    // Override environment registry-setting
  if (options.registry) {
    registry = options.registry;
  }

  const instance = new ComputationRegistry({
    github,
    path: computationsPath,
    registry,
  });

    /**
     * Decorate `ComputationRegistry#all` for the local environment.
     *
     * This ensures that 'local' clients always have an internal registry that
     * is always in sync with the 'computations' database.
     */
  if (options.isLocal) {
    if (
            !options.dbRegistry ||
            !(options.dbRegistry instanceof DBRegistry)
        ) {
      throw new TypeError('Requires a DBRegistry instance');
    }

    const computationsDb = options.dbRegistry.get('computations');

    instance.add = function _add(name, version) {
      return instance.get(name, version)
        .catch(() => {
            /**
             * `ComputationRegistry#get` rejects when it can’t find a
             * match for 'name' and 'version'. Use Pouchy's built-in
             * `find` to hit the 'computations' database for the doc.
             *
             * {@link https://github.com/nolanlawson/pouchdb-find}
             */
          return computationsDb.find({
            fields: ['name', 'version', 'url'],
            selector: { name, version },
          })
          .then(response => {
            let i;
            let il;
            const docs = response.docs;

            if (!docs || !docs.length) {
              throw new Error(
                      `Couldn’t find “${name}@${version}” in
                      computations database`
                  );
            }

              /**
               * Mutate the internal registry. If an item with
               * `name` already exists, add `version` to its
               * `tags` collection:
               */
            for (
                  i = 0, il = instance.registry.length;
                  i < il;
                  i++
              ) {
              if (instance.registry[i].name === name) {
                instance.registry[i].tags.push(version);
                return;
              }
            }

              // Otherwise, make a new item:
            instance.registry.push({
              name,
              tags: [version],
              url: docs[0].url,
            });
          });
        })
        .then(() => ComputationRegistry.prototype.add.call(instance, name, version));
    };
  }

  if (!options.scanDisk) {
    return Promise.resolve(instance);
  }

  return new Promise((resolve, reject) => {
    fs.readdir(computationsPath, (err, files) => {
      if (err) {
        return reject(err);
      }

      resolve(files.filter(f => {
        return ComputationRegistry.DIRECTORY_PATTERN.test(f);
      }));
    });
  })
        .then(directories => Promise.all(directories.map(directory => {
          const nameAndVersion =
                ComputationRegistry.getNameAndVersion(directory);
          const name = nameAndVersion[0];
          const version = nameAndVersion[1];

          return instance._getFromDisk(name, version)
                .then(definition => instance._doAdd(name, version, definition));
        })))
        .then(() => instance);
}

module.exports = computationRegistryFactory;
