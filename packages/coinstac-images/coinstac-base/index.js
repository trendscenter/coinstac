const server = require('./server-ws2');
const serverHttp = require('./server-http');

let inOpts = {};

try {
  inOpts = process.argv[2] ? JSON.parse(process.argv[2]) : {};
} catch (e) {
  // eslint-disable-next-line no-console
  console.log(process.argv);
}

const opts = Object.assign(
  {
    port: 8881,
  },
  inOpts
);
if (opts.server && opts.server === 'http') {
  serverHttp.start(opts)
    .then(() => console.log(`Coinstac HTTP server listening on port ${opts.port}`)); // eslint-disable-line no-console
} else {
  server.start(opts)
    .then(() => console.log(`Coinstac WS server listening on port ${opts.port}`)); // eslint-disable-line no-console
}
