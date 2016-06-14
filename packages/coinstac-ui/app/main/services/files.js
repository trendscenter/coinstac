'use strict';

const app = require('ampersand-app');
const dialog = require('electron').dialog;

module.exports = function files() {
  return {
    select: function selectFilesByDialog(cb) {
      const mainWindow = app.mainWindow;

      if (mainWindow) {
        dialog.showOpenDialog(
          mainWindow,
          {
            properties: ['openFile', 'multiSelections'],
          },
          function(files) {
            // too good for node-cb convention i guess
            cb(null, files);
          }
        );
      }
    },
  };
};
