const { spawn } = require('child_process');


// const comps = ['nginx', 'redis', 'mysql'];

/*
  Wrap single docker pull command in a promise
 */
function pullImage(window, img) {
  return new Promise((res) => {
    const sp = spawn('docker', ['pull', img]);

    sp.stdout.on('data', (data) => {
      console.log(`--${data.toString()}--`);
      window.webContents.send('docker-out', data.toString());
    });

    sp.stderr.on('data', (data) => {
      res(data);
    });

    sp.on('close', (code) => {
      res(code);
    });
  })
  .catch(console.log);
}

/*
  Generate array of docker pull promises and wait until aa resolved to return
 */
function pullPipelineComputations(window, comps) {
  const compsP = comps.reduce((arr, img) => {
    arr.push(pullImage(window, img));
    return arr;
  }, []);

  return Promise.all(compsP)
  .then(res => res)
  .catch(console.log);
}

exports.pullPipelineComputations = pullPipelineComputations;

// pullImage('mysql');

