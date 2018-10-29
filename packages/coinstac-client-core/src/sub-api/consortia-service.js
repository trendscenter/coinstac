'use strict';

/**
 * @module consortia-service
 */
const { models: { Consortium } } = require('coinstac-common');
const uuid = require('uuid');
const toArray = require('lodash/toArray');

const ModelService = require('../model-service');

class ConsortiaService extends ModelService {
  constructor(opts) {
    super(opts);
    this.auth = opts.client.auth;
    /* istanbul ignore next */
    if (!this.auth) {
      throw new ReferenceError('auth instance');
    }
  }

  modelServiceHooks() { // eslint-disable-line class-methods-use-this
    return {
      dbName: 'consortia',
      ModelType: Consortium,
    };
  }

  /**
   * Get a consortium's active run ID.
   *
   * @param {string} consortiumId
   * @returns {Promise} Resolves to the run ID string
   */
  getActiveRunId(consortiumId) {
    return this.client.dbRegistry.get(`remote-consortium-${consortiumId}`)
      .find({
        selector: {
          complete: false,
        },
      })
      .then((docs) => {
        return docs.length ? docs[0]._id : undefined;
      });
  }

  /**
   * Get consortia that a user has joined.
   *
   * @param  {string}  username
   * @returns {Promise}
   */
  getUserConsortia(username) {
    /* istanbul ignore if */
    if (typeof username !== 'string') {
      throw new TypeError('expected string username');
    }
    return this.all()
    .then((consortia) => { // eslint-disable-line
      return consortia.filter((consortium) => { // eslint-disable-line
        // users is arr of [ usernames ]. :/
          return consortium.users.some(uname => (uname === username));
        });
      });
  }

  /**
   * proxy ModelService.save call and assert valid consortium `_id`s are added
   * @see ModelService.save
   */
  save() {
    const args = toArray(arguments); // eslint-disable-line
    const tium = args[0];
    if (!tium._id) {
      tium._id = uuid.v4().replace(/-/ig, '');
    }
    return ModelService.prototype.save.apply(this, args);
  }
}

module.exports = ConsortiaService;
