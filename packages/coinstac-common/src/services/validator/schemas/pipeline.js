const Joi = require('joi');

module.exports = {
  schema: Joi.object().keys({
    id: Joi.string(),
    delete: Joi.boolean(),
    description: Joi.string().required(),
    name: Joi.string().required(),
    owningConsortium: Joi.string().required(),
    shared: Joi.boolean(),
    steps: Joi.array().items(
      Joi.object().keys({
        id: Joi.string().required(),
        computations: Joi.array()
          .items(Joi.string().required())
          .min(1).max(1)
          .required(),
        controller: Joi.object().keys({
          id: Joi.string().required(),
          options: Joi.object().keys({
            type: Joi.string(),
          }),
        }).required(),
        ioMap: Joi.any().required(),
      })
    ).min(1).required(),
  }),
};
