const Joi = require('joi');

module.exports = {
  schema: Joi.object().keys({
    meta: Joi.object().keys({
      id: Joi.string().required(),
      description: Joi.string().required(),
      name: Joi.string().required(),
      repository: Joi.string().required(),
      version: Joi.string().required(),
    }).required(),
    computation: Joi.object().keys({
      command: Joi.array()
        .items(Joi.string().required())
        .min(1)
        .required(),
      display: Joi.any().required(),
      dockerImage: Joi.string().required(),
      input: Joi.any().required(),
      output: Joi.any().required(),
      type: Joi.string().required(),
      remote: Joi.object().keys({
        command: Joi.array()
          .items(Joi.string().required())
          .min(1)
          .required(),
        dockerImage: Joi.string().required(),
        type: Joi.string().required(),
      }),
    }).required(),
  }),
};
