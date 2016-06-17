'use strict';

const Base = require('./base.js');
const joi = require('joi');
const util = require('util');

/**
 * @class File
 * @constructor
 * @extends Base
 * @property {string} filename fully qualified path to file
 * @property {number} modified
 * @property {number} size
 * @property {string} sha
 * @property {object} tags @deprecated
 */
function File(attrs) {
  Base.apply(this, arguments); // eslint-disable-line
}

File.schema = Object.assign({
  filename: joi.string().min(4).required(),
  modified: joi.number().required(),
  size: joi.number().required(),
  sha: joi.string().min(15).required(),
  tags: joi.object(),
}, Base.schema);
util.inherits(File, Base);

module.exports = File;
