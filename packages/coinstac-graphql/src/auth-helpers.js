const crypto = require('crypto');
const Boom = require('boom');
const jwt = require('jsonwebtoken');
const rethink = require('rethinkdb');
const config = require('../config/api-config');

const helperFunctions = {
  createToken(user) {
    return jwt.sign({ username: user }, config.jwtSecret, { algorithm: 'HS256', expiresIn: '12h' });
  },
  createUser(userDetails, passwordHash) {
    return helperFunctions.getRethinkConnection()
    .then((connection) => {
      return rethink.table('users')
        .insert({
          id: userDetails.username,
          email: userDetails.email,
          institution: userDetails.institution,
          passwordHash,
          permissions: {
            computations: { read: true },
          },
        },
        { returnChanges: true }
        )
        .run(connection);
    })
    .then(result => result.changes[0].new_val)
    .catch(err => Boom.badRequest(err.name));
  },
  getRethinkConnection() {
    return rethink.connect({
      host: config.host,
      port: config.rethinkPort,
      db: config.cstacDB,
      user: config.adminUser,
      password: config.adminPassword,
    });
  },
  getUserDetails(credentials) {
    return helperFunctions.getRethinkConnection()
    .then(connection => rethink.table('users').get(credentials.username).run(connection))
    .then((user) => {
      if (!user) {
        return Boom.badRequest('Username does not exist');
      }

      return user;
    })
    .catch((err) => { return Boom.badRequest(err.name); });
  },
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
  validateUniqueUser(req, res) {
    return helperFunctions.getRethinkConnection()
    .then((connection) => {
      return rethink.table('users')
        .getAll(req.payload.username)
        .count()
        .eq(0)
        .run(connection)
        .then((isUniqueUsername) => {
          if (isUniqueUsername) {
            return rethink.table('users')
              .getAll(req.payload.email, { index: 'email' })
              .count()
              .eq(0)
              .run(connection);
          }

          res(Boom.badRequest('Username taken'));
        })
        .then((isUniqueEmail) => {
          if (isUniqueEmail) {
            res(req.payload);
          } else {
            res(Boom.badRequest('Email taken'));
          }
        })
        .catch((err) => {
          res(Boom.badRequest(err.name));
        });
    })
    .catch((err) => {
      res(Boom.badRequest(err.name));
    });
  },
  validateToken(decoded, request, callback) {
    helperFunctions.getUserDetails({ username: decoded.username })
    .then((user) => {
      if (user.id) {
        callback(null, true, user);
      } else {
        callback(Boom.badRequest('Invalid Token'), false);
      }
    })
    .catch((err) => {
      callback(Boom.badRequest(err.name), false);
    });
  },
  validateUser(req, res) {
    return helperFunctions.getUserDetails(req.payload)
    .then((user) => {
      const passwordMatch = helperFunctions.verifyPassword(req.payload.password, user.passwordHash);

      if (!passwordMatch) {
        res(Boom.badRequest('Incorrect password'));
      }

      res(user);
    })
    .catch((err) => { res(Boom.badRequest(err.name)); });
  },
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

    return Boom.badRequest('Password incorrect');
  },
};

module.exports = helperFunctions;
