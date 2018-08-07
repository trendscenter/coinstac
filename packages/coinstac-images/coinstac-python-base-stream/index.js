const server = require('./server');


const opts = {
  port: 3000,
};

server.start(opts)
.then(() => console.log(`Coinstac server listening on port ${opts.port}`)); // eslint-disable-line no-console
