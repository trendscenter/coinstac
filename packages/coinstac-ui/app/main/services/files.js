'use strict';

const app = require('ampersand-app');
const dialog = require('electron').dialog;

function getMainWindow() {
  const mainWindow = app.mainWindow;

  if (!mainWindow) {
    return Promise.reject(new Error('No application window exists'));
  }

  return Promise.resolve(mainWindow);
}

module.exports = {
  /**
   * Get a meta file.
   *
   * @todo Find a way for the computation to specify the need for a 'meta' file.
   *
   * @returns {Promise} Resolves to a string representing the meta file's full
   * path.
   */
  getMetaFile: () => {
    return getMainWindow().then(mainWindow => new Promise(resolve => {
      dialog.showOpenDialog(
        mainWindow,
        {
          filters: [{
            name: 'CSV',
            extensions: ['csv', 'txt'],
          }],
          properties: ['openFile'],
        },
        file => resolve(file ? file[0] : undefined)
      );
    }));
  },

  /**
   * Select files.
   *
   * Use Electron's dialog to show a native file selector
   * {@link http://electron.atom.io/docs/api/dialog/#dialogshowopendialogbrowserwindow-options-callback}
   *
   * @returns {Promise} Always resolves to an JSON string
   */
  select: function selectFiles() {
    return getMainWindow()
      .then(mainWindow => new Promise(resolve => {
        dialog.showOpenDialog(
          mainWindow,
          {
            properties: ['openFile', 'multiSelections'],
          },
          files => resolve(files || [])
        );
      }))
      .then(app.core.projects.getFileStats)
      .then(JSON.stringify);
  },
};
