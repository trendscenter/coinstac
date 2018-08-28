const server = require('./server');

const opts = {
  port: 8881,
  level: process.argv[2],
};

server.start(opts)
.then(() => console.log(`Coinstac server listening on port ${opts.port}`)); // eslint-disable-line no-console
