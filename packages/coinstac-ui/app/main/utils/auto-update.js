const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let window;

autoUpdater.autoDownload = false;

autoUpdater.on('error', (error) => {
  console.error('Auto update error', error && (error.stack || error).toString());
});

autoUpdater.on('update-downloaded', async () => {
  const { response } = await dialog.showMessageBox(window, {
    type: 'info',
    title: 'COINSTAC Updates',
    message: 'Download finished. Do you want to close the app now and install the update immediately? Some updates may be necessary to use Coinstac',
    buttons: ['Install when I quit', 'Install immediately'],
  });

  if (response === 1) {
    autoUpdater.quitAndInstall();
  }
});

function checkForUpdates(mainWindow) {
  window = mainWindow;

  autoUpdater.checkForUpdatesAndNotify();
}

module.exports.checkForUpdates = checkForUpdates;
