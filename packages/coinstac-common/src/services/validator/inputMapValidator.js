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
};

function validator(opts, value) {
  return schema[opts.type](opts).validate(value);
}


function inputMapValidator(compSpecInput, fulFilledInputMap) {
  Object.keys(fulFilledInputMap).forEach((key) => {
    const validationResult = validator(compSpecInput[key], fulFilledInputMap[key].value);
    if (validationResult.error) {
      throw validationResult;
    }
  });
  return true;
}


module.exports = inputMapValidator;
