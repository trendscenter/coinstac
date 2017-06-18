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
  name: joi.string().min(1).regex(/[a-zA-Z0-9]+/, 'at least one character')
    .required(),

  /**
   * A project's consortium's `activeComputationInputs` are stashed on the
   * `computationInputs` property to ensure the user properly configures the
   * project for the computation run. coinstac-client-core compares the
   * consortium's computation inputs to the project's prior to run and throws
   * when they don't match.
   *
   * @todo Find better method for guaranteeing project-to-computation input
   * alignment.
   *
   * {@link https://github.com/MRN-Code/coinstac/issues/151}
   */
  computationInputs: joi.array().default([]),
  consortiumId: joi.string().optional(),
  files: joi.alternatives().try(joi.array()).default([]),
  metaFile: joi.array(),
  metaFilePath: joi.string().min(2).optional(),
  metaCovariateMapping: joi.object().default({}),
}, PouchDocument.schema);

module.exports = Project;
