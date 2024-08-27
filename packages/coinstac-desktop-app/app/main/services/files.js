'use strict';

const { dialog } = require('electron');
const path = require('path');

// Mock file dialogue in testing environment
// Watch the following issue for progress on dialog support
// https://github.com/electron/spectron/issues/94
let mockFileDialogCalled = 0;

function mockFileDialog() {
  const { TEST_INSTANCE } = process.env;
  let testFilePath;

  if (
    [
      'test-msr-csv',
      'test-regression-csv',
      'test-ssr-csv',
      'test-dpsvm-csv-1',
      'test-dpsvm-csv-2',
    ].includes(TEST_INSTANCE)
  ) {
    testFilePath = mockFileDialogCalled === 0
      ? process.env.DATA_FILE_PATH
      : process.env.COVARIATE_FILE_PATH;
    mockFileDialogCalled += 1;
  } else if (TEST_INSTANCE === 'test-regression-vbm') {
    testFilePath = process.env.COVARIATE_FILE_PATH;
  } else if (TEST_INSTANCE === 'test-2') {
    testFilePath = path.join(
      __dirname,
      '../../../../../algorithm-development/test-data/freesurfer-test-data/site2/site2_Covariate.csv',
    );
  } else {
    testFilePath = path.join(
      __dirname,
      '../../../../../algorithm-development/test-data/freesurfer-test-data/site1/site1_Covariate.csv',
    );
  }

  return Promise.resolve({ filePaths: [testFilePath] });
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

    return dialog.showOpenDialog(mainWindow, { filters, properties });
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
