'use strict';

const dialog = require('electron').dialog;

module.exports = {
  /**
   * Get a meta file.
   *
   * @todo Find a way for the computation to specify the need for a 'meta' file.
   *
   * @returns {Promise} Resolves to a string representing the meta file's full
   * path.
   */
  getMetaFile: (mainWindow) => {
    return new Promise((resolve) => {
      const files = dialog.showOpenDialog(mainWindow, {
        filters: [{
          name: 'CSV',
          extensions: ['csv', 'txt'],
        }],
        properties: ['openFile'],
      });
      resolve(files ? files[0] : undefined);
    });
  },

  /**
   * Get a schema file.
   *
   * @returns {Promise} Resolves to a string representing the schema file's full
   * path.
   */
  getSchemaFile: (mainWindow) => {
    return new Promise((resolve) => {
      const files = dialog.showOpenDialog(mainWindow, {
        filters: [{
          name: 'JSON',
          extensions: ['json'],
        }],
        properties: ['openFile'],
      });
      resolve(files ? files[0] : undefined);
    });
  },

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
