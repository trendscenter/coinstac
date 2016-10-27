'use strict';

const app = require('ampersand-app');
const bluebird = require('bluebird');
const { dialog } = require('electron');
const rimraf = require('rimraf');

const rimrafAsync = bluebird.promisify(rimraf);

module.exports = {
  /**
   * Clean user data from disk.
   *
   * @param {string} username
   * @returns {Promise} Resolves to `true` if user data was removed, otherwise
   * to `false`.
   */
  userData: function cleanUserData(username) {
    /**
     * dialog#showMessageBox doesn't conform to Node.js-style callbacks. Manually
     * wrap it with a Promise.
     *
     * {@link http://electron.atom.io/docs/api/dialog/#dialogshowmessageboxbrowserwindow-options-callback}
     */
    return new Promise(resolve => {
      dialog.showMessageBox({
        type: 'warning',
        detail: 'You can not undo this action',
        message: 'Delete user data',
        buttons: ['Delete', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
      }, resolve);
    })
      .then(response => {
        if (response === 0) {
          return rimrafAsync(app.core.getDatabaseDirectory(username))
            .then(() => app.core.teardown())
            .then(() => true);
        }

        return false;
      });
  },
};

