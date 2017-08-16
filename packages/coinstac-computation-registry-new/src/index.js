'use strict';

const nano = require('nano')('http://coinstac:test@localhost:5984');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const { compact } = require('lodash');
const CLIAdapter = require('./adapters/cli-adapter');
const UIAdapter = require('./adapters/ui-adapter');
const whitelist = require('./whitelisted-computations');

const DIR_TO_COPY = '/etc/';
const FILE_TO_COPY = 'adduser.conf';

/**
 * ComputationRegistry
 * @class
 * @param string adapter Determines which adapter to use: cli or ui (Server uses cli)
 */
class ComputationRegistry {
  constructor(adapter) {
    if (adapter === 'cli') {
      this.adapter = new CLIAdapter();
    } else {
      this.adapter = new UIAdapter();
    }

    nano.db.create('comp-schema', (err, body) => {
      if (err) {
        console.log(err);
      } else {
        console.log(body);
      }
    });
  }

  /**
   * Client
   */

  /**
   * Generate array of docker pull promises and wait until aa resolved to return
   * @param {Object} payload
   * @param {Array} payload.comps
   * @param {Object} payload.window UI Calls Only
   * @return {Promise<array>} Resolves to array of success flags for each computation in comps array
   */
  pullPipelineComputations(payload) {
    const compsP = payload.comps.reduce((arr, img) => {
      arr.push(this.adapter.pullImage(Object.assign({}, payload, { img })));
      return arr;
    }, []);

    return Promise.all(compsP)
    .then(res => res)
    .catch(console.log);
  }

  getLocalImages() { // eslint-disable-line class-methods-use-this
    return new Promise((res) => {
      const sp = spawn('docker', ['ps', '--format', '{{.ID}} {{.Image}}']);
      let containerImages = [];

      sp.stdout.on('data', (data) => {
        let dataIn = compact(data.toString().split('\n'));
        dataIn = dataIn.map(row => row.split(/\s+/));
        containerImages = containerImages.concat(dataIn);
      });

      sp.stderr.on('data', (data) => {
        res(data);
      });

      sp.on('close', () => {
        res(containerImages);
      });
    })
    .then((containerImages) => {
      return new Promise((res) => {
        const sp = spawn('docker', ['images', '--format', '{{.ID}} {{.Repository}} {{.Tag}} {{.Size}}']);
        let images = [];

        sp.stdout.on('data', (data) => {
          let dataIn = compact(data.toString().split('\n'));
          dataIn = dataIn.map((row) => {
            const imgSplit = row.split(/\s+/);
            const imgObj = {
              id: imgSplit[0],
              repository: imgSplit[1],
              tag: imgSplit[2],
              size: imgSplit[3],
            };

            const imgIndex = containerImages.findIndex(img => imgSplit[1] === img[1]);
            if (imgIndex > -1) {
              imgObj.containerId = containerImages[imgIndex][0];
            }
            return imgObj;
          });
          images = images.concat(dataIn);
        });

        sp.stderr.on('data', (data) => {
          res(data);
        });

        sp.on('close', () => {
          res(images);
        });
      });
    })
    .catch(console.log);
  }

  removeContainer(containerId) {  // eslint-disable-line class-methods-use-this
    return new Promise((res) => {
      const sp = spawn('docker', ['rm', '-f', containerId]);
      const outArr = [];

      sp.stdout.on('data', (data) => {
        outArr.push(data);
      });

      sp.stderr.on('data', (data) => {
        res(data);
      });

      sp.on('close', () => {
        res(outArr);
      });
    });
  }

  removeImage(imageId) {  // eslint-disable-line class-methods-use-this
    return new Promise((res) => {
      const sp = spawn('docker', ['rmi', imageId]);
      const outArr = [];

      sp.stdout.on('data', (data) => {
        outArr.push(data);
      });

      sp.stderr.on('data', (data) => {
        res(data);
      });

      sp.on('close', () => {
        res(outArr);
      });
    });
  }

  /**
   * Server
   */

  /**
   * Recursive function to create temporary container with first image in passed in array,
   *   copy contents of metadata file locally, then push that metadata information to the DB
   * @param {Array} comps - list of computation images
   */
  addMetadataToDB(comps) { // eslint-disable-line class-methods-use-this
    if (comps.length === 0) {
      fs.rmdirSync(`${__dirname}/tmp`);
      return 'finished';
    }

    spawnSync('docker', [
      'run',
      '--rm',
      '-v',
      `${__dirname}/tmp:/tmp`,
      comps[0],
      'sh',
      '-c',
      `cp -r ${DIR_TO_COPY}${FILE_TO_COPY} /tmp`,
    ], { stdio: 'inherit' });

    const metadata = fs.readFileSync(`${__dirname}/tmp/${FILE_TO_COPY}`);

    const compSchema = nano.use('comp-schema');
    compSchema.insert({ metadata: metadata.toString() }, comps.shift(), (err, body) => {
      if (err) {
        console.log(err);
      } else {
        console.log(body);
      }
    });

    fs.unlinkSync(`${__dirname}/tmp/${FILE_TO_COPY}`);

    this.addMetadataToDB(comps);
  }

  /**
   * On server start, pull in comps from whitelist and download via docker
   *    Synchronous pull and DB save in order to avoid multiple same named files
   *    in /tmp and to avoid simultaneous DB saves
   * @return {Promise<string>} Success flag
   */
  serverStart() {
    const comps = whitelist.reduce((arr, comp) => {
      arr.push(comp.dockerImage);
      return arr;
    }, []);

    return this.pullPipelineComputations({ comps })
    .then(() => new Promise((res) => {
      this.addMetadataToDB(comps);
      res();
    }));
  }
}

module.exports = ComputationRegistry;
