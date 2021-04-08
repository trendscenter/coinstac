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
    path: '/authenticateWithApiKey',
    config: {
      auth: false,
      pre: [
        { method: helperFunctions.validateHeadlessClientApiKey, assign: 'headlessClient' },
      ],
      handler: (req, res) => {
        req.pre.headlessClient.apiKey = undefined;

        res({
          authToken: helperFunctions.createToken(req.pre.headlessClient.id),
          client: req.pre.headlessClient,
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
  {
    method: 'POST',
    path: '/updateAccount',
    config: {
      auth: false,
      handler: async (req, res) => {
        const user = await helperFunctions.updateUser(req.payload);
        const {
          id, institution, email, photo, photoID, name, username, permissions,
        } = user;

        res({
          user: {
            id, institution, email, photo, photoID, name, username, permissions,
          },
        }).code(201);
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
  {
    method: 'POST',
    path: '/sendPasswordResetEmail',
    config: {
      auth: false,
      pre: [{ method: helperFunctions.validateEmail }],
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
      pre: [{ method: helperFunctions.validateResetToken }],
      handler: (req, res) => {
        helperFunctions
          .resetPassword(req.payload.token, req.payload.password)
          .then(() => res().code(204));
      },
    },
  },
];
