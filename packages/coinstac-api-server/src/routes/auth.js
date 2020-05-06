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
        auth: {
          credentials: {
            email, username, institution, permissions,
          },
        },
      }, res) => {
        res({
          id_token: helperFunctions.createToken(username),
          user: {
            email, username, institution, permissions,
          },
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
];
