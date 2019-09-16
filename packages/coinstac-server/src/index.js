const hapi = require('hapi');
const axios = require('axios');
// set w/ config etc post release
process.LOGLEVEL = 'silly';
const { pullImages } = require('coinstac-docker-manager');
const graphqlSchema = require('coinstac-graphql-schema');
const config = require('./config');
const routes = require('./routes');

let idToken = '';
let dbmap;
try {
  dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path, import/no-unresolved, global-require
} catch (e) {
  console.log('No DBMap found: using defaults'); // eslint-disable-line no-console
  dbmap = {
    rethinkdbServer: {
      user: 'server',
      password: 'password',
    },
  };
}


/**
 * On server start, pull in comps from DB whitelist and download via docker
 * @return {Promise<string>} Success flag
 */
axios.post(
  `${config.apiServer}/authenticate`,
  dbmap.rethinkdbServer
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
    pullStreams.forEach((obj) => {
      if (typeof obj.stream.pipe === 'function') {
        obj.stream.pipe(process.stdout);
      } else {
        console.log(obj); // eslint-disable-line no-console
      }
    });
  })
  .catch(console.log); // eslint-disable-line no-console

const server = new hapi.Server();
server.connection({
  host: config.host,
  port: config.hapiPort,
});
server.route(routes);

server.start((startErr) => {
  if (startErr) throw startErr;
  console.log(`Server running at: ${server.info.uri}`); // eslint-disable-line no-console
});
