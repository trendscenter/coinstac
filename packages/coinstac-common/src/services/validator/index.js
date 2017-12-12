const Joi = require('joi');
const schemas = require('./schemas');

module.exports = {
  validate(object, schemaType) {
    return Joi.validate(object, schemas[schemaType].schema);
  },
};
