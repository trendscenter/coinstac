'use strict';

const app = require('ampersand-app');
const dialog = require('electron').dialog;

module.exports = {
  /**
   * Select files.
   *
   * Use Electron's dialog to show a native file selector
   * {@link http://electron.atom.io/docs/api/dialog/#dialogshowopendialogbrowserwindow-options-callback}
   *
   * @returns {Promise} Always resolves to an JSON string
   */
  select: function selectFiles() {
    const mainWindow = app.mainWindow;

    if (!mainWindow) {
      return Promise.reject(new Error('No application window exists'));
    }

    return new Promise(resolve => {
      dialog.showOpenDialog(
        mainWindow,
        {
          properties: ['openFile', 'multiSelections'],
        },
        files => resolve(files || [])
      );
    })
      .then(app.core.projects.getFileStats)
      .then(JSON.stringify);
  },
};
