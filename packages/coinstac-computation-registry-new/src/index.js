'use strict';

const nano = require('nano')('http://coinstac:test@localhost:5984');
const { spawnSync } = require('child_process');
const fs = require('fs');
const CLIAdapter = require('./adapters/cli-adapter');
const UIAdapter = require('./adapters/ui-adapter');
const whitelist = require('./whitelisted-computations');

const DIR_TO_COPY = '/etc/';
const FILE_TO_COPY = 'adduser.conf';

/**
 * ComputationRegistry
 * @class
 * @param {string} adapter Determines which adapter to use: cli or ui (Server uses cli)
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

  /**
   * Server
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
