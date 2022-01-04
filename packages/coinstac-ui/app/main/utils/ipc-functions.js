const {
  ipcMain,
  Notification,
  quit,
  relaunch,
} = require('electron');

ipcMain.handle('quit', () => quit());
ipcMain.handle('relaunch', () => {
  relaunch();
  quit();
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
