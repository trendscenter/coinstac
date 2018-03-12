const pkg = require('../../package.json');

module.exports = [
  {
    method: 'GET',
    path: '/version',
    config: {
      auth: false,
      handler: (req, reply) => {
        return reply(pkg.version);
      },
    },
  },
];
