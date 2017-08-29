const common = require('coinstac-common');

class CLIAdapter {
  /**
   * Wrap single docker pull command in a promise
   * @param {Object} payload
   * @param {string} payload.img
   */
  pullImageWrapper(payload) { // eslint-disable-line class-methods-use-this
    common.services.dockerManager.pullImage(payload.img)
    .then((result) => {
      return new Promise((res) => {
        if (result.err) {
          res(result.err);
        } else {
          result.stream.pipe(process.stdout);

          result.stream.on('close', (code) => {
            res(code);
          });
        }
      });
    })
    .catch(console.log);
  }
}

module.exports = CLIAdapter;
