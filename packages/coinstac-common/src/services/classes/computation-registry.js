'use strict';

const assign = require('lodash/assign');
const compact = require('lodash/compact');
const concatStream = require('concat-stream');
const DecentralizedComputation =
    require('../../models/decentralized-computation.js');
const followRedirects = require('follow-redirects');
const fs = require('fs');
const GitHubApi = require('github');
const gunzipMaybe = require('gunzip-maybe');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');
const spawn = require('child_process').spawn;
const tail = require('lodash/tail');
const tar = require('tar-fs');
const url = require('url');
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
  return `${name}@${version}`;
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
  return function (registryItem) {
    return (
            registryItem.name === name &&
            registryItem.tags.indexOf(version) !== -1
        );
  };
}

/**
 * Find tarball URL from GitHub API response.
 *
 * The GitHub tag API is poorly documented. Response objects aren’t accurate:
 * {@link https://developer.github.com/v3/git/tags/}
 *
 * {@link http://mikedeboer.github.io/node-github/#repos.prototype.getTags}
 *
 * @todo  The GitHub API paginates tags. This function will need to recursively
 * search pages for the tag. There's no tag count/info, so it's impossible to do
 * a binary search. Figure out something!
 * @private
 * @param {object} options
 * @param {GitHubApi} options.github GitHub API client instance
 * @param {string} options.repo Repository name
 * @param {string} options.user Repository owner
 * @param {string} options.version Tag to find
 * @param {string} [options.page=1] API page to search (1-based index)
 * @param {function} callback
 */
function findTarballUrl(options, callback) {
  const github = options.github;
  const repo = options.repo;
  const user = options.user;
  const version = options.version;
  const page = typeof options.page !== 'undefined' ? options.page : 1;

  github.repos.getTags({
    page,
    per_page: 100,
    repo,
    user,
  }, (err, res) => {
    if (err) { return callback(err); }

    const tag = res.find(t => t.name === 'v' + version);

    // Potentially recurse here
    if (!tag) {
      return callback(new Error(
        `Couldn’t find tag for ${user}/${repo}@${version}`
      ));
    }
    return callback(null, tag.tarball_url); // jshint ignore:line
  });
}

/**
 * Get a computation's tarball URL.
 * @private
 * @param {object} options
 * @param {GitHubApi} options.github GitHub API client instance
 * @param {string} options.name
 * @param {object[]} options.registry
 * @param {string} options.version
 * @returns {Promise}
 */
function getTarballUrl(options) {
  const github = options.github;
  const name = options.name;
  const registry = options.registry;
  const version = options.version;

  const registryItem = registry.find(registryFilter(name, version));

  if (!registryItem) {
    return Promise.reject(new Error(
            `Couldn’t find URL for ${getId(name, version)}`
        ));
  }

    /**
     * @todo  This expects `registryItem.url` to be a GitHub URL. Expand to be
     * more flexible.
     */
  const pathPieces = compact(url.parse(registryItem.url).path.split('/'));

  return new Promise((resolve, reject) => {
    findTarballUrl({
      github,
      repo: pathPieces[1],
      user: pathPieces[0],
      version,
    }, (err, tarballUrl) => {
      if (err) {
        return reject(err);
      }

      return resolve(tarballUrl);
    });
  });
}

/**
 * Run `npm install` on a path.
 * @private
 * @param {string} path
 * @returns {Promise}
 */
function runNPMInstall(path) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['install', '--production'], { cwd: path });

    let error;
    let out;

    child.stderr.pipe(concatStream(data => {
      error = data.toString();
    }));
    child.stdout.pipe(concatStream(data => {
      out = data.toString();
    }));

    child.on('close', exitCode => {
      /* istanbul ignore if */
      if (exitCode) {
        return reject(error);
      }
      return resolve(out);
    });
  });
}

/**
 * Computation registry.
 * @class
 *
 * @example
 * const instance = new ComputationRegistry({
 *   github: new GitHubApi({...}),
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
 * @param {GitHubApi} options.github GitHub API client instance
 * @param {string} options.path Path on disk to cache computations
 * @param {object[]} options.registry Collection of computation registry objects
 */
