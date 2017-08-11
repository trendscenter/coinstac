const { spawn } = require('child_process');

class UIAdapter {
  /*
    Wrap single docker pull command in a promise
    @param: payload
      - img (string) - required
      - window (object) - for UI calls only
  */
  pullImage(payload) {  // eslint-disable-line class-methods-use-this
    return new Promise((res) => {
      const sp = spawn('docker', ['pull', payload.img]);

      sp.stdout.on('data', (data) => {
        console.log(data.toString());
        payload.window.webContents.send('docker-out', data.toString());
      });

      sp.stderr.on('data', (data) => {
        payload.window.webContents.send('docker-out', data.toString());
      });

      sp.on('close', (code) => {
        res(code);
      });
    })
    .catch(console.log);
  }
}

module.exports = UIAdapter;
