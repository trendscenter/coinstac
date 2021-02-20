const electron = require('electron');

module.exports = {
  manualDirectorySelection(path) {
    return path;
  },
  returnFileAsJSON(filePath, core) {
    return core.constructor.getJSONSchema(filePath[0]);
  },
  sendNotification(title, body) {
    const notification = new electron.Notification({ title, body });
    notification.show();
  },
};
