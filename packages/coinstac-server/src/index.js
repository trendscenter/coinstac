const hapi = require('hapi');
const axios = require('axios');
// set w/ config etc post release
process.LOGLEVEL = 'silly';
const { pullImages } = require('coinstac-docker-manager');
const graphqlSchema = require('coinstac-graphql-schema');
const routes = require('./routes');

let idToken = '';
let dbmap;
try {
  dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path, import/no-unresolved, global-require
} catch (e) {
  console.log('No DBMap found: using defaults'); // eslint-disable-line no-console
  dbmap = {
    apiCredentials: {
      username: 'server',
      password: 'password',
    },
  };
}

const server = new hapi.Server();
server.connection({
  host: process.env.PIPELINE_SERVER_HOSTNAME,
  port: process.env.PIPELINE_SERVER_PORT,
});
const apiServer = `http://${process.env.API_SERVER_HOSTNAME}:${process.env.API_SERVER_PORT}`;
/**
 * On server start, pull in comps from DB whitelist and download via docker
 * @return {Promise<string>} Success flag
 */
axios.post(
  `${apiServer}/authenticate`,
  dbmap.apiCredentials
)
  .then((token) => {
    idToken = token.data.id_token;
    axios.defaults.headers.common.Authorization = `Bearer ${idToken}`;
  })
  .then(() => axios.get(`${apiServer}/graphql?query=${graphqlSchema.queries.allDockerImages}`))
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
