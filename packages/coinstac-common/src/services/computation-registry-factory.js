'use strict';

const ComputationRegistry = require('./classes/computation-registry.js');
const DBRegistry = require('./classes/db-registry');
const defaultRegistry = require('../decentralized-computations.json');
const GitHubApi = require('github');

/**
 * Computation registry factory.
 * @module services/computation-registry-factory
 * @description Get a properly configured `ComputationRegistry` class.
 * @example <caption>Remote configuration</caption>
 * computationRegistryFactory({
 *   path: 'path/to/computations',
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
 *   path: 'path/to/computations',
 * });
 * // => Promise that resolves to ComputationRegistry instance
 *
 * @param {object} options
 * @param {string} options.path Configure's the instance's path.
 * @param {object[]} options.registry Collection of registered computations (see
 * example for formatting)
 * @param {DbRegistry} [options.dbRegistry] Reference to a `DbRegistry`
 * instance. This is only necessary if `options.isLocal` is true.
 * @param {boolean} [options.isLocal=false] Configures instance for local
 * (client) use by setting the instance's path. Override the path by setting
 * `options.path`.
 * @returns {Promise} Resolves to ComputationRegistry instance
 */
function computationRegistryFactory(options) {
  const localOptions = options || {};
  const computationsPath = localOptions.path;
  const isLocal = localOptions.isLocal;
  const dbRegistry = localOptions.dbRegistry;
  let registry;

  if (!computationsPath) {
    return Promise.reject(new Error('Computation registry requires a path'));
  } else if (isLocal && (!dbRegistry || !(dbRegistry instanceof DBRegistry))) {
    return Promise.reject(
      new Error('Computation registry requires DB registry')
    );
  }

  if (localOptions.registry) {
    registry = localOptions.registry;
  } else if (isLocal) {
    registry = [];
  } else {
    registry = defaultRegistry;
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

  const instance = new ComputationRegistry({
    github,
    path: computationsPath,
    registry,
  });

  /**
   * Decorate `ComputationRegistry#all` for the local environment.
   *
   * This ensures that 'local' clients always have an internal registry that is
   * always in sync with the 'computations' database.
   */
  if (isLocal) {
    const computationsDb = dbRegistry.get('computations');

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
                  `Couldn’t find “${name}@${version}” in computations database`
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

  // In a remote environment. Load all the computations.
  return Promise.all(instance.registry.reduce((memo, { name, tags }) => {
    return memo.concat(tags.map(tag => instance.add(name, tag)));
  }, []))
    .then(() => instance);
}

computationRegistryFactory.ComputationRegistry = ComputationRegistry;

module.exports = computationRegistryFactory;
