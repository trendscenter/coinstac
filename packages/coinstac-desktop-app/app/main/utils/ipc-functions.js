const fs = require('fs');
const CsvReadableStream = require('csv-reader');
const {
  ipcMain,
  Notification,
  app,
} = require('electron');

ipcMain.handle('quit', () => app.quit());
ipcMain.handle('relaunch', () => {
  app.relaunch();
  app.quit();
});
ipcMain.handle('parseCsv', (event, files) => {
  const readPromises = files.map(file => new Promise((resolve, reject) => {
    try {
      const inputStream = fs.createReadStream(file, 'utf8');

      const data = {};
      let header = [];

      inputStream
        .pipe(new CsvReadableStream({
          parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true,
        }))
        .on('header', (headerRow) => {
          header = headerRow;
        })
        .on('data', (row) => {
          const rowData = {};

          row.forEach((cell, i) => {
            if (i === 0) {
              return;
            }

            rowData[header[i]] = cell;
          });

          // First column of each row serves as the row id
          data[row[0]] = rowData;
        })
        .on('end', () => {
          // Remove the first column from the header as it's just an id and does not need to
          // be shown to the user
          header = header.filter((col, i) => i !== 0);

          resolve({ header, data });
        });
    } catch (error) {
      reject(error);
    }
  }));

  return Promise.all(readPromises);
});

module.exports = {
  manualDirectorySelection(path) {
    return path;
  },
  returnFileAsJSON(filePath, core) {
    return core.constructor.getJSONSchema(filePath[0]);
  },
  sendNotification(title, body) {
    const notification = new Notification({ title, body });
    notification.show();
  },
};
