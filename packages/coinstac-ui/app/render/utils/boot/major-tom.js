'use strict';

import { ipcRenderer } from 'electron';

const majorTom = () => {
  ipcRenderer.on('ground-control-to-major-tom', (sender, arg) => {
    majorTom.receive(sender, arg.evt, arg.arg);
  });
};

majorTom.receive = (sender, evt) => {
  switch (evt) {
    case 'main-rebuild':
      /* eslint-disable global-require */
      require('ampersand-app').logger.info('main service api proxy rebuilt');
      return require('../configure-main-services.js')();
      /* eslint-enable global-require */
    default:
      throw new ReferenceError('unhandled event from ground control');
  }
};

majorTom.broadcast = (evt, arg) => {
  ipcRenderer.send('major-tom-to-ground-control', { evt, arg });
};

module.exports = majorTom;
