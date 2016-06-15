'use strict';

var _ = require('lodash');
var electron = require('electron');

module.exports = function() {
    var app = require('ampersand-app');
    var colorMap = {
      verbose: 'cyan',
      info: 'green',
      warn: 'orange',
      debug: 'blue',
      error: 'red'
    };
    var mainLogger = function() {
      return electron.remote.require('app/main/utils/expose-app.js')().logger;
    };
    var proxyLog = function(type, content) {
        if (type === 'log') {
            type = 'info';
        }
        console.log('%c ' + type, 'color:' + colorMap[type] + ';font-weight:bold', content);
        mainLogger()[type]('[ui]', content);
    };
    app.logger = {
        error: _.partial(proxyLog, 'error'),
        warn: _.partial(proxyLog, 'warn'),
        info: _.partial(proxyLog, 'info'),
        verbose: _.partial(proxyLog, 'verbose'),
        debug: _.partial(proxyLog, 'debug'),
        log: _.partial(proxyLog, 'log'),
    };
};
