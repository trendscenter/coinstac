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
        req.pre.user.passwordHash = undefined;

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
      handler: ({
        auth: {
          credentials: {
            email, id, institution, permissions, username, photo, photoID, name,
          },
        },
      }, res) => {
        res({
          id_token: helperFunctions.createToken(id),
          user: {
            email, id, institution, permissions, username, photo, photoID, name,
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
            email, _id, institution, permissions, username, photo, photoID, name,
          }) => {
            res({
              id_token: helperFunctions.createToken(username),
              user: {
                email, _id, institution, permissions, username, photo, photoID, name,
              },
            }).code(201);
          });
      },
    },
  },
  {
    method: 'POST',
    path: '/updateAccount',
    config: {
      auth: false,
      handler: (req, res) => {
        helperFunctions.updateUser(req.payload)
          .then(({
            id, institution, email, photo, photoID, name, permissions,
          }) => {
            res({
              user: {
                id, institution, email, photo, photoID, name, permissions,
              },
            }).code(201);
          });
      },
    },
  },
];
