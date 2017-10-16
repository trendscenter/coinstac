const hapi = require('hapi');
const { graphiqlHapi, graphqlHapi } = require('apollo-server-hapi');
const jwt2 = require('hapi-auth-jwt2');

const config = require('../config/default');
const dbmap = require('/cstacDBMap');
const schema = require('./data/schema');
const helperFunctions = require('./auth-helpers');

const server = new hapi.Server();
server.connection({
  host: config.host,
  port: config.hapiPort,
});

server.register([
  {
    register: jwt2,
    options: {},
  },
  {
    register: graphiqlHapi,
    options: {
      path: '/graphiql',
      graphiqlOptions: {
        endpointURL: '/graphql',
      },
    },
    route: {
      auth: false,
    },
  },
  {
    register: graphqlHapi,
    options: {
      path: '/graphql',
      graphqlOptions: request => ({
        schema,
        pretty: true,
        graphiql: true,
        rootValue: request,
      }),
      route: {
        cors: true,
      },
    },
  },
], (err) => {
  if (err) {
    console.log(err);
  }

  /**
   * JWT middleware validates token on each /graphql request
   * User object with permissions returned from validateToken function
   */
  server.auth.strategy('jwt', 'jwt',
    {
      key: dbmap.cstacJWTSecret,
      validateFunc: helperFunctions.validateToken,
      verifyOptions: { algorithms: ['HS256'] },
    }
  );

  server.auth.default('jwt');

  server.route([
    {
      method: 'POST',
      path: '/authenticate',
      config: {
        auth: false,
        pre: [
          { method: helperFunctions.validateUser, assign: 'user' },
        ],
        handler: (req, res) => {
          res({
            id_token: helperFunctions.createToken(req.pre.user.id),
            user: req.pre.user,
          }).code(201);
        },
      },
    },
    {
      method: 'POST',
      path: '/authenticateByToken',
      config: {
        auth: 'jwt',
        handler: ({ auth: { credentials: { email, id, institution, permissions } } }, res) => {
          res({
            id_token: helperFunctions.createToken(id),
            user: { email, id, institution, permissions },
          }).code(201);
        },
      },
    },
    {
      method: 'POST',
      path: '/createAccount',
      config: {
        auth: false,
        pre: [
          { method: helperFunctions.validateUniqueUser },
        ],
        handler: (req, res) => {
          const passwordHash = helperFunctions.hashPassword(req.payload.password);
          helperFunctions.createUser(req.payload, passwordHash)
            .then(({ id, institution, email, permissions }) => {
              res({
                id_token: helperFunctions.createToken(id),
                user: { id, institution, email, permissions },
              }).code(201);
            });
        },
      },
    },
  ]);
});

server.start((startErr) => {
  if (startErr) throw startErr;
  console.log(`Server running at: ${server.info.uri}`);
});
