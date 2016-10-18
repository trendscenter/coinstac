'use strict';

const app = require('ampersand-app');
const bluebird = require('bluebird');
const { dialog } = require('electron');
const rimraf = require('rimraf');

const rimrafAsync = bluebird.promisify(rimraf);

function warnAndDelete(options, dir) {
  /**
   * dialog#showMessageBox doesn't conform to Node.js-style callbacks. Manually
   * wrap it with a Promise.
   *
   * {@link http://electron.atom.io/docs/api/dialog/#dialogshowmessageboxbrowserwindow-options-callback}
   */
  return new Promise(resolve => {
    dialog.showMessageBox(Object.assign({
      type: 'warning',
      buttons: ['Delete', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
    }, options), resolve);
  })
    .then(response => {
      if (response === 0) {
        return rimrafAsync(dir).then(() => app.core.teardown());
      }
    });
}

module.exports = {
  computations: function cleanComputations() {
    return warnAndDelete(
      {
        detail: 'Computations can be re-downloaded',
        message: 'Delete saved computations',
      },
      app.core.getComputationsDirectory()
    );
  },

  userData: function cleanUserData(username) {
    return warnAndDelete(
      {
        detail: 'You can not undo this action',
        message: 'Delete user data',
      },
      app.core.getDatabaseDirectory(username)
    );
  },
};

