'use strict';

/**
 * Get a login API response.
 *
 * @param {Object} [user]
 * @param {string} [user.email]
 * @param {string} [user.label]
 * @param {string} [user.username]
 * @returns {Object}
 */
module.exports = function getLoginResponse(user) {
  const localUser = (!user || !(user instanceof Object))
    ? {
      email: 'test@nidev.mrn.org',
      label: 'Test User',
      username: 'testuser',
    }
    : user;

  return {
    data: [{
      username: localUser.username,
      user: {
        username: localUser.username,
        label: localUser.label,
        activeFlag: 'Y',
        acctExpDate: '2017-05-07T06:00:00.000Z',
        passwordExpDate: '2017-05-07T06:00:00.000Z',
        siteId: '7',
        isSiteAdmin: 'Y',
        email: localUser.email,
        emailUnsubscribed: false,
      },
      id: '123',
      key: '456',
      algorithm: 'sha256',
      issueTime: Date.now(),
      expireTime: Date.now + 200000,
      studyRoles: {},
      coinstac: {
        username: 'test',
        password: 'test',
      },
    }],
    error: null,
    stats: {},
  };
};
