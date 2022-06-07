const helperFunctions = require('../auth-helpers');

module.exports = [
  {
    method: 'POST',
    path: '/uploadFile',
    config: {
      auth: false,
      pre: [
        // { method: helperFunctions.validateUser, assign: 'user' },
      ],
      handler: (req, h) => {
        const { payload } = req;
  
        return h.response().code(201);
      },
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
      },
    },
  },
  {
    method: 'POST',
    path: '/downloadFile',
    config: {
      auth: false,
      pre: [
        // { method: helperFunctions.validateUser, assign: 'user' },
      ],
      handler: (req, h) => {

        return h.response().code(201);
      },
    },
  },
];
