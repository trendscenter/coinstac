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
      handler: (req, h) => {
        return h.response({
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
            email, id, institution, permissions,
          },
        },
      }, h) => {
        return h.response({
          id_token: helperFunctions.createToken(id),
          user: {
            email, id, institution, permissions,
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
      handler: async (req, h) => {
        const passwordHash = await helperFunctions.hashPassword(req.payload.password);
        const {
          id,
          institution,
          email,
          permissions,
        } = await helperFunctions.createUser(req.payload, passwordHash);

        return h.response({
          id_token: helperFunctions.createToken(id),
          user: {
            id, institution, email, permissions,
          },
        }).code(201);
      },
    },
  },
];
