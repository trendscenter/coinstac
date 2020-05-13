const crypto = require('crypto');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const Promise = require('bluebird');
const database = require('./database');
const { transformToClient } = require('./utils');
const dbmap = require('/etc/coinstac/cstacDBMap'); // eslint-disable-line import/no-absolute-path

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
  async createUser(user, passwordHash) {
    const userDetails = {
      _id: user.username,
      username: user.username,
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

    const db = database.getDbInstance();

    const result = await db.collection('users').insertOne(userDetails);

    return result.ops[0];
  },
  /**
   * dbmap getter
   * @return {Object} dbmap loaded
   */
  getDBMap() { return dbmap; },
  /**
   * Returns user table object for requested user
   * @param {string} username username of requested user
   * @return {object} The requested user object
   */
  async getUserDetails(username) {
    const db = database.getDbInstance();

    const user = await db.collection('users').findOne({ username });
    return transformToClient(user);
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
    helperFunctions.getUserDetails(decoded.username)
      .then((user) => {
        if (user) {
          callback(null, true, user);
        } else {
          callback(null, false, null);
        }
      });
  },
  /**
   * Confirms that submitted email is new
   * @param {object} req request
   * @return {boolean} Is the email unique?
   */
  async validateUniqueEmail(req) {
    const db = database.getDbInstance();

    const count = await db.collection('users')
      .countDocuments({ email: req.payload.email });

    return count === 0;
  },
  /**
   * Confirms that submitted username & email are new
   * @param {object} req request
   * @param {object} res response
   * @return {object} The submitted user information
   */
  validateUniqueUser(req, res) {
    const isUsernameUnique = this.validateUniqueUsername(req);

    if (!isUsernameUnique) {
      return res(Boom.badRequest('Username taken'));
    }

    const isEmailUnique = this.validateUniqueEmail(req);

    if (!isEmailUnique) {
      return res(Boom.badRequest('Email taken'));
    }

    return res(req.payload);
  },
  /**
   * Confirms that submitted username is new
   * @param {object} req request
   * @return {boolean} Is the username unique?
   */
  async validateUniqueUsername(req) {
    const db = database.getDbInstance();

    const count = await db.collection('users')
      .countDocuments({ username: req.payload.username });

    return count === 0;
  },
  /**
   * Validate that authenticating user is using correct credentials
   * @param {object} req request
   * @param {object} res response
   * @return {object} The requested user object
   */
  async validateUser(req, res) {
    const db = database.getDbInstance();

    const user = await db.collection('users').findOne({ username: req.payload.username });

    if (!user) {
      return res(Boom.unauthorized('Incorrect username or password.'));
    }

    const passwordMatch = await helperFunctions.verifyPassword(
      req.payload.password, user.passwordHash
    );

    if (passwordMatch) {
      res(transformToClient(user));
    } else {
      res(Boom.unauthorized('Incorrect username or password.'));
    }
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