function ComputationRegistry(options) {
  if (!options.github || !(options.github instanceof GitHubApi)) {
    throw new TypeError('Expected GitHubApi instance');
  }

  if (!options.path) {
    throw new TypeError('Expected path');
  }

  if (!options.registry || !Array.isArray(options.registry)) {
    throw new TypeError('Expected registry of computations');
  }

  this.github = options.github;
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
ComputationRegistry.prototype._doAdd = function ({
  definition, name, url, version,
}) {
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
};

/**
 * Get a computation's path on disk.
 * @private
 * @param {string} name
 * @param {string} version
 * @returns {string}
 */
ComputationRegistry.prototype._getComputationPath = function (name, version) {
  return path.join(this.path, '/' + getId(name, version));
};

/**
 * Get a computation definition from disk.
 * @private
 * @param {string} name
 * @param {string} version
 * @returns {Promise}
 */
ComputationRegistry.prototype._getFromDisk = function (name, version) {
  const computationPath = this._getComputationPath(name, version);

  return new Promise((resolve, reject) => {
    fs.stat(computationPath, (err) => {
      if (err) {
        return reject(err);
      }

      try {
        resolve(require(computationPath));
      } catch (error) {
        reject(error);
      }
      return null;
    });
  });
};

/**
 * Get a computation definition from source (the web).
 *
 * This has a side effect of saving the computation definition to disk.
 * @private
 * @param {string} name
 * @param {string} version
 * @returns {Promise}
 */
ComputationRegistry.prototype._getFromSource = function (name, version) {
  const path = this._getComputationPath(name, version);

  return getTarballUrl({
    github: this.github,
    name,
    registry: this.registry,
    version,
  })
  .then(tarballUrl => {
    return new Promise((resolve, reject) => {
      mkdirp(path, (err) => {
        if (err) {
          reject(err);
        } else {
          const parsedUrl = url.parse(tarballUrl);
          const tarExtract = tar.extract(path, {
            map: header => {
              // Ensure the tarball isn't unpacked into a deep directory
              // TODO: Add test to make sure this is needed
              header.name = tail(header.name.split('/')).join('/');

              return header;
            },
          });

          const wat = followRedirects.https.get({
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            headers: {
              'User-Agent': 'COINSTAC',
            },
            protocol: parsedUrl.protocol,
          }, res => {
            res.pipe(gunzipMaybe()).pipe(tarExtract);
          }).on('error', reject);

          tarExtract.on('error', reject);
          tarExtract.on('finish', resolve);
        }
      });
    });
  })
  .then(() => runNPMInstall(path))
  .then(() => this._getFromDisk(name, version));
};

/**
 * Add a decentralized computation to the store.
 *
 * @param {string} name
 * @param {string} version
 * @returns {Promise}
 */
ComputationRegistry.prototype.add = function (name, version) {
  const registryItem = this.registry.find(registryFilter(name, version));

  function doAdd(definition) {
    return this._doAdd({
      definition,
      name,
      url: registryItem.url,
      version,
    });
  }

  // Check registry to make sure name/version is valid
  if (!registryItem) {
    return Promise.reject(new Error(
      `computation ${getId(name, version)} not in registry`
    ));
  }

  // Check the store to see if computation exists
  return this.get(name, version)

    // Check disk to see if computation is saved
    .catch(() => {
      return this._getFromDisk(name, version).then(doAdd.bind(this));
    })

    // Download computation from source, save to Disk
    .catch(() => {
      return this._getFromSource(name, version).then(doAdd.bind(this));
    });
};

/**
 * Get all decentralized computations from store.
 *
 * @returns {Promise}
 */
ComputationRegistry.prototype.all = function () {
  return Promise.resolve(values(this.store));
};

/**
 * Get a single decentralized computation from store.
 *
 * @param {string} name
 * @param {string} version
 * @returns {Promise} Resolves to `DecentralizedComputation` if match is found
 */
ComputationRegistry.prototype.get = function (name, version) {
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
};

/**
 * Remove a computation.
 *
 * @param {string} name
 * @param {string} version
 * @param {boolean} [fromDisk=false] Remove cached computation from disk
 * @returns {Promise}
 */
ComputationRegistry.prototype.remove = function (name, version, fromDisk) {
  const id = getId(name, version);

  if (!(id in this.store)) {
    return Promise.reject(new Error(
            `Computation ${id} not in registry`
        ));
  }

  delete this.store[id];

  if (!fromDisk) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    rimraf(this._getComputationPath(name, version), (err, res) => {
      if (err) { return reject(err); }
      return resolve(res);
    });
  });
};

// TODO:  improve/test pattern
ComputationRegistry.DIRECTORY_PATTERN = /^([\w-\.]+)@([\w-\.]+)$/;

/**
 * Get a computation's name and version from its directory.
 *
 * @todo  Test it
 * @static
 * @param {string} directory
 * @returns {(array|null)}
 */
ComputationRegistry.getNameAndVersion = function (directory) {
  const matches = directory.match(ComputationRegistry.DIRECTORY_PATTERN);
  if (matches) {
    return [matches[1], matches[2]];
  }
  return null;
};

module.exports = ComputationRegistry;
