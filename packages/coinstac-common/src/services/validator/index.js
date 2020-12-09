const schemas = require('./schemas');

module.exports = {
  validate(object, schemaType) {
    return schemas[schemaType].schema.validate(object);
  },
};
