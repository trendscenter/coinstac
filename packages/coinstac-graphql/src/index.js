const hapi = require('hapi');
const { graphiqlHapi, graphqlHapi } = require('apollo-server-hapi');
const jwt = require('jsonwebtoken');
const jwt2 = require('hapi-auth-jwt2');
const Boom = require('boom');
const rethink = require('rethinkdb');
const schema = require('./data/schema');

const secret = `SFcCAGze1vu7JKVnKqnAa0eZYlobluLs1kPBUYuH76sIfrqGrBUYSDOYGgtRdKees
U13i80HOA1XBVF4D8LqqhckZoaGQ/9oL/wY+QzHvFW8J4/OMLotnQBdbsiM8Xti7oWBKuo2gqGbs/NWPP
5avmjjPEMNzJxuKHnkEBdEjyyDREVR2I6HQ3E5kITXRBDgiCvNkxKJkKhzLjidf7F2O40PW6hSRo39rxn
zwbKmqOgcguIlGlJmF968BjmLEO1wY13QDhOiqhCf2DyTanZbZvl+VVOfMQzVF8I53WaWWO8RycjzSNX7
LvdRWliopk1LM92loKgntrmJ+UGHJziuiA==`;

const server = new hapi.Server();
server.connection({
  host: 'localhost',
  port: 3100,
});

const getUserDetails = (credentials) => {
  return rethink.connect({
    host: 'localhost',
    port: 28015,
    db: 'rethinkdb',
    user: 'admin',
    password: 'admin',
  })
  .then(connection => rethink.table('permissions').filter((perm) => {
    return perm('id').contains(credentials.username);
  }).pluck('table', 'permissions').run(connection))
  .then(cursor => cursor.toArray())
  .then(result => ({ isValid: true, tables: result }))
  .catch(err => ({ failure: err.name }));
};

const validateUser = (req, res) => {
  getUserDetails(req.payload)
  .then((connect) => {
    if (connect.isValid) {
      res(Object.assign({}, { tables: connect.tables }, { username: req.payload.username }));
    } else if (connect.failure === 'ReqlPermissionError') {
      res(Boom.badRequest('Invalid user permissions'));
    } else { // ReqlAuthError
      res(Boom.badRequest('Invalid user credentials'));
    }
  });
};

const validateToken = (decoded, request, callback) => {
  getUserDetails({ username: decoded.username })
  .then((response) => {
    if (response.isValid) {
      callback(
        null,
        true,
        Object.assign({}, { tables: response.tables }, { username: decoded.username })
      );
    } else {
      callback(Boom.badRequest('Invalid Token'), false);
    }
  })
  .catch((err) => {
    callback(err, false);
  });
};

function createToken(user) {
  return jwt.sign({ username: user }, secret, { algorithm: 'HS256', expiresIn: '1h' });
}

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

  server.auth.strategy('jwt', 'jwt',
    {
      key: secret,
      validateFunc: validateToken,
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
          { method: validateUser, assign: 'user' },
        ],
        handler: (req, res) => {
          res({ id_token: createToken(req.pre.user.username), user: req.pre.user }).code(201);
        },
      },
    },
  ]);
});

server.start((startErr) => {
  if (startErr) throw startErr;
  console.log(`Server running at: ${server.info.uri}`);
});
