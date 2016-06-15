'use strict';

function AuthorizationError(message) {
    this.name = 'AuthorizationError';
    this.message = message || 'Authorization Error';
    this.stack = (new Error()).stack;
}

AuthorizationError.prototype = Object.create(Error.prototype);
AuthorizationError.prototype.constructor = AuthorizationError;

module.exports = AuthorizationError;
