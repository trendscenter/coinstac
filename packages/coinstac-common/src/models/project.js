'use strict';

const PouchDocument = require('./pouch-document');
const joi = require('joi');

/**
 * @class Project
 * @extends PouchDocument
 * @constructor
 * @property {string} name
 * @property {string=} consortiumId
 * @property {(File[])=} files
 * @property {string=} metaFile Full path to the project's metadata CSV
 */
class Project extends PouchDocument {}

Project.schema = Object.assign({
  name: joi.string().min(1).regex(/[a-zA-Z]+/, 'at least one character')
    .required(),
  consortiumId: joi.string().optional(),
  files: joi.alternatives().try(joi.array()).default([]),
  metaFile: joi.array(),
  metaFilePath: joi.string().min(2).optional(),
  metaCovariateMapping: joi.object().default({}),
}, PouchDocument.schema);

module.exports = Project;
