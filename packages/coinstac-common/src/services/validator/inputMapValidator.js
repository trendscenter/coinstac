const Joi = require('joi');
const freesurferRegions = require('../../freesurferRegions');

const schema = {
  number: ({ min, max }) => {
    let schema = Joi.number();
    if (min !== undefined) {
      schema = schema.min(min);
    }
    if (max !== undefined) {
      schema = schema.max(max);
    }
    return schema;
  },
  csv: ({ items }) => {
    const schema = Joi.array().items(Joi.object({
      type: Joi.string().valid(...items),
      name: Joi.string(),
    }));
    return schema;
  },
  freesurfer: () => {
    const schema = Joi.array().items(Joi.object({
      value: Joi.array().items(Joi.string().valid(...freesurferRegions)),
      type: 'FreeSurfer',
    }));
    return schema;
  },
  range: () => {

  },
  set: ({ limit }) => {
    const schema = Joi.array();
    if (limit) {
      schema.length(limit);
    }
    return schema;
  },
  string: () => {
    const schema = Joi.string();
    return schema;
  },
  object: () => {
    const schema = Joi.Object();
    return schema;
  },
  boolean: () => {
    const schema = Joi.boolean();
    return schema;
  },
  select: (values) => {
    const schema = Joi.string().valid(...values);
    return schema;
  },
  files: () => {
    const schema = Joi.string();
    return schema;
  },
  directory: () => {
    const schema = Joi.string();
    return schema;
  },
};

function validator(opts, value) {
  return schema[opts.type](opts).validate(value);
}


function inputMapValidator(compSpecInput, fulFilledInputMap) {
  Object.keys(fulFilledInputMap).forEach((key) => {
    const validationResult = validator(compSpecInput[key], fulFilledInputMap[key].value);
    if (validationResult.error) {
      const message = `${key}: ${validationResult.error.message}`;
      throw message;
    }
  });
  return true;
}


module.exports = inputMapValidator;
