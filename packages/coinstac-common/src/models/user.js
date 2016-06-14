'use strict';

const Base = require('./base.js');
const joi = require('joi');
const util = require('util');

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
function User() {
  Base.apply(this, arguments); // eslint-disable-line
}

// @ref COINS user db fields
User.schema = Object.assign({
  activeFlag: joi.any(),
  acctExpDate: joi.any(),
  email: joi.string().email().required(),
  emailUnsubscribed: joi.boolean(),
  institution: joi.string(),
  isSiteAdmin: joi.string(),
  label: joi.string(),
  name: joi.string(),
  password: joi.string().min(5),
  passwordExpDate: joi.any(),
  siteId: joi.any(),
  username: joi.string().min(3).regex(/^[^-]+$/).required(), // no -'s
}, Base.schema);
util.inherits(User, Base);

module.exports = User;
