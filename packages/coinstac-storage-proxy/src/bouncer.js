'use strict';

const url = require('url');
const joi = require('joi');
const boom = require('boom');
const { models: { Consortium } } = require('coinstac-common');
const utils = require('./utils');
const AuthorizationError = require('./authorization-error.js');

const bouncerConfigSchema = joi.object().keys({
  allowEverybody: joi.boolean(),
  consortiumOwnersOnly: joi.boolean(),
  consortiumMembersOnly: joi.boolean(),
  exceptionRegExp: joi.alternatives().try(
    joi.object().type(RegExp),
    joi.array().items(joi.object().type(RegExp))
  ),
  pathRegExp: joi.object().type(RegExp),
  rejectEverybody: joi.boolean(),
  targetBaseUrl: joi.string().uri({ scheme: /https?/ }).required(),
});

class Bouncer {
  /**
   * construct new Bouncer
   * @param {object} config configuration object
   * @param {string} targetBaseUrl
   * @param {boolean} [allowEverybody]
   * @param {boolean} [rejectEverybody]
   * @param {boolean} [consortiumMembersOnly]
   * @param {boolean} [consortiumOwnersOnly]
   * @param {array|string|RegExp} exceptionRegExp paths that are conditionally allowed
   */
  constructor(config) {
    joi.assert(config, bouncerConfigSchema);
    this.config = config;
    this.targetBaseUrl = url.parse(config.targetBaseUrl);
    this.handler = {
      proxy: {
        mapUri: this.mapUri.bind(this),
        passThrough: true,
      },
    };
    this.utils = utils;
    this.consortiumHasMember = Consortium.prototype.hasMember;
    this.consortiumIsOwnedBy = Consortium.prototype.isOwnedBy;
    if (config.exceptionRegExp) {
      if (!Array.isArray) {
        this.exceptionRegExp = [config.exceptionRegExp];
      } else {
        this.exceptionRegExp = config.exceptionRegExp;
      }
    }
  }

  reject(request, callback) {
    const msg = `Not authorized to make ${request.method} requests`;
    return callback(null, this.utils.getUnauthorizedUrl(request, msg));
  }

  allow(request, callback) {
    return callback(
      null,
      this.utils.getTargetUrl(this.targetBaseUrl, request)
    );
  }

  /**
   * apply config rules to request, call callback with proper URL
   * @param  {object}   request  hapi request object
   * @param  {function} callback function to be called with URI to proxy to
   * @return {void}
   */
  mapUri(request, callback) {
    const isException = this.testExceptionRoute(request);
    if (isException) {
      return this.allow(request, callback);
    }
    if (this.testPathRegExp(request, callback)) {
      if (this.config.rejectEverybody) {
        return this.reject(request, callback);
      }

      if (this.config.allowEverybody) {
        return this.allow(request, callback);
      }

      return this.validateConsortiumMembership(request)
        .then(this.validateConsortiumOwnership.bind(this, request))
        .then(this.allow.bind(this, request, callback))
        .catch(this.handleAuthRejection.bind(this, request, callback));
    }
    const err = new AuthorizationError('Invalid URI path');
    return this.handleAuthRejection(request, callback, err);
  }

  /**
   * detect if our bouncer has a special exception to permit a particular request
   * through the handler
   * @param {Request} request hapi-request object
   * @returns {boolean} isException
   */
  testExceptionRoute(request) {
    if (!this.exceptionRegExp) { return false; }
    return this.exceptionRegExp.some((exceptionRegExp) => {
      return !!request.path.match(exceptionRegExp);
    });
  }

  /**
   * compare request path to pathRegex.
   * @param  {object}   request  hapi request object
   * @param  {function} callback callback that takes new URI
   * @return {boolean}           true if test passes, false otherwise
   */
  testPathRegExp(request) {
    if (!this.config.pathRegExp || request.path.match(this.config.pathRegExp)) {
      return true;
    }

    return false;
  }

  validateConsortiumMembership(request) {
    if (!this.config.consortiumMembersOnly) {
      return Promise.resolve(true);
    }

    /**
         * call the consortium.hasMember method on a raw consortium object
         * @param  {object} rawConsortium a plain object
         * @return {boolean}              see coinstac-common/models/consortium
         */
    const callHasMember = (rawConsortium) => {
      return this.consortiumHasMember.call(
        rawConsortium,
        request.auth.credentials.username
      );
    };

    return this.utils.getConsortium(this.targetUrl, request)
      .then(callHasMember)
      .then((isMember) => {
        if (!isMember) {
          const msg = `Only consortium members may ${request.method}`;
          throw new AuthorizationError(msg);
        }

        return isMember;
      });
  }

  validateConsortiumOwnership(request) {
    if (!this.config.consortiumOwnersOnly) {
      return Promise.resolve(true);
    }

    /**
         * call the consortium.isOwnedBy method on a raw consortium object
         * @param  {object} rawConsortium a plain object
         * @return {boolean}              see coinstac-common/models/consortium
         */
    const callIsOwnedBy = (rawConsortium) => {
      return this.consortiumIsOwnedBy.call(
        rawConsortium,
        request.auth.credentials.username
      );
    };

    const doc = request.payload;
    const msg = `Only consortium owners may ${request.method} it`;

    if (!doc._rev) {
      // new document
      const isOwner = callIsOwnedBy(doc);
      if (isOwner) {
        return Promise.resolve(isOwner);
      }
      return Promise.reject(new AuthorizationError(msg));
    }

    // existing document (update)
    return this.utils.getConsortium(this.targetBaseUrl, request)
      .then(callIsOwnedBy)
      .then((isOwner) => {
        if (!isOwner) {
          return Promise.reject(new AuthorizationError(msg));
        }

        return isOwner;
      });
  }

  handleAuthRejection(request, callback, error) {
    if (error instanceof AuthorizationError) {
      return callback(
        null,
        this.utils.getUnauthorizedUrl(request, error.message)
      );
    }

    throw error;
  }
}

Bouncer.unauthorizedRoute = {
  path: '/bouncer/unauthorized',
  method: '*',
  config: {
    tags: ['coinstac'],
    auth: false,
  },
  handler: (request, reply) => {
    reply(boom.unauthorized(request.query.msg));
  },
};

module.exports = Bouncer;
