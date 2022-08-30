'use strict';

const Docker = require('dockerode');
const { reduce } = require('lodash');
const portscanner = require('portscanner');
const utils = require('./utils');
const dockerService = require('./services/docker');
const SingularityService = require('./services/singularity');

const singularityService = SingularityService();

const serviceProviders = {
  docker: dockerService,
  singularity: singularityService,
};

const { logger } = utils;

let services = {};
const portBlackList = new Set();
let portLock = false;

/**
 * Set an external logger instance
 * @param {Object} loggerInstance Winston logger
 */
const setLogger = (loggerInstance) => {
  utils.setLogger(loggerInstance);
  return loggerInstance;
};

/**
 * Set the the singularity image directory
 * @param {Object} imageDirectory the directory that singularity uses for images
 */
const setImageDirectory = (imageDirectory) => {
  serviceProviders.singularity.setImageDirectory(imageDirectory);
};

/**
 * Assigns a unique unsused port to be used for web traffic
 * @param  {string} serviceId Id to consume the port
 * @return {int}              open port assigned
 */
const generateServicePort = async (serviceId, start = 8101, thisLock = false) => {
  let newPort;
  if (portLock && !thisLock) {
    await utils.setTimeoutPromise(Math.floor(Math.random() * 300));
    newPort = await generateServicePort(serviceId, newPort);
    return newPort;
  }
  portLock = true;
  newPort = await portscanner.findAPortNotInUse(start, 49151, '127.0.0.1');
  if (portBlackList.has(newPort)) {
    newPort = await generateServicePort(serviceId, newPort + 1, true);
    portBlackList.add(newPort);
    portLock = false;
    services[serviceId].port = newPort;
    return newPort;
  }
  portBlackList.add(newPort);
  portLock = false;
  services[serviceId].port = newPort;
  return newPort;
};

/**
 * Retrieve list of all local Docker images
 * @return {Object[]} Array of objects containing locally stored Docker images
 */
const getImages = (provider = 'docker') => {
  return serviceProviders[provider].listImages();
};

/**
 * Retrieve Docker status
 * @return {boolean} is Docker running?
 */
const getStatus = (provider = 'docker') => {
  return serviceProviders[provider].ping();
};

/**
 * Retrieve Docker status
 * @return {Object} Docker stats object
 */
const getStats = (runId, userId) => {
  return services[`${runId}-${userId}`].getStats();
};

/**
 * start or use an already started docker service based on serviceId
 * @param  {string} serviceId     unique ID to describe the service
 * @param  {string} serviceUserId unique user ID for use of this service
 * @param  {Object} opts          options for the service, eg: { docker: {...} } opts are
 *                                  are passed directly to the service
 *
 * @return {Promise}              promise that resolves to the service function
 */
const startService = ({
  serviceId,
  serviceUserId,
  serviceType,
  opts,
}) => {
  const createAndAssignService = () => {
    services[serviceId].state = 'starting';
    let depth = 0;
    const tryService = () => {
      return generateServicePort(serviceId, process.env.CI_PORT_START || 8101)
        .then((port) => {
          return serviceProviders[serviceType].createService(serviceId, port, opts);
        }).catch((e) => {
          if (e.message.includes('port') && depth < 20) {
            depth += 1;
            return tryService();
          }
          throw e;
        });
    };
    const eventualService = tryService().then(({ service, container }) => {
      services[serviceId].container = container;
      return service;
    });
    services[serviceId].service = eventualService;
    return eventualService;
  };

  if (services[serviceId] && (services[serviceId].state !== 'shutting down' && services[serviceId].state !== 'zombie')) {
    if (!services[serviceId].users[serviceUserId]) {
      services[serviceId].users[serviceUserId] = {
        debug: { dockerPreComp: 0, dockerComp: 0, dockerPostComp: 0 },
      };
    }
    if (services[serviceId].container && services[serviceId].state !== 'starting') {
      logger.silly('Returning already started service');
      return new Promise((resolve, reject) => {
        services[serviceId].container.inspect((error, data) => {
          if (error) {
            reject(error);
          }
          if (data.State.Running === true) {
            return resolve(services[serviceId].service);
          }
          // the service was somehow shutdown or crashed, make a new one
          logger.silly('Service was down, starting new instance');
          resolve(createAndAssignService(serviceId, services[serviceId].port, opts)
            .then(() => {
              services[serviceId].state = 'running';
              return services[serviceId].service;
            }));
        });
      });
    }
    return Promise.resolve(services[serviceId].service);
  }
  if (!services[serviceId]) {
    services[serviceId] = {
      users: {
        [serviceUserId]: {
          debug: { dockerPreComp: 0, dockerComp: 0, dockerPostComp: 0 },
        },
      },
    };
  }

  return createAndAssignService()
    .then(() => {
      services[serviceId].state = 'running';
      return services[serviceId].service;
    });
};

