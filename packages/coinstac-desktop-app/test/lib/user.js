/* eslint-disable no-empty */
const { EXIST_TIMEOUT } = require('../lib/constants');

const logIn = async ({ username, password }, app) => {
  await app.title().should.eventually.equal('COINSTAC');

  await app.click('#login-username', { timeout: EXIST_TIMEOUT });
  await app.fill('#login-username', username);
  await app.fill('#login-password', password);

  await app.click('button:has-text("Log In")');

  try {
    await app.click('button:has-text("Never Show Again")', { timeout: 5000 });
  } catch { }

  // Assert
  app.innerText('.user-account-name', { timeout: EXIST_TIMEOUT }).should.eventually.equal(username);
};

const logOut = async (app) => {
  await app.click('a:has-text("Log Out")', { timeout: EXIST_TIMEOUT });

  // Assert
  await app.waitForSelector('button:has-text("Log In")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);
};

module.exports = {
  logIn,
  logOut,
};
