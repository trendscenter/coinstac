const helperFunctions = require('../auth-helpers');
const { eventEmitter, USER_LOGOUT } = require('../data/events');

module.exports = [
  {
    method: 'POST',
    path: '/authenticate',
    config: {
      auth: false,
      pre: [
        { method: helperFunctions.validateUser, assign: 'user' },
      ],
      handler: (req, res) => {
        delete req.pre.user.passwordHash;

        res({
          id_token: helperFunctions.createToken(req.pre.user.username),
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
      handler: ({
        auth: { credentials },
      }, res) => {
        delete credentials.passwordHash;

        res({
          id_token: helperFunctions.createToken(credentials.username),
          user: credentials,
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
        helperFunctions.hashPassword(req.payload.password)
          .then(passwordHash => helperFunctions.createUser(req.payload, passwordHash))
          .then(({
            _id, username, institution, email, permissions,
          }) => {
            res({
              id_token: helperFunctions.createToken(username),
              user: {
                id: _id, username, institution, email, permissions,
              },
            }).code(201);
          });
      },
    },
  },
  {
    method: 'POST',
    path: '/logout',
    config: {
      auth: false,
      handler: (req, res) => {
        eventEmitter.emit(USER_LOGOUT, req.payload.username);

        res().code(200);
      },
    },
  },
];
