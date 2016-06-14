'use strict';

const PouchDocument = require('./pouch-document');
const joi = require('joi');
const util = require('util');

/**
 * @class Project
 * @extends PouchDocument
 * @constructor
 * @property {string} name
 * @property {string=} defaultConsortiumId
 * @property {(File[])=} files
 */
function Project() {
  PouchDocument.apply(this, arguments); // eslint-disable-line
}

Project.schema = Object.assign({
  name: joi.string().min(1).regex(/[a-zA-Z]+/, 'at least one character').required(),
  defaultConsortiumId: joi.string().optional(),
  files: joi.alternatives().try(joi.array()).default([]),
}, PouchDocument.schema);
util.inherits(Project, PouchDocument);

module.exports = Project;
