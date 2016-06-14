'use strict';

const app = require('ampersand-app');
const fs = require('fs');

/**
 * Upsert COINSTAC user directory.
 *
 * @returns {Promise}
 */
module.exports = function upsertCoinstacUserDir() {
  const appDirectory = app.core.appDirectory;

  return new Promise(function upsertExecutor(resolve, reject) {
    fs.stat(appDirectory, function statCallback(error) {
      if (!error) {
        resolve();
      } else if (error.code === 'ENOENT') {
        fs.mkdir(appDirectory, function mkdirCallback(mkdirError) {
          if (mkdirError) {
            reject(mkdirError);
          } else {
            resolve();
          }
        });
      } else {
        reject(error);
      }
    });
  });
};

