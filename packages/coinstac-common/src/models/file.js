'use strict';

const Base = require('./base.js');
const joi = require('joi');

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
class File extends Base {}

File.schema = Object.assign({
  filename: joi.string().min(4).required(),
  modified: joi.number().required(),
  size: joi.number().required(),
  sha: joi.string().min(15).required(),
  tags: joi.object(),
}, Base.schema);

module.exports = File;
