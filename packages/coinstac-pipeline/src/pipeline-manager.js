'use strict';

const pipelineManagerCentral = require('./pipeline-manager/pipeline-manager-central')
const pipelineManagerOuter = require('./pipeline-manager/pipeline-manager-outer')

module.exports = {

  /**
   * A pipeline manager factory, returns a manager in either a remote or local operating
   * mode that then can run and manipulate pipelines.
   * @param  {String} mode                     either local or remote
   * @param  {String} clientId                 the unique ID that identifies this manager
   * @param  {String} [operatingDirectory='./'] the operating directory
   *                                              for results and other file IO
   * @return {Object}                          A pipeline manager
   */
  async create({
    clientId,
    imageDirectory = './',
    logger,
    operatingDirectory = './',
    mode,
    remotePathname = '/transfer',
    remotePort = 3300,
    remoteProtocol = 'http:',
    mqttRemotePort = 1883,
    mqttRemoteWSPort = 9001,
    mqttRemoteProtocol = 'mqtt:',
    mqttRemoteWSProtocol = 'ws:',
    mqttRemoteWSPathname = '',
    remoteURL = 'localhost',
    mqttRemoteURL = 'localhost',
    unauthHandler, // eslint-disable-line no-unused-vars
  }) {
    
    if (mode === 'remote') {
      debugger
      return pipelineManagerCentral.create(
        {
          clientId,
          imageDirectory,
          logger,
          operatingDirectory,
          mode,
          remotePathname,
          remotePort,
          remoteProtocol,
          mqttRemotePort,
          mqttRemoteProtocol,
          remoteURL,
          mqttRemoteURL
        }
      )
    } else {
      debugger
      return pipelineManagerOuter.create({
        clientId,
        imageDirectory,
        logger,
        operatingDirectory,
        mode,
        remotePathname,
        remotePort,
        remoteProtocol,
        mqttRemotePort,
        mqttRemoteWSPort,
        mqttRemoteProtocol,
        mqttRemoteWSProtocol,
        mqttRemoteWSPathname,
        remoteURL,
        mqttRemoteURL ,
      })
    }
  },
};
