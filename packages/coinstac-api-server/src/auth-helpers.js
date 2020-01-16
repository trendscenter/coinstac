const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const rethink = require('rethinkdb');
const Promise = require('bluebird');
const config = require('../config/default');
const dotenv = require('dotenv')

let dbmap;
try {
  dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path, import/no-unresolved, global-require
} catch (e) {
  console.log('No DBMap found: using defaults'); // eslint-disable-line no-console
  dbmap = {
    rethinkdbAdmin: {
      user: 'admin',
      password: '',
    },
    rethinkdbServer: {
      user: 'server',
      password: 'password',
    },
    cstacJWTSecret: 'test',
  };
}

dotenv.config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
   * Create JWT for password reset
   * @param {string} email email
   * @return {string} A JWT for the requested email
   */
  createPasswordResetToken(email) {
    return jwt.sign({ email }, dbmap.cstacJWTSecret, { algorithm: 'HS256', expiresIn: '24h' });
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
          consortiaStatuses: {},
        };

        if (user.permissions) {
          userDetails.permissions = user.permissions;
        }

        if (user.consortiaStatuses) {
          userDetails.consortiaStatuses = user.consortiaStatuses;
        }

        return rethink.table('users')
          .insert(userDetails, { returnChanges: true })
          .run(connection).then(res => connection.close().then(() => res));
      })
      .then(result => result.changes[0].new_val);
  },
  /**
   * Save password reset token
   * @param {string} email email to send password reset token
   * @return {object}
   */
  savePasswordResetToken(email) {
    const resetToken = helperFunctions.createPasswordResetToken(email)
  
    const msg = {
      to: email,
      from: 'no-reply@mrn.org',
      subject: 'Password Reset Request',
      html: `We received your password reset request. <br/>
        Please use this token for password reset. <br/>
        Token: <strong>${resetToken}</strong>`,
    };

    return sgMail.send(msg)
      .then(() =>
        helperFunctions.getRethinkConnection()
          .then(connection =>
            rethink.table('users')
              .filter({ email })
              .update({ passwordResetToken: resetToken })
              .run(connection)
              .then(() => connection.close())
          )
      )
  },
  /**
   * dbmap getter
   * @return {Object} dbmap loaded
   */
  getDBMap() { return dbmap; },
  /**
   * Returns RethinkDB connection
   * @return {object} A connection to RethinkDB
   */
  getRethinkConnection() {
    const defaultConnectionConfig = {
      host: config.host,
      port: config.rethinkPort,
      db: config.cstacDB,
    };

    defaultConnectionConfig.user = dbmap.rethinkdbAdmin.user;
    defaultConnectionConfig.password = dbmap.rethinkdbAdmin.password;

    return rethink.connect(Object.assign({}, defaultConnectionConfig));
  },
  /**
   * Returns user table object for requested user
   * @param {object} credentials credentials of requested user
   * @return {object} The requested user object
   */
  async getUserDetails(credentials) {
    const connection = await helperFunctions.getRethinkConnection();

    const user = await rethink.table('users').get(credentials.username).run(connection);

    await connection.close();

    return user;
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
   * merges the given map into the current map
   * @param {Object} map dbmap attrs to set
   */
  setDBMap(map) {
    dbmap = Object.assign({}, dbmap, map);
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
          callback(null, false, null);
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
      .then(connection => helperFunctions.validateUniqueUsername(req, connection)
        .then((isUniqueUsername) => {
          if (isUniqueUsername) {
            return helperFunctions.validateUniqueEmail(req, connection)
              .then(res => connection.close().then(() => res));
          }

          res(Boom.badRequest('Username taken'));
          return connection.close();
        })
        .then((isUniqueEmail) => {
          if (isUniqueEmail) {
            res(req.payload);
          } else if (isUniqueEmail === false) {
            res(Boom.badRequest('Email taken'));
          }
        }));
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
        if (user) {
          helperFunctions.verifyPassword(req.payload.password, user.passwordHash)
            .then((passwordMatch) => {
              if (user && user.passwordHash && passwordMatch) {
                res(user);
              } else {
                res(Boom.unauthorized('Incorrect username or password.'));
              }
            });
        } else {
          res(Boom.unauthorized('Incorrect username or password.'));
        }
      });
  },
  /**
   * Confirms that submitted email is valid
   * @param {object} req request
   * @param {object} res response
   * @return {object} The requested object
   */
  validateEmail(req, res) {
    return helperFunctions.getRethinkConnection()
      .then(connection =>
        rethink.table('users')
          .filter({ email: req.payload.email })
          .count()
          .eq(1)
          .run(connection)
          .then(emailExists => connection.close().then(() => ({ connection, emailExists })))
      )
      .then(({ connection, emailExists }) => {
        if (emailExists) {
          res(req.payload);
        } else {
          res(Boom.badRequest('Invalid email'));
        }

        return connection.close();
      })
  },
  /**
   * Confirms that submitted token is valid
   * @param {object} req request
   * @param {object} res response
   * @return {object} The requested object
   */
  validateResetToken(req, res) {
    return helperFunctions.getRethinkConnection()
      .then(connection =>
        rethink.table('users')
          .filter({ passwordResetToken: req.payload.token })
          .count()
          .eq(1)
          .run(connection)
          .then(resetTokenExists => {
            if (!resetTokenExists) {
              res(Boom.badRequest('Invalid token'))
            } else {
              try {
                const { email } = jwt.verify(req.payload.token, dbmap.cstacJWTSecret) 
                return helperFunctions.validateEmail({ payload: { email } }, res)
              } catch(err) {
                res(Boom.badRequest(err))
              }
            }
          })
      )
  },
  /**
   * Reset password
   * @param {object} password token for resetting password
   * @param {object} password new password
   * @return {object}
   */
  resetPassword(token, password) {
    return helperFunctions.getRethinkConnection()
      .then(connection =>
        helperFunctions.hashPassword(password)
          .then(newPassword =>
            rethink.table('users')
            .filter({ passwordResetToken: token })
            .update({
              passwordHash: newPassword,
              passwordResetToken: '',
            })
            .run(connection)
            .then(() => connection.close())
          ) 
      )
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
  JWTSecret: dbmap.cstacJWTSecret,
};

module.exports = helperFunctions;
