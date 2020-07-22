const childProcess = require('child_process');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

module.exports = {
  npmi(path) {
    return new Promise((resolve, reject) => {
      console.log(`npm installing in ${path}`); // eslint-disable-line no-console
      const npmi = childProcess.spawn(npm, ['install'], {
        cwd: path,
      });
      npmi.on('error', e => reject(e));
      npmi.on('close', () => resolve());
    });
  },
};
