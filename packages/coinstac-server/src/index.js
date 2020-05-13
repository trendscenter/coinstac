const hapi = require('hapi');
const axios = require('axios');
// set w/ config etc post release
process.LOGLEVEL = 'silly';
const { pullImages } = require('coinstac-docker-manager');
const graphqlSchema = require('coinstac-graphql-schema');
const config = require('./config');
const routes = require('./routes');
const dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path

let idToken = '';

const server = new hapi.Server();
server.connection({
  host: config.host,
  port: config.hapiPort,
});
/**
 * On server start, pull in comps from DB whitelist and download via docker
 * @return {Promise<string>} Success flag
 */
axios.post(
  `${config.apiServer}/authenticate`,
  dbmap.apiCredentials
)
  .then((token) => {
    idToken = token.data.id_token;
    axios.defaults.headers.common.Authorization = `Bearer ${idToken}`;
  })
  .then(() => axios.get(`${config.apiServer}/graphql?query=${graphqlSchema.queries.allDockerImages}`))
  .then(({ data: { data: { fetchAllComputations } } }) => {
    const comps = fetchAllComputations.map(comp => ({
      img: comp.computation.dockerImage,
      compId: comp.id,
      compName: comp.meta.name,
    }));
    return pullImages(comps);
  })
  .then((pullStreams) => {
    console.log('Updating docker images'); // eslint-disable-line no-console
    pullStreams.forEach((obj) => {
      if (typeof obj.stream.pipe === 'function') {
        obj.stream.pipe(process.stdout);
      } else {
        process.stdout.write('.');
      }
    });
  })
  .catch(console.log) // eslint-disable-line no-console
  .then(() => routes)
  .then((routes) => {
    server.route(routes);
    server.start((startErr) => {
      if (startErr) throw startErr;
      console.log(`Server running at: ${server.info.uri}`); // eslint-disable-line no-console
    });
  });
