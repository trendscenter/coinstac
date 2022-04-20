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
  csv: () => {
    const schema = Joi.object();
    return schema;
  },
  freesurfer: () => {
    const schema = Joi.array().items(Joi.object({
      value: Joi.array().items(Joi.string().valid(...freesurferRegions)),
      type: 'FreeSurfer',
    }));
    return schema;
  },
  range: ({ min, max }) => {
    let schema = Joi.number();
    if (min !== undefined) {
      schema = schema.min(min);
    }
    if (max !== undefined) {
      schema = schema.max(max);
    }
    return schema;
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
    const schema = Joi.any();
    return schema;
  },
  boolean: () => {
    const schema = Joi.boolean();
    return schema;
  },
  select: ({ values }) => {
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
  try {
    return schema[opts.type](opts).validate(value);
  } catch (error) {
    console.log(error);
  }
}

const inputMapSchema = () => {
  const schema = Joi.object({
    data: Joi.object({
      value: Joi.array().min(1).required(),
    }).required(),
    covariates: Joi.object({
      value: Joi.array().min(1).required(),
    }).required(),
  }).unknown(true);
  return schema;
};

function inputMapValidator(compSpecInput, inputMap, ownerOnly = false) {
  const result = inputMapSchema().validate(inputMap);
  if (result.error) {
    throw result.error.message;
  }

  Object.keys(inputMap).forEach((key) => {
    if (!ownerOnly || compSpecInput[key].source === 'owner') {
      try {
        const validationResult = validator(compSpecInput[key], inputMap[key].value);
        if (validationResult.error) {
          const message = `${key}: ${validationResult.error.message}`;
          throw message;
        }
      } catch (error) {
        throw error;
      }
    }
  });
}


module.exports = inputMapValidator;
