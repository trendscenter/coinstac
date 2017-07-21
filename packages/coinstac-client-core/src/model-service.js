'use strict';

const common = require('coinstac-common');
const find = require('lodash/find');
const matchesProperty = require('lodash/matchesProperty');

const getSyncedDatabase = common.utils.getSyncedDatabase;

/**
 * @abstract
 * @property {DBRegistry} this.dbs
 * @property {Pouchy} this.db
 * @property {Function} this.ModelType
 */
class ModelService {

  /**
   * model-service base class. abstracts common model methods
   * @param {object} opts
   * @param {DBRegistry} opts.dbRegistry
   * @param {CoinstacClient} opts.client
   */
  constructor(opts) {
    if (!opts) { throw new TypeError('ModelService requires options, with dbRegistry'); }
    /* istanbul ignore if */
    if (!opts.dbRegistry) {
      throw new ReferenceError('ModelService dbRegistry missing');
    }
    this.dbRegistry = opts.dbRegistry;
    this.dbs = opts.dbRegistry;

    /* istanbul ignore if */
    if (!opts.client) {
      throw new ReferenceError('ModelService CoinstacClient missing');
    }
    this.client = opts.client;

    /* istanbul ignore if */
    if (!(this.modelServiceHooks instanceof Function)) {
      throw new Error('expected modelServiceHooks method on child');
    }

    const hooks = this.modelServiceHooks();

    /* istanbul ignore if */
    if (!hooks.ModelType || !(hooks.ModelType instanceof Function)) {
      throw new TypeError('modelServiceHooks must provide valid ModelType');
    }

    /* istanbul ignore if */
    if (!hooks.dbName) {
      throw new TypeError('modelServiceHooks must provide valid db name');
    }

    Object.assign(this, hooks);

    this.ModelType = hooks.ModelType;
    this.dbInstance = null;
  }


  /**
   * @private
   * lazy `getting` of db is important to prevent Pouchy generation pre-access,
   * specfically pre-auth. otherwise, syncing may occur before auth headers set.
   * this is OK for some stores, but taboo for others.
   *
   * @returns {Promise}
   */
  getDbInstance() {
    if (this.dbInstance) {
      return Promise.resolve(this.dbInstance);
    }
    return getSyncedDatabase(this.dbs, this.dbName)
      .then((pouchy) => {
        this.dbInstance = pouchy;

        return this.dbInstance;
      });
  }

  /**
   * @abstract
   */
  modelServiceHooks() { // eslint-disable-line class-methods-use-this
    /* istanbul ignore next */
    throw new Error('child classes must extend modelServiceHooks');
  }

  /**
   * fetch all models (raw)
   * @returns {Promise}
   */
  all() {
    return this.getDbInstance().then(db => db.all());
  }

  /**
   * delete/remote a doc/model
   * @param {object} model must at least have an _id and _rev
   * @returns {Promise}
   */
  delete(model) {
    return this.getDbInstance().then(db => db.delete(model));
  }

  /**
   * get a doc.
   * @param {string} id
   * @returns {Promise}
   */
  get(id) {
    return this.getDbInstance().then(db => db.get(id));
  }

  /**
   * fetch consortia and return the first matching consortium where the
   * provided field has the provided val
   * @param {string} field
   * @param {string} val
   * @returns {Promise}
   */
  getBy(field, val) {
    return this.getDbInstance()
      .then(db => db.all())
      .then(docs => find(docs, matchesProperty(field, val)));
  }

  /**
   * saves a raw to its store.
   * @param {object} rawModel
   * @returns {Promise} resolves to db doc
   */
  save(rawModel) {
    try {
      const modelInstance = new this.ModelType(rawModel);

      return this.getDbInstance()
        .then(db => db.save(modelInstance.serialize()));
    } catch (err) {
      /* istanbul ignore next */
      return Promise.reject(err);
    }
  }

  /**
   * Validate model.
   *
   * {@link https://github.com/hapijs/joi#usage}
   *
   * @param {Object} properties Key-value pairs to validate against the model
   * @param {boolean} [onlyFields=true] Only validate fields present in
   * `properties`
   * @returns {Promise} Resolves to Joi's validated model if valid or rejects
   * with Joi's error if invalid.
   */
  validate(properties, onlyFields) {
    const localOnlyFields = typeof onlyFields === 'boolean' ? onlyFields : true;
    const Model = this.modelServiceHooks().ModelType;

    if (typeof properties === 'undefined' || !(properties instanceof Object)) {
      return Promise.reject(new Error('Expected properties to be an object'));
    }

    try {
      const value = Model.prototype._validate.call(null, properties, {
        fields: localOnlyFields,
        schema: Model.schema,
      });
      return Promise.resolve(value);
    } catch (error) {
      return Promise.reject(error);
    }
  }

}

module.exports = ModelService;
