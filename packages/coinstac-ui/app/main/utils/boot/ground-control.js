'use strict';

const app = require('ampersand-app');
const ipc = require('electron').ipcMain;

function groundControl() {
  ipc.on('major-tom-to-ground-control', arg => {
    groundControl.receive(arg.evt, arg.arg);
  });
}

// TODO: ???
// groundControl.receive = function receive(evt, arg) {
// };

groundControl.broadcast = function broadcast(evt, arg) {
  // you'd think to use just ipc.send, but
  // @ref: http://tinyurl.com/pag9lkw
  app.mainWindow.webContents.send(
    'ground-control-to-major-tom',
    {
      arg,
      evt,
    }
  );
};

module.exports = groundControl;
