'use strict';

const { dialog } = require('electron');

module.exports = {
  /**
   * Show dialog with options.
   *
   * @param {object} mainWindow - reference to application window
   * @param {string} name - filter name
   * @param {array} extensions - file extensions allowed
   * @param {array} properties - selection properties
   * @returns {Promise} Resolves to a string representing the meta file's full
   * path.
   */
  showDialog: (mainWindow, filters, properties) => dialog.showOpenDialog(mainWindow, {
    filters,
    properties,
  }),

  /**
   * Select files.
   *
   * Use Electron's dialog to show a native file selector
   * {@link http://electron.atom.io/docs/api/dialog/#dialogshowopendialogbrowserwindow-options-callback}
   *
   * @returns {Promise} Always resolves to an JSON string
   */
  select: function selectFiles(mainWindow, core) {
    return new Promise((resolve) => {
      dialog.showOpenDialog(
        mainWindow,
        {
          properties: ['openDirectory', 'openFile', 'multiSelections'],
        },
        files => resolve(files || [])
      );
    })
      .then(core.projects.getFileStats)
      .then(JSON.stringify);
  },
};
