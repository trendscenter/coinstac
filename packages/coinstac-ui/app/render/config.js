const { ipcRenderer } = require('electron');

let config;

module.exports = {
  async initConfig() {
    if (!config) {
      config = await ipcRenderer.invoke('get-config');
    }
  },
  getConfig() { return config; },
};
