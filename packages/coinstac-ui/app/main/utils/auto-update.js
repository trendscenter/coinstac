/* eslint-disable no-console */

const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let window;

autoUpdater.on('error', (error) => {
  console.error('Auto update error', error && (error.stack || error).toString());
  window.webContents.send('auto-update-log', `An error has occurred while searching for updates: ${error && (error.message || error).toString()}`);
});

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
  window.webContents.send('auto-update-log', 'Checking for updates...');
});
autoUpdater.on('update-not-available', () => {
  window.webContents.send('auto-update-log', 'No updates were found');
});
autoUpdater.on('update-available', (info) => {
  console.log('An update is available', info);
  window.webContents.send('auto-update-log', `An update is available. Version ${info.version}.`);
});
autoUpdater.on('download-progress', (progressObj) => {
  window.webContents.send('auto-update-log', `Downloading update... ${progressObj.percent}% complete.`);
});

autoUpdater.on('update-downloaded', async (info) => {
  console.log('An update was downloaded', info);
  window.webContents.send('auto-update-log', `An update was downloaded. Version ${info.version}.`);

  const { response } = await dialog.showMessageBox(window, {
    type: 'info',
    title: 'COINSTAC Updates',
    message: 'Download finished. Do you want to close the app now and install the update immediately? Some updates may be necessary to use Coinstac',
    buttons: ['Install later', 'Install immediately'],
  });

  if (response === 1) {
    autoUpdater.quitAndInstall();
  }
});

function checkForUpdates(mainWindow, logger) {
  window = mainWindow;

  autoUpdater.logger = logger;
  autoUpdater.checkForUpdatesAndNotify();
}

module.exports.checkForUpdates = checkForUpdates;
