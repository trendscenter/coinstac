const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);

const port = process.argv[2];

server.on('client', (client) => {
  console.log('Aedes client connected', client.id); // eslint-disable-line no-console
});

server.listen(port, (e) => {
  process.send({ error: e, started: true });
});
