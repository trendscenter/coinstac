'use strict';
const Base = require('./base.js');
const joi = require('joi');
const util = require('util');

/**
 * @class PouchDocument
 * @extends Base
 * @constructor
 * @property {string} _id
 * @property {string} _rev
 */
function PouchDocument() {
  Base.apply(this, arguments);
}

util.inherits(PouchDocument, Base);
PouchDocument.schema = Object.assign({
  _id: joi.string().min(2),
  _rev: joi.string().min(3),
}, Base.schema);

module.exports = PouchDocument;
