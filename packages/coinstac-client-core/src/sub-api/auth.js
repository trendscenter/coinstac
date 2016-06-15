'use strict';

const common = require('coinstac-common');
const User = common.models.User;
const atob = require('atob');
const btoa = require('btoa');
const bluebird = require('bluebird');

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
   * @param {CoinstacClient} opts.client
   */
  constructor(opts) {
    /* istanbul ignore next */
    if (!opts.client || !opts.client.halfpenny) {
      throw new ReferenceError('missing halfpenny');
    }
    this.halfpenny = opts.client.halfpenny;
  }

  /**
   * Create a new user.
   *
   * Makes a request to the API to create a new user. Response should contain
   * new user info.
   *
   * @param {Object}  data          Information to create a new user
   * @param {string}  data.username
   * @param {string}  data.email
   * @param {string}  data.name     New user's first name and last name
   * @param {string}  data.password
   * @returns {Promise}
   */
  createUser(user) {
    // the API requires a `label` key instead of `name`
    /* istanbul ignore next */
    const newUser = {
      email: user.email,
      label: user.name,
      password: user.password,
      username: user.username,
      siteId: '7', // @TODO :(
    };

    // @TODO use actual user siteId
    /* istanbul ignore next */
    return bluebird.resolve(this.halfpenny.users.post(newUser));
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
   * Log in.  Set active user.
   *
   * @param  {Object}  data user login credentials
   * @param  {string}  data.password
   * @param  {string}  data.username
   * @returns {Promise}
   */
  login(data) {
    /* istanbul ignore next */
    const handleLoginFail = (err) => {
      if (err.status === 500) {
        throw new Error(
          'unable to log into COINS.  Please try again or file a support ticket'
        );
      } else if (err.status === 401) {
        throw new Error('Invalid username or password.  Please try again');
      }
      throw err;
    };

    /* istanbul ignore next */
    return this.halfpenny.auth.login(data.username, data.password)
    .then((response) => {
      const result = response.data.data[0];
      const newUser = this.setUser(result.user);
      return newUser;
    })
    .catch(handleLoginFail);
  }

  /**
   * Log out.
   *
   * @returns {Promise}
   */
  logout() {
    this.halfpenny.store.removeItem(USER_KEY);
    /* istanbul ignore next */
    return bluebird.resolve(this.halfpenny.auth.logout());
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
