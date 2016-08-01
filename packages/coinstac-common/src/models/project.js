'use strict';

const PouchDocument = require('./pouch-document');
const joi = require('joi');
const util = require('util');

/**
 * @class Project
 * @extends PouchDocument
 * @constructor
 * @property {string} name
 * @property {string=} consortiumId
 * @property {(File[])=} files
 * @property {string=} metaFile Full path to the project's metadata CSV
 */
function Project() {
  PouchDocument.apply(this, arguments); // eslint-disable-line
}

Project.schema = Object.assign({
  name: joi.string().min(1).regex(/[a-zA-Z]+/, 'at least one character').required(),
  consortiumId: joi.string().optional(),
  files: joi.alternatives().try(joi.array()).default([]),
  metaFile: joi.string().min(2).optional(),
}, PouchDocument.schema);
util.inherits(Project, PouchDocument);

module.exports = Project;
