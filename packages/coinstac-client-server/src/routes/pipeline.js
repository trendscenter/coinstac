/* eslint-disable max-len */

module.exports = [
  {
    method: 'GET',
    path: '/',
    config: {
      handler: (_, res) => {
        res({}).code(200);
      },
    },
  },
];
