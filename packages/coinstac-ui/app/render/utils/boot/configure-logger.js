import app from 'ampersand-app';
import electron from 'electron';
import { partial } from 'lodash';

module.exports = function configureLogger() {
  const colorMap = {
    verbose: 'cyan',
    info: 'green',
    warn: 'orange',
    debug: 'blue',
    error: 'red',
  };
  const mainLogger = () => {
    return electron.remote.require('app/main/utils/expose-app.js')().logger;
  };
  const proxyLog = (type, content) => {
    if (type === 'log') {
      type = 'info';
    }
    /* eslint-disable no-console */
    console.log(`%c ${type}`, `color:${colorMap[type]};font-weight:bold`, content);
    /* eslint-enable no-console */
    mainLogger()[type]('[ui]', content);
  };
  app.logger = {
    error: partial(proxyLog, 'error'),
    warn: partial(proxyLog, 'warn'),
    info: partial(proxyLog, 'info'),
    verbose: partial(proxyLog, 'verbose'),
    debug: partial(proxyLog, 'debug'),
    log: partial(proxyLog, 'log'),
  };
};
