const helperFunctions = require('../auth-helpers');

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
      handler: async (req, res) => {
        const passwordHash = await helperFunctions.hashPassword(req.payload.password);
        const user = await helperFunctions.createUser(req.payload, passwordHash);
        const {
          _id, username, institution, email, permissions,
        } = user;

        res({
          id_token: helperFunctions.createToken(username),
          user: {
            id: _id, username, institution, email, permissions,
          },
        }).code(201);
      },
    },
  },
];
