const crypto = require('crypto');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const rethink = require('rethinkdb');
const config = require('../config/default');
const dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path
const Promise = require('bluebird');

const helperFunctions = {
  /**
   * Create JWT for user signing in to application
   * @param {string} user username of authenticating user passed in from route handler
   * @return {string} A JWT for the requested user
   */
  createToken(user) {
    return jwt.sign({ username: user }, dbmap.cstacJWTSecret, { algorithm: 'HS256', expiresIn: '12h' });
  },
  /**
   * Create new user account
   * @param {string} user authenticating user's username
   * @param {string} passwordHash string of hashed password
   * @return {object} The updated user object
   */
  createUser(user, passwordHash) {
    return helperFunctions.getRethinkConnection()
    .then((connection) => {
      const userDetails = {
        id: user.username,
        email: user.email,
        institution: user.institution,
        passwordHash,
        permissions: {
          computations: {},
          consortia: {},
          pipelines: {},
        },
      };

      if (user.permissions) {
        userDetails.permissions = user.permissions;
      }

      return rethink.table('users')
        .insert(userDetails, { returnChanges: true })
        .run(connection);
    })
    .then(result => result.changes[0].new_val);
  },
  /**
   * Returns RethinkDB connection
   * @return {object} A connection to RethinkDB
   */
  getRethinkConnection() {
    const connectionConfig = {
      host: config.host,
      port: config.rethinkPort,
      db: config.cstacDB,
    };

    if (process.env.NODE_ENV === 'production') {
      connectionConfig.user = dbmap.rethinkdbAdmin.user;
      connectionConfig.password = dbmap.rethinkdbAdmin.password;
    }

    return rethink.connect(connectionConfig);
  },
  /**
   * Returns user table object for requested user
   * @param {object} credentials credentials of requested user
   * @return {object} The requested user object
   */
  getUserDetails(credentials) {
    return helperFunctions.getRethinkConnection()
    .then(connection => rethink.table('users').get(credentials.username).merge(user =>
      ({
        permissions: user('permissions').coerceTo('array')
        .map(table =>
          table.map(tableArr =>
            rethink.branch(
              tableArr.typeOf().eq('OBJECT'),
              tableArr.coerceTo('array').map(doc =>
                doc.map(docArr =>
                  rethink.branch(
                    docArr.typeOf().eq('ARRAY'),
                    docArr.fold({}, (acc, row) =>
                      acc.merge(rethink.table('roles').get(row)('verbs'))
                    ),
                    docArr
                  )
                )
              ).coerceTo('object'),
              tableArr
            )
          )
        ).coerceTo('object'),
      })).run(connection))
    .then(user => user);
  },
  /**
   * Hashes password for storage in database
   * @param {string} password user password from client
   * @return {string} The hashed password
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(16);
    return new Promise((res, rej) => {
      crypto.pbkdf2(
        password,
        salt,
        500000,
        64,
        'sha512',
        (err, hash) => {
          if (err) {
            rej(err);
          }

          const array = new ArrayBuffer(hash.length + salt.length + 8);
          const hashframe = Buffer.from(array);
          // extract parameters from buffer
          hashframe.writeUInt32BE(salt.length, 0, true);
          hashframe.writeUInt32BE(500000, 4, true);
          salt.copy(hashframe, 8);
          hash.copy(hashframe, salt.length + 8);
          res(hashframe.toString('base64'));
        }
      );
    });
  },
  /**
   * Validates JWT from authenticated user
   * @param {object} decoded token contents
   * @param {object} request original request from client
   * @param {function} callback function signature (err, isValid, alternative credentials)
   */
  validateToken(decoded, request, callback) {
    helperFunctions.getUserDetails({ username: decoded.username })
    .then((user) => {
      if (user.id) {
        callback(null, true, user);
      }
    });
  },
  /**
   * Confirms that submitted email is new
   * @param {object} req request
   * @param {object} connection GraphQL connection
   * @return {boolean} Is the email unique?
   */
  validateUniqueEmail(req, connection) {
    return rethink.table('users')
      .filter({ email: req.payload.email })
      .count()
      .eq(0)
      .run(connection);
  },
  /**
   * Confirms that submitted username & email are new
   * @param {object} req request
   * @param {object} res response
   * @return {object} The submitted user information
   */
  validateUniqueUser(req, res) {
    return helperFunctions.getRethinkConnection()
    .then(connection =>
      helperFunctions.validateUniqueUsername(req, connection)
      .then((isUniqueUsername) => {
        if (isUniqueUsername) {
          return helperFunctions.validateUniqueEmail(req, connection);
        }

        res(Boom.badRequest('Username taken'));
        return null;
      })
      .then((isUniqueEmail) => {
        if (isUniqueEmail) {
          res(req.payload);
        } else if (isUniqueEmail === false) {
          res(Boom.badRequest('Email taken'));
        }
      })
    );
  },
  /**
   * Confirms that submitted username is new
   * @param {object} req request
   * @param {object} connection GraphQL connection
   * @return {boolean} Is the username unique?
   */
  validateUniqueUsername(req, connection) {
    return rethink.table('users')
      .getAll(req.payload.username)
      .count()
      .eq(0)
      .run(connection);
  },
  /**
   * Validate that authenticating user is using correct credentials
   * @param {object} req request
   * @param {object} res response
   * @return {object} The requested user object
   */
  validateUser(req, res) {
    return helperFunctions.getUserDetails(req.payload)
    .then((user) => {
      helperFunctions.verifyPassword(req.payload.password, user.passwordHash)
        .then((passwordMatch) => {
          if (user && user.passwordHash && passwordMatch) {
            res(user);
          } else {
            res(Boom.unauthorized('Incorrect username or password.'));
          }
        });
    });
  },
  /**
   * Verify that authenticating user is using correct password
   * @param {string} password user password
   * @param {string} hashframe user passwordHash from DB
   * @return {boolean} Is password valid?
   */
  verifyPassword(password, hashframe) {
    if (!hashframe) {
      return false;
    }

    // decode and extract hashing parameters
    hashframe = Buffer.from(hashframe, 'base64');
    const saltBytes = hashframe.readUInt32BE(0);
    const hashBytes = hashframe.length - saltBytes - 8;
    const iterations = hashframe.readUInt32BE(4);
    const salt = hashframe.slice(8, saltBytes + 8);
    const hash = hashframe.slice(8 + saltBytes, saltBytes + hashBytes + 8);
    // verify the salt and hash against the password
    return new Promise((res, rej) => {
      crypto.pbkdf2(password, salt, iterations, hashBytes, 'sha512', (err, verify) => {
        if (err) {
          rej(err);
        }

        if (verify.equals(hash)) {
          res(true);
        }

        res(false);
      });
    });
  },
};

module.exports = helperFunctions;
