const pkg = require('../../package.json');

module.exports = [
  {
    method: 'GET',
    path: '/version',
    config: {
      auth: false,
      handler: (_, h) => {
        return h.response(pkg.version);
      },
    },
  },
];
