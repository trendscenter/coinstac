'use strict';

const Pipeline = require('coinstac-pipeline');
const path = require('path');
const { fork } = require('child_process');
const exitHook = require('exit-hook');
const portscanner = require('portscanner');

/**
 * Starts a simulator run with the given pipeline spec
 *
 * @param  {Object} spec                       a valid pipeline spec
 * @param  {String} [runMode='local']          wether to run in local or decentralized mode
 * @param  {Number} [clientCount=1]            [description]
 * @param  {String} [operatingDirectory='test' }]            [description]
 * @return {[type]}                            [description]
 */
const startRun = ({
  spec, runMode = 'local', clientCount = 1, operatingDirectory = 'test',
}) => {
  return new Promise((resolve, reject) => {
    portscanner.findAPortNotInUse(1883, 2001, '127.0.0.1')
      .then((mqttPort) => {
        // the execArgv opt are a work around for https://github.com/nodejs/node/issues/9435
        const mqtt = fork(path.resolve(__dirname, 'mqtt-server.js'), [mqttPort], { execArgv: [], stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
        mqtt.on('message', (m) => {
          if (m.e) return reject(m.e);
          if (m.started) resolve(mqttPort);
        });
        exitHook(() => {
          mqtt.kill();
        });
      });
  })
    .then(async (mqttPort) => {
      const pipelines = {
        locals: [],
      };
      clientCount = parseInt(clientCount, 10);
      const remotePort = await portscanner.findAPortNotInUse(3300, 4001, '127.0.0.1');

      if (runMode === 'decentralized') {
        const remoteSpec = Array.isArray(spec) ? spec[0] : spec;
        const remoteManager = await Pipeline.create({
          clientId: 'remote',
          mode: 'remote',
          remotePort,
          operatingDirectory: path.resolve(operatingDirectory),
          mqttRemoteURL: 'localhost',
          mqttRemotePort: mqttPort,
          mqttRemoteProtocol: 'mqtt:',
        });
        pipelines.remote = {
          manager: remoteManager,
          pipeline: remoteManager.startPipeline({
            spec: remoteSpec,
            runId: 'simulatorRun',
            clients: Array.from(Array(clientCount)).reduce((acc, elem, idx) => {
              acc[`local${idx}`] = `local${idx}`;
              return acc;
            }, {}),
            owner: 'local0',
          }),
        };
      }
      for (let i = 0; i < clientCount; i += 1) {
        const localSpec = Array.isArray(spec) ? spec[i] : spec;
        const localPipelineManager = await Pipeline.create({ // eslint-disable-line no-await-in-loop, max-len
          clientId: `local${i}`,
          mode: 'local',
          remotePort,
          mqttRemotePort: mqttPort,
          operatingDirectory: path.resolve(operatingDirectory),
        });
        pipelines.locals.push({
          manager: localPipelineManager,
          pipeline: localPipelineManager.startPipeline({
            spec: localSpec,
            runId: 'simulatorRun',
            owner: 'local0',
          }),
        });
      }

      const allResults = Promise.all(Object.keys(pipelines).map((key) => {
        if (key === 'locals') {
          return Promise.all(pipelines[key].map(
            (localP, index) => localP.pipeline.result
              .then((res) => { pipelines[key][index].pipeline.result = res; })
              .catch((e) => {
                return e;
              })
          ));
        }
        return pipelines.remote.pipeline.result
          .then((res) => { pipelines[key].pipeline.result = res; })
          .catch((e) => {
            return e;
          });
      }))
        .then((errors) => {
          // error sent to remote or the first local for local runs
          if (errors[1] || errors[0][0]) throw errors[1] || errors[0][0];
          return {
            remote: runMode === 'decentralized' ? pipelines.remote.pipeline.result : {},
            locals: pipelines.locals.map(local => local.pipeline.result),
          };
        });

      return { pipelines, allResults };
    });
};
module.exports = {
  startRun,
};
