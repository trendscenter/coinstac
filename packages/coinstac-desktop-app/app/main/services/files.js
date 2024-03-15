'use strict';

const { dialog } = require('electron');
const path = require('path');

// Mock file dialogue in testing environment
// Watch the following issue for progress on dialog support
// https://github.com/electron/spectron/issues/94
function mockFileDialog() {
  let count;
  switch (process.env.TEST_INSTANCE) {
    case 'test-1':
      count = 1;
      break;
    case 'test-2':
      count = 2;
      break;
    default:
      count = 1;
  }

  const testDataFilePath = path.join(__dirname, `../../../../../algorithm-development/test-data/freesurfer-test-data/site${count}/site${count}_Covariate.csv`);
  return Promise.resolve({ filePaths: [testDataFilePath] });
}

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
  showDialog: (mainWindow, filters, properties) => {
    if (process.env.NODE_ENV === 'test') {
      return mockFileDialog();
    }

    return dialog.showOpenDialog(
      mainWindow,
      {
        filters,
        properties,
      },
    );
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
        files => resolve(files || []),
      );
    })
      .then(core.projects.getFileStats)
      .then(JSON.stringify);
  },
};
