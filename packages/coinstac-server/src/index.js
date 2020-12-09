/* eslint-disable no-console */
const hapi = require('hapi');
const axios = require('axios');
// set w/ config etc post release
process.LOGLEVEL = 'silly';
const { pullImages } = require('coinstac-manager');
const graphqlSchema = require('coinstac-graphql-schema');
const { program } = require('commander');
const routes = require('./routes');

program.version(require('../package.json').version);

program
  .option('-n, --no-images', 'do not download computation images');
program.parse(process.argv);

let idToken = '';

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
let startup = Promise.resolve();
if (program.noImages) {
  startup = axios.post(
    `${apiServer}/authenticate`,
    {
      username: process.env.SERVER_API_USERNAME,
      password: process.env.SERVER_API_PASSWORD,
    }
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
      console.log('Updating docker images');
      pullStreams.forEach((obj) => {
        if (typeof obj.stream.pipe === 'function') {
          obj.stream.pipe(process.stdout);
        } else {
          process.stdout.write('.');
        }
      });
    })
    .catch(console.log);
}

startup.then(() => routes)
  .then((routes) => {
    server.route(routes);
    server.start((startErr) => {
      if (startErr) throw startErr;
      console.log(`Server running at: ${server.info.uri}`);
    });
  });
