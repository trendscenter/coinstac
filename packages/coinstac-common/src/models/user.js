'use strict';

const Base = require('./base.js');
const joi = require('joi');

/**
 * @class User
 * @extends Base
 * @constructor
 * @property {string} username
 * @property {string} email
 * @property {string} password
 * @property {string} institution
 * @property {name} name human readable name, vs username (e.g. handle)
 */
class User extends Base {}

// @ref COINS user db fields
User.schema = Object.assign({
  acctExpDate: joi.any(),
  activeFlag: joi.any(),
  dateAdded: joi.date().allow(null),
  email: joi.string().email().required(),
  emailUnsubscribed: joi.boolean(),
  institution: joi.string(),
  isSiteAdmin: joi.string(),
  label: joi.string(),
  name: joi.string(),
  password: joi.string().min(5),
  passwordExpDate: joi.any(),
  passwordResetExpiration: joi.date().allow(null),
  passwordResetKey: joi.string().allow(null),
  passwordResetSessionId: joi.string().allow(null),
  siteId: joi.any(),
  username: joi.string().min(3).regex(/^[^-]+$/)
    .required(), // no -'s
}, Base.schema);

module.exports = User;
