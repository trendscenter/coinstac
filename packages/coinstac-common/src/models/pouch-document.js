'use strict';

const joi = require('joi');
const Base = require('./base.js');

/**
 * @class PouchDocument
 * @extends Base
 * @constructor
 * @property {string} _id
 * @property {string} _rev
 */
class PouchDocument extends Base {}

PouchDocument.schema = Object.assign({
  _id: joi.string().min(2),
  _rev: joi.string().min(3),
}, Base.schema);

module.exports = PouchDocument;
