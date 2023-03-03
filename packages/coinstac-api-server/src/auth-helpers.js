const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const { ObjectID } = require('mongodb');
const database = require('./database');
const { transformToClient } = require('./utils');
const { eventEmitter, USER_CHANGED } = require('./data/events');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const passwordLifeTime = 180;

const audience = 'coinstac';
const issuer = 'coinstac';
const subject = 'coinstac';

const helperFunctions = {
  /**
   * Create JWT for user signing in to application
   * @param {string} user id of authenticating user passed in from route handler
   * @return {string} A JWT for the requested user
   */
  createToken(id) { // Done
    return jwt.sign({ id }, process.env.API_JWT_SECRET, {
      audience,
      issuer,
      subject,
      algorithm: 'HS256',
      expiresIn: '12h',
    });
  },
  /**
  * Create token for headless user
  * @param {string} id headless user id
  * @param {string} apiKey api key used for
  * @return {string} A JWT for the requested user
  */
  createAuthTokenForHeadless(id, apiKey) {
    return jwt.sign({ id, apiKey }, process.env.API_JWT_SECRET, {
      audience,
      issuer,
      subject,
      algorithm: 'HS256',
    });
  },
  /**
   * Decode and verify validity of token
   * @param {string} token
   * @returns object that was inside token
   */
  decodeToken(token) { // Done
    return jwt.verify(token, process.env.API_JWT_SECRET);
  },
  /**
   * Create JWT for password reset
   * @param {string} email email
   * @return {string} A JWT for the requested email
   */
  createPasswordResetToken(email) {
    return jwt.sign({ email }, process.env.API_JWT_SECRET, {
      audience,
      issuer,
      subject,
      algorithm: 'HS256',
      expiresIn: '24h',
    });
  },
  /**
   * Create new user account
   * @param {string} user authenticating user's username
   * @param {string} passwordHash string of hashed password
   * @return {object} The updated user object
   */
  async createUser(user, passwordHash) {
    const userDetails = {
      _id: user._id || new ObjectID(),
      username: user.username,
      name: user.name,
      email: user.email,
      institution: user.institution,
      passwordHash,
      permissions: user.permissions || {
        computations: {},
        consortia: {},
        pipelines: {},
      },
      consortiaStatuses: user.consortiaStatuses || {},
      passwordChangedAt: new Date(),
    };

    const db = database.getDbInstance();
    const result = await db.collection('users').insertOne(userDetails);

    return result.ops[0];
  },
  async updateUser(user) {
    const db = database.getDbInstance();

    const result = await db.collection('users').findOneAndUpdate({
      _id: ObjectID(user.id),
    }, {
      $set: {
        name: user.name,
        username: user.username,
        email: user.email,
        photo: user.photo,
        photoID: user.photoID,
        institution: user.institution,
      },
    }, {
      returnOriginal: false,
    });

    const updatedUser = transformToClient(result.value);

    eventEmitter.emit(USER_CHANGED, updatedUser);

    return updatedUser;
  },
  /**
   * Save password reset token
   * @param {string} email email to send password reset token
   * @return {object}
   */
  async savePasswordResetToken(email) {
    const resetToken = helperFunctions.createPasswordResetToken(email);

    const msg = {
      to: email,
      from: 'no-reply@coinstac.org',
      subject: 'Password Reset Request',
      html: `We received your password reset request. <br/>
        Please use this token for password reset. <br/>
        Token: <strong>${resetToken}</strong>`,
    };

    const db = database.getDbInstance();

    await sgMail.send(msg);

    return db.collection('users').updateOne({ email }, {
      $set: {
        passwordResetToken: resetToken,
      },
    }, { returnOriginal: false });
  },
  /**
 * Returns user table object for requested user
 * @param {object} userId id of requested user
 * @return {object} The requested user object
 */
  async getUserDetailsByID(userId) {
    const db = database.getDbInstance();

    try {
      const user = await db.collection('users').findOne({ _id: ObjectID(userId) });
      return transformToClient(user);
    } catch {
      return null;
    }
  },
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
  async validateToken(data) {
    const user = await helperFunctions.getUserDetailsByID(data.decoded.payload.id);

    if (user) {
      return {
        isValid: true,
        credentials: user,
      };
    }

    const db = database.getDbInstance();

    const headlessClient = await db.collection('headlessClients').findOne({
      _id: ObjectID(data.decoded.payload.id),
      apiKey: data.decoded.payload.apiKey,
    });

    return {
      isValid: Boolean(headlessClient),
      credentials: headlessClient,
    };
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
   * Checks if an email exists
   * @param {object} req request
   * @param {object} res response
   * @return {object}   reply w/ does the email exist?
   */
  async validateEmail(req, h) {
    const exists = !await helperFunctions.validateUniqueEmail(req);
    if (!exists) return Boom.badRequest('Invalid email');

    return h.response(exists);
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
   * Confirms that submitted username & email are new
   * @param {object} req request
   * @param {object} res response
   * @return {object} The submitted user information
   */
  async validateUniqueUser(req, h) {
    const isUsernameUnique = await helperFunctions.validateUniqueUsername(req);

    if (!isUsernameUnique) {
      return Boom.badRequest('Username taken');
    }

    const isEmailUnique = await helperFunctions.validateUniqueEmail(req);

    if (!isEmailUnique) {
      return Boom.badRequest('Email taken');
    }

    return h.response(true);
  },
  /**
   * Validate that authenticating user is using correct credentials
   * @param {object} req request
   * @param {object} res response
   * @return {object} The requested user object
   */
  async validateUser(req, h) {
    const db = database.getDbInstance();

    const user = await db.collection('users').findOne({ username: req.payload.username });

    if (!user) {
      return Boom.unauthorized('Incorrect username or password');
    }

    const passwordMatch = await helperFunctions.verifyPassword(
      req.payload.password, user.passwordHash
    );

    if (!passwordMatch) {
      return Boom.unauthorized('Incorrect username or password');
    }

    const { passwordChangedAt } = user;
    const currentDate = new Date();
    const difference = Math.ceil(
      (currentDate.getTime() - passwordChangedAt.getTime()) / (1000 * 3600 * 24)
    );

    if (difference >= passwordLifeTime) {
      return Boom.unauthorized('Password is expired');
    }

    return h.response(transformToClient(user));
  },
  /**
   * Validate api key used by headless client
   * @param {object} req request
   * @param {object} res response
   * @return {object} The requested user object
   */
  async validateHeadlessClientApiKey(req, h) {
    const db = database.getDbInstance();

    let headlessClientId;
    try {
      headlessClientId = ObjectID(req.payload.id);
    } catch (error) {
      return Boom.unauthorized('Invalid client id');
    }

    const headlessClient = await db.collection('headlessClients').findOne({ _id: headlessClientId });

    if (!headlessClient) {
      return Boom.unauthorized('No headless client is registered with id');
    }

    const apiKeyMatch = await helperFunctions.verifyPassword(
      String(req.payload.apiKey), headlessClient.apiKey
    );

    if (!apiKeyMatch) {
      return Boom.unauthorized('Invalid API key');
    }

    return h.response(transformToClient(headlessClient));
  },
  /**
   * Confirms that submitted token is valid
   * @param {object} req request
   * @param {object} res response
   * @return {object} The requested object
   */
  async validateResetToken(req, h) {
    const db = database.getDbInstance();
    const user = await db.collection('users').findOne({ passwordResetToken: req.payload.token });

    if (!user) {
      return Boom.badRequest('Invalid token');
    }

    try {
      const { email } = jwt.verify(req.payload.token, process.env.API_JWT_SECRET);
      const noEmail = await helperFunctions.validateUniqueEmail({ payload: { email } });

      if (noEmail) {
        return Boom.badRequest('Invalid email');
      }

      return h.response({ email });
    } catch (err) {
      return Boom.badRequest(err);
    }
  },
  /**
   * Reset password
   * @param {object} password token for resetting password
   * @param {object} password new password
   * @return {object}
   */
  async resetPassword(token, password) {
    const db = database.getDbInstance();

    const newPassword = await helperFunctions.hashPassword(password);

    return db.collection('users').updateOne({
      passwordResetToken: token,
    }, {
      $set: {
        passwordHash: newPassword,
        passwordResetToken: '',
      },
    }, {
      returnOriginal: false,
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
  async canUserUpload(req) {
    // is user a part of the run
    const userId = req.auth.artifacts.decoded.payload.id;
    const { runId } = req.payload;
    const db = database.getDbInstance();
    try {
      const run = await db.collection('runs').findOne({ [`clients.${userId}`]: { $exists: true }, _id: ObjectID(runId) });
      if (run) {
        return runId;
      }
      return Boom.badRequest('run not found');
    } catch (e) {
      return Boom.badRequest('invalid user/run combination');
    }
  },
  async canUserDownload(req) {
    const userId = req.auth.artifacts.decoded.payload.id;
    const { runId } = req.payload;
    // is this user a member of the consortium?
    const db = database.getDbInstance();

    try {
      const run = await db.collection('runs').findOne({ _id: ObjectID(runId) });
      const { consortiumId } = run;
      const consortium = await db.collection('consortia').findOne({ _id: ObjectID(consortiumId) });
      const consortiaParticipantIds = [
        ...Object.keys(consortium.owners),
        ...Object.keys(consortium.members),
        ...Object.keys(consortium.activeMembers),
      ];
      if (consortiaParticipantIds.includes(userId)) {
        return runId;
      }
      return Boom.badRequest('run not found');
    } catch (e) {
      return Boom.badRequest('invalid user/run combination');
    }
  },
  validatePassword(password) {
    const PASSWORD_PATTERN = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[#?!@$%^&*-]).{8,}$/g;
    return PASSWORD_PATTERN.test(password);
  },
  audience,
  issuer,
  subject,
};

module.exports = helperFunctions;
