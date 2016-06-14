var hotmop = require('hotmop');
var _ = require('lodash');
var logger = require('ampersand-app').logger;
var app = require('ampersand-app');

var rebuildServiceApi = function(newModule) {
    app.core = require('coinstac-client-core').get();
    swapLog(newModule);
    require('./ground-control.js').broadcast('main-rebuild');
};

var swapLog = function(newModule) {
    var logger = require('ampersand-app').logger;
    logger.debug('swapped module');
};

var swapErrorLog = function (err) {
    var logger = require('ampersand-app').logger;
    logger.debug('error in module', err)
};

var requireCachePaths = _.keys(require.cache);

var watchCount = 0;
_.each(requireCachePaths, function hotswapCstacModules(pkgPath) {
    if (!pkgPath.match('coinstac-client-core')) { return; } // swap our pkgs only, not vendor packages
    var swapper = hotmop(pkgPath)
    swapper.on('error', swapErrorLog);
    swapper.on('swap', rebuildServiceApi);
    ++watchCount;
});

logger.info(watchCount + ' files watched for node hotswapping');
