const pkg = require('../../package.json');

module.exports = [
  {
    method: 'GET',
    path: '/version',
    config: {
      auth: false,
      handler: (_, res) => {
        return res(pkg.version);
      },
    },
  },
];