/**
* Finds dangling coinstac images and deletes them
* @return {Promise} list of deleted images and tags
*/
const pruneImages = (provider = 'docker') => {
  return new Promise((resolve, reject) => {
    serviceProviders[provider].listImages({ filters: { dangling: { true: true } } }, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res.filter(((elem) => {
        // TODO: find better way, make docker api 'reference' work?
        if (elem.RepoTags) {
          return elem.RepoTags[0].includes('coinstac');
        } if (elem.RepoDigests) {
          return elem.RepoDigests[0].includes('coinstac');
        }
        return false;
      })));
    });
  }).then((images) => {
    return Promise.all(images.map((image) => {
      return new Promise((resolve) => {
        serviceProviders[provider].getImage(image.Id).remove({ force: { true: 'true' } }, (err, res) => {
          if (err) {
            // remove can fail for serveral benign reasons, just resolve with the reason
            resolve(err);
          }
          resolve(res);
        });
      });
    }));
  });
};

/**
 * Pull individual image from Docker hub
 * @param {String} computation Docker image name
 * @return {Object} Returns stream of docker pull output
 */
const pullImage = (computation, provider = 'docker') => {
  return new Promise((resolve, reject) => {
    serviceProviders[provider].pull(computation, (err, stream) => {
      if (err) {
        reject(err);
      }
      resolve(stream);
    });
  });
};

/**
 * Generate array of docker pull promises and wait until resolved to return merged output streams
 * TODO: this function should be depricated for pullImagesFromList,
 *  as it couples too closely w/ the UI
 * @param {Object[]} comps array of computation objects to download
 * @param {String} comps.img Docker image name
 * @param {String} comp.compId Computation ID from app DB
 * @param {String} comp.compName Computation name from DB
 * @return {Object} Returns array of objects containing stream and computation parameters
 */
const pullImages = (comps) => {
  const compsP = reduce(comps, (arr, comp) => {
    arr.push(pullImage(`${comp.img}:latest`));
    return arr;
  }, []);

  // Set promise catches to undefined so that failures can be handled as successes: https://davidwalsh.name/promises-results
  return Promise.all(compsP.map(prom => prom.catch(err => err)))
    .then((res) => {
      return comps.map((val, index) => ({
        stream: res[index],
        compId: val.compId,
        compName: val.compName,
      }));
    });
};

/**
 * Generate array of docker pull promises and wait until resolved to return merged output streams
 * @param {Object[]} comps array of computation id's to download
 * @return {Object} Returns array of objects containing stream and computation parameters
 */
const pullImagesFromList = comps => Promise.all(comps.map(image => pullImage(`${image}:latest`)))
  .then(streams => streams.map((stream, index) => ({ stream, compId: comps[index] })));

/**
 * Remove the Docker image associated with the image id
 * @param {string} imgId ID of image to remove
 * @return {Promise}
 */
const removeImage = (imageId, provider = 'docker') => {
  return serviceProviders[provider].getImage(imageId).remove();
};

const removeImagesFromList = comps => Promise.all(comps.map(image => removeImage(`${image}:latest`)))
  .then(streams => streams.map((stream, index) => ({ stream, compId: comps[index] })));

/**
 * Attempts to stop a given service
 * If there are no other users, the service stops
 * Otherwise the user is removed from service usage
 *
 * @param  {String} serviceId     the service to stop
 * @param  {String} serviceUserId the user asking
 * @return {Promise}              A promise that resovles on success
 */
const stopService = (serviceId, serviceUserId, waitForBox) => {
  const service = services[serviceId];
  if (!service) return Promise.resolve(serviceId);
  if (service.users[serviceUserId]) {
    delete service.users[serviceUserId];
  }
  if (Object.keys(service.users).length === 0) {
    if (service.state !== 'starting') {
      service.state = 'shutting down';
      const boxPromise = service.container.stop()
        .then(() => {
          portBlackList.delete(service[serviceId].port);
          delete services[serviceId];
        }).catch((err) => {
          // TODO: boxes don't always shutdown well, however that shouldn't crash a valid run
          // figure out a way to cleanup
          service.state = 'zombie';
          service.error = err;
        });
      return waitForBox ? boxPromise : Promise.resolve(serviceId);
    }
    delete services[serviceId];
    return Promise.resolve(serviceId);
  }
  return Promise.resolve(serviceId);
};

/**
 * Stops all currently running containers
 * @return {Promise} resolved when all services are stopped
 */
const stopAllServices = () => {
  return Promise.all(
    Object.keys(services)
      .map(service => services[service].container.stop())
  )
    .then(() => {
      services = {};
    });
};

/**
 * Stops all currently running containers
 * @return {Promise} resolved when all services are stopped
 */
const getServices = () => {
  return services;
};

module.exports = {
  getImages,
  getStats,
  getStatus,
  getServices,
  pullImages,
  pullImagesFromList,
  pruneImages,
  removeImage,
  removeImagesFromList,
  services,
  setLogger,
  startService,
  stopService,
  stopAllServices,
  Docker,
  docker: dockerService.docker,
  getContainerStats: dockerService.getContainerStats,
  setImageDirectory,
};
