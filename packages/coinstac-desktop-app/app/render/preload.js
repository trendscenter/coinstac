const { initConfig, getConfig } = require('./config');

initConfig().then(() => {
  window.config = getConfig();
});
