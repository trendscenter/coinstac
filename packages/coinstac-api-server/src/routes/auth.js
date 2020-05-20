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
    path: '/sendPasswordResetEmail',
    config: {
      auth: false,
      pre: [
        { method: helperFunctions.validateEmail },
      ],
      handler: (req, res) => {
        helperFunctions
          .savePasswordResetToken(req.payload.email)
          .then(() => res().code(204))
          .catch(() => res().code(400));
      },
    },
  },
  {
    method: 'POST',
    path: '/resetPassword',
    config: {
      auth: false,
      pre: [
        { method: helperFunctions.validateResetToken },
      ],
      handler: (req, res) => {
        helperFunctions
          .resetPassword(req.payload.token, req.payload.password)
          .then(() => res().code(204));
      },
    },
  },
];
