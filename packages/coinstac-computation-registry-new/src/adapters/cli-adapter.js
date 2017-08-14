const { spawn } = require('child_process');

class CLIAdapter {
  /**
   * Wrap single docker pull command in a promise
   * @param {Object} payload
   * @param {string} payload.img
   */
  pullImage(payload) { // eslint-disable-line class-methods-use-this
    return new Promise((res) => {
      const sp = spawn('docker', ['pull', payload.img], { stdio: 'inherit' });

      sp.on('close', (code) => {
        res(code);
      });
    })
    .catch(console.log);
  }
}

module.exports = CLIAdapter;
