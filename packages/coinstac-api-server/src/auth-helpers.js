const crypto = require('crypto');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const rethink = require('rethinkdb');
const config = require('../config/api-config');
const dbmap = require('/coins/config/dbmap'); // eslint-disable-line import/no-absolute-path

const helperFunctions = {
  addRoleToUser(username, table, doc, role, connection) {
    return rethink.get(username)('permissions').run(connection)
    .then((perms) => {
      console.log(perms);
      let newRoles = [role];

      // Grab existing roles if present
      if (perms.consortia[doc]) {
        newRoles = newRoles.concat(perms.consortia[doc]);
      }

      return rethink.table('users').get(username).update(
        { permissions: { consortia: { [doc]: newRoles } } }, { returnChanges: true }
      ).run(connection);
    });
  },
  /**
   * Create JWT for user signing in to application
   * @param {string} user username of authenticating user passed in from route handler
   */
  createToken(user) {
    return jwt.sign({ username: user }, config.jwtSecret, { algorithm: 'HS256', expiresIn: '12h' });
  },
  /**
   * Create new user account
   * @param {string} user authenticating user's username
   * @param {string} passwordHash string of hashed password
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
          computations: { read: true },
        },
      };

      if (user.permissions) {
        userDetails.permissions = user.permissions;
      }

      return rethink.table('users')
        .insert(userDetails,
        { returnChanges: true }
        )
        .run(connection);
    })
    .then(result => result.changes[0].new_val);
  },
  /**
   * Returns RethinkDB connection
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
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(config.saltBytes);
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      config.iterations,
      config.hashBytes,
      config.algo
    );
    const array = new ArrayBuffer(hash.length + salt.length + 8);
    const hashframe = Buffer.from(array);
    // extract parameters from buffer
    hashframe.writeUInt32BE(salt.length, 0, true);
    hashframe.writeUInt32BE(config.iterations, 4, true);
    salt.copy(hashframe, 8);
    hash.copy(hashframe, salt.length + 8);
    return hashframe.toString(config.encoding);
  },
  removeRoleFromUser(username, table, doc, role, connection) {
    return rethink.table('users')
      .get(username).update({
        permissions: { table: {
          [doc]: rethink.table('users').get(username)('permissions')(table)(doc).filter(rethink.row.ne(role)),
        } },
      }).run(connection);
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
      } else {
        callback(Boom.unauthorized('Invalid Token'), false);
      }
    });
  },
  /**
   * Confirms that submitted username & email are new
   * @param {object} req request
   * @param {object} res response
   */
  validateUniqueUser(req, res) {
    return helperFunctions.getRethinkConnection()
    .then(connection =>
      rethink.table('users')
        .getAll(req.payload.username)
        .count()
        .eq(0)
        .run(connection)
        .then((isUniqueUsername) => {
          if (isUniqueUsername) {
            return rethink.table('users')
              .filter({ email: req.payload.email })
              .count()
              .eq(0)
              .run(connection);
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
   * Validate that authenticating user is using correct credentials
   * @param {object} req request
   * @param {object} res response
   */
  validateUser(req, res) {
    return helperFunctions.getUserDetails(req.payload)
    .then((user) => {
      if (!user || !user.passwordHash) {
        res(Boom.unauthorized('Username does not exist'));
      } else {
        const passwordMatch = helperFunctions
          .verifyPassword(req.payload.password, user.passwordHash);

        if (!passwordMatch) {
          res(Boom.unauthorized('Incorrect password'));
        } else {
          res(user);
        }
      }
    });
  },
  /**
   * Verify that authenticating user is using correct password
   * @param {string} password user password
   * @param {string} hashframe user passwordHash from DB
   */
  verifyPassword(password, hashframe) {
    // decode and extract hashing parameters
    hashframe = Buffer.from(hashframe, config.encoding);
    const saltBytes = hashframe.readUInt32BE(0);
    const hashBytes = hashframe.length - saltBytes - 8;
    const iterations = hashframe.readUInt32BE(4);
    const salt = hashframe.slice(8, saltBytes + 8);
    const hash = hashframe.slice(8 + saltBytes, saltBytes + hashBytes + 8);
    // verify the salt and hash against the password
    const verify = crypto.pbkdf2Sync(password, salt, iterations, hashBytes, config.algo);
    if (verify.equals(hash)) {
      return true;
    }

    return false;
  },
};

module.exports = helperFunctions;
