const hotmop = require('hotmop');
const _ = require('lodash');
const logger = require('ampersand-app').logger;
const app = require('ampersand-app');

const swapLog = () => {
  const logger = require('ampersand-app').logger; // eslint-disable-line global-require
  logger.debug('swapped module');
};

const rebuildServiceApi = newModule => {
  app.core = require('coinstac-client-core').get(); // eslint-disable-line global-require
  swapLog(newModule);
  require('./ground-control.js').broadcast('main-rebuild'); // eslint-disable-line global-require
};

const swapErrorLog = err => {
  const logger = require('ampersand-app').logger; // eslint-disable-line global-require
  logger.debug('error in module', err);
};

const requireCachePaths = _.keys(require.cache);

let watchCount = 0;
_.each(requireCachePaths, pkgPath => {
  if (!pkgPath.match('coinstac-client-core')) { return; } // swap our pkgs only, not vendor packages
  const swapper = hotmop(pkgPath);
  swapper.on('error', swapErrorLog);
  swapper.on('swap', rebuildServiceApi);
  ++watchCount;
});

logger.info(`${watchCount} files watched for node hotswapping`);
