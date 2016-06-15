'use strict';

const ipc = require('electron').ipcRenderer;

var majorTom = function(opts) {
    ipc.on('ground-control-to-major-tom', function(sender, arg) {
        majorTom.receive(sender, arg.evt, arg.arg);
    });
};

majorTom.receive = function(sender, evt, arg) {
    switch (evt) {
        case 'main-rebuild':
            return require('app/render/utils/configure-main-services.js')();
            require('ampersand-app').logger.info('main service api proxy rebuilt');
        default:
            throw new ReferenceError('unhandled event from ground control');
    }
};

majorTom.broadcast = function(evt, arg) {
    ipc.send('major-tom-to-ground-control', { evt: evt, arg: arg });
};



module.exports = majorTom;
