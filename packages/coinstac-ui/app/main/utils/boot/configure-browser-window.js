/**
* Configure Electron's `BrowserWindow` -- the user interface.
*
* {@link http://electron.atom.io/docs/tutorial/quick-start/}
*/

'use strict';

const app = require('ampersand-app');
const electron = require('electron');

const BrowserWindow = electron.BrowserWindow;
const electronApp = electron.app;

/**
 * Create a `BrowserWindow`
 */
function createWindow() {
  const renderIndexPath = require.resolve('app/render/index.html');
  const size = electron.screen.getPrimaryDisplay().workAreaSize;

  /**
   * Create the browser window, set to fill user's screen. Keep a global
   * reference of the window object, if you don't, the window will be closed
   * automatically when the javascript object is GCed.
   */
  app.mainWindow = new BrowserWindow({
    width: size.width,
    height: size.height
  });

  app.mainWindow.loadURL('file://' + renderIndexPath);

  // Emitted when the window is closed.
  app.mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    app.mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electronApp.on('ready', createWindow)

// Quit when all windows are closed.
electronApp.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    electronApp.quit();
  }
});

electronApp.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (app.mainWindow === null) {
    createWindow();
  }
});
