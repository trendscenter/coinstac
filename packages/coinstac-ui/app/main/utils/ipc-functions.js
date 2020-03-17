const electron = require('electron');

module.exports = {
  manualDirectorySelection(path) {
    return path;
  },
  manualFileSelection(filePaths, core) {
    return core.constructor.getSubPathsAndGroupExtension(
      { paths: filePaths, extension: null },
      false
    );
  },
  manualFileSelectionMultExt(filePaths, core) {
    return core.constructor.getSubPathsAndGroupExtension(
      { paths: filePaths, extension: null },
      true
    );
  },
  parseCSVMetafile(metaFilePath, core) {
    return Promise.all([
      metaFilePath[0],
      core.constructor.getCSV(metaFilePath[0]),
    ])
      .then(([metaFilePath, rawMetaFile]) => {
        const metaFile = JSON.parse(rawMetaFile);
        return Promise.all([
          metaFilePath,
          core.constructor.parseMetaFile(metaFile),
        ]);
      })
      .then(([metaFilePath, metaFile]) => ({
        metaFilePath, metaFile, extension: '.csv',
      }));
  },
  returnFileAsJSON(filePath, core) {
    return core.constructor.getJSONSchema(filePath[0]);
  },
  sendNotification(title, body) {
    const notification = new electron.Notification({ title, body });
    notification.show();
  },
};
