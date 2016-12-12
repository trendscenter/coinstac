'use strict';

const atob = require('atob');
const btoa = require('btoa');
const User = require('coinstac-common').models.User;

const USER_KEY = btoa('COINSTAC_USER');

/**
 * Provide authenication with COINS and access to COINSTAC authentication user
 * data.  Largely proxies functions built into the coins API client, halfpenny,
 * providing some sugar on top!
 * @class Auth
 */
class Auth {

  /**
   * @constructor
   * @param {object} opts
   * @param {Halfpenny} opts.halfpenny
   */
  constructor(opts) {
    /* istanbul ignore next */
    if (!opts.halfpenny) {
      throw new ReferenceError('missing halfpenny');
    }
    this.halfpenny = opts.halfpenny;
  }

  /**
   * Create a new user.
   *
   * Makes a request to the API to create a new user. Response should contain
   * new user info.
   *
   * @todo Use user's site ID
   *
   * @param {Object} data Information to create a new user
   * @param {string} data.email
   * @param {string} data.name New user's first name and last name
   * @param {string} data.password
   * @param {string} data.username
   * @returns {Promise}
   */
  createUser({ email, name, password, username }) {
    return this.halfpenny.users.post({
      email,
      label: name,  // the API requires a `label` key instead of `name`
      password: btoa(password),
      siteId: '7',
      username: btoa(username),
    });
  }

  /**
   * Get saved user.
   *
   * @return {object|null}
   */
  getUser() {
    const raw = this.halfpenny.store.getItem(USER_KEY);

    return raw ? new User(JSON.parse(atob(raw))) : null;
  }

  /**
   * Log in and set active user.
   *
   * @param {Object} data user login credentials
   * @param {string} data.password
   * @param {string} data.username
   * @returns {Promise}
   */
  login({ password, username }) {
    return this.halfpenny.auth.login(username, password)
      .then(({ data: { data: [{ user }] } }) => this.setUser(user))
      .catch(error => {
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
    this.halfpenny.store.removeItem(USER_KEY);
    return this.halfpenny.auth.logout();
  }

  /**
   * Save user.
   *
   * @param  {Object} user
   * @return {Object}
   */
  setUser(user) {
    this.halfpenny.store.setItem(USER_KEY, btoa(JSON.stringify(user)));
    return this.getUser();
  }

}

module.exports = Auth;
