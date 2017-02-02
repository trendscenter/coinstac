'use strict';

const atob = require('atob');
const axios = require('axios');
const btoa = require('btoa');
const coinsDepositBox = require('coins-deposit-box');
const conf = require('./../../config.js');
const DomStorage = require('dom-storage');
const Halfpenny = require('halfpenny');
const User = require('coinstac-common').models.User;

/**
 * Authentication Service
 * @class
 * @extends Halfpenny
 */
class AuthenticationService extends Halfpenny {
  constructor(config) {
    super(config);

    /**
     * @todo: Don't clear to persist user and database credentials between
     * sessions.
     */
    this.clearDatabaseCredentials();
    this.clearUser();
  }

  /**
   * Clear stored database credentials.
   *
   * @returns {null}
   */
  clearDatabaseCredentials() {
    return this.setDatabaseCredentials(null);
  }

  /**
   * Clear stored user data.
   *
   * @returns {null}
   */
  clearUser() {
    return this.setUser(null);
  }

  /**
   * Get stored database credentials.
   *
   * @returns {(Object|null)}
   */
  getDatabaseCredentials() {
    return JSON.parse(atob(
      this.storage[AuthenticationService.DATABASE_CREDENTIALS_KEY]
    ));
  }

  /**
   * Get saved user.
   *
   * @return {(User|null)}
   */
  getUser() {
    const user = JSON.parse(atob(this.storage[AuthenticationService.USER_KEY]));

    return user ? new User(user) : null;
  }

  /**
   * Log in and set active user.
   *
   * @param {Object} data
   * @returns {Promise}
   */
  login(data) {
    return super.login(Object.assign({}, data, { coinstac: true }))
      .then((response) => {
        this.setDatabaseCredentials(response.data.data[0].coinstac);
        this.setUser(response.data.data[0].user);
        return response;
      })
      .catch((error) => {
        if (error.status === 500) {
          throw new Error(
            'Unable to log in to COINS. Please try again or file a support ticket.'
          );
        } else if (error.status === 401) {
          throw new Error('Invalid username or password');
        }

        throw error;
      });
  }

  /**
   * Log out.
   *
   * @returns {Promise}
   */
  logout() {
    this.clearDatabaseCredentials();
    this.clearUser();
    return super.logout();
  }

  /**
   * Set database credentials.
   *
   * @param {(Object|null)} credentials
   * @returns {(Object|null)}
   */
  setDatabaseCredentials(credentials) {
    this.storage[AuthenticationService.DATABASE_CREDENTIALS_KEY] =
      btoa(JSON.stringify(credentials));
    return this.getDatabaseCredentials();
  }

  /**
   * Save user.
   *
   * @param {(Object|null)} user
   * @returns {(User|null)}
   */
  setUser(user) {
    this.storage[AuthenticationService.USER_KEY] = btoa(JSON.stringify(user));
    return this.getUser();
  }

  /**
   * Factory
   * @static
   *
   * @param {Object} [config]
   * @param {string} [config.baseUrl]
   * @param {string} [config.storage]
   * @returns {AuthenticationService}
   */
  static factory(config) {
    return new AuthenticationService({
      authCookieName: coinsDepositBox.cookieName,
      baseUrl: typeof config === 'object' && config.baseUrl ?
        config.baseUrl :
        conf.get('baseUrl'),
      storage: typeof config === 'object' && config.storage ?
        config.storage :
        new DomStorage(),
      requestEngine: axios,
    });
  }
}


/**
 * User storage key.
 *
 * @const {string}
 */
AuthenticationService.USER_KEY = 'USER_KEY';

/**
 * Database credentials storage key.
 *
 * @const {string}
 */
AuthenticationService.DATABASE_CREDENTIALS_KEY = 'DATABASE_CREDENTIALS_KEY';

module.exports = AuthenticationService;
