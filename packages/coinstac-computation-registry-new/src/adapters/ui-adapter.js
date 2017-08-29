const common = require('coinstac-common');
const { compact } = require('lodash');

class UIAdapter {
  /**
   * Wrap single docker pull command in a promise
   * @param {Object} payload
   * @param {string} payload.img
   * @param {Object} payload.window - for UI calls only
   */
  pullImageWrapper(payload) {  // eslint-disable-line class-methods-use-this
    common.services.dockerManager.pullImage(payload.img)
    .then((result) => {
      return new Promise((res) => {
        if (result.err) {
          payload.window.webContents.send('docker-out', [{ status: result.err, isErr: true }]);
          res(result.err);
        } else {
          result.stream.on('data', (data) => {
            let output = compact(data.toString().split('\r\n'));
            output = output.map(JSON.parse);
            payload.window.webContents.send('docker-out', output);
          });

          result.stream.on('close', (code) => {
            res(code);
          });
        }
      });
    })
    .catch(console.log);
  }
}

module.exports = UIAdapter;
