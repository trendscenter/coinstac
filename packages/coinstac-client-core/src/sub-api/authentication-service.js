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
    this.clearUser();
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
    return super.login(data).then((response) => {
      this.setUser(response.data.data[0].user);
      return response;
    });
  }

  /**
   * Log out.
   *
   * @returns {Promise}
   */
  logout() {
    this.clearUser();
    return super.logout();
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

AuthenticationService.USER_KEY = 'USER_KEY';

module.exports = AuthenticationService;
