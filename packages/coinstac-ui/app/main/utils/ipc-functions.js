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
