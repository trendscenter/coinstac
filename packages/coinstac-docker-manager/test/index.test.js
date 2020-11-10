const test = require('ava');
const sinon = require('sinon');
const portscanner = require('portscanner');
const winston = require('winston');
const { createReadStream, unlink } = require('fs');
const unzip = require('unzipper');
// const http = require('http');
const resolvePath = require('path').resolve;
const { keys } = require('lodash');
const wsServer = require('../../coinstac-images/coinstac-base/server-ws2');
const httpServer = require('../../coinstac-images/coinstac-base/server-http');
const mocks = require('../helpers/mocks');
const dockerManager = require('../src');

const {
  getImages,
  getStatus,
  pullImages,
  pullImagesFromList,
  pruneImages,
  removeImage,
  setLogger,
  startService,
  stopService,
  stopAllServices,
  docker,
} = dockerManager;

const { ALL_IMAGES, COMPUTATIONS, getRandomPort } = mocks;

const { transports: { Console } } = winston;

const WS_SERVER_PORT = 3223;
const HTTP_SERVER_PORT = 3224;

process.LOGLEVEL = 'info';

test.before(() => wsServer.start({ port: WS_SERVER_PORT })
  .then(() => {
    return new Promise((resolve, reject) => {
      createReadStream(resolvePath(__dirname, 'large.json.zip'))
        .pipe(unzip.Extract({ path: __dirname }))
        .on('close', () => resolve())
        .on('error', e => reject(e));
    });
  }));

test.before(() => httpServer.start({ port: HTTP_SERVER_PORT })
  .then(() => {
    return new Promise((resolve, reject) => {
      createReadStream(resolvePath(__dirname, 'large.json.zip'))
        .pipe(unzip.Extract({ path: __dirname }))
        .on('close', () => resolve())
        .on('error', e => reject(e));
    });
  }));

test('getImages, pruneImages and removeImage', async (t) => {
  /* getImages */
  sinon.stub(docker, 'listImages').resolves(ALL_IMAGES);

  let res = await getImages();
  t.is(res.length, ALL_IMAGES.length);

  docker.listImages.restore();

  /* pruneImages */
  sinon.stub(docker, 'listImages').yields(null, ALL_IMAGES);

  const getImageSuccessCallback = { remove: sinon.stub().yields(null, 'success') };
  const getImageFailCallback = { remove: sinon.stub().yields('error') };

  sinon.stub(docker, 'getImage')
    .onFirstCall()
    .returns(getImageFailCallback)
    .returns(getImageSuccessCallback);

  res = await pruneImages();
  t.is(res.filter(elem => elem === 'success').length, 9);

  docker.listImages.restore();

  sinon.stub(docker, 'listImages').yields('error', null);
  res = await pruneImages();
  t.is(res, undefined);

  docker.listImages.restore();
  docker.getImage.restore();

  /* removeImage */
  sinon.stub(docker, 'getImage').returns({
    remove: id => Promise.resolve(id),
  });
  const image = COMPUTATIONS[0].img;

  res = await removeImage(image);

  t.is(res, image);

  docker.getImage.restore();
});

test('getStatus', async (t) => {
  sinon.stub(docker, 'ping').resolves('OK');

  const status = await getStatus();
  t.is(status, 'OK');

  docker.ping.restore();
});

test('pullImages and pullImagesFromList', async (t) => {
  /* pullImages */
  sinon.stub(docker, 'pull').yields(null, 'stream');
  let images = await pullImages(COMPUTATIONS);

  t.deepEqual(
    images.map(image => image.compId),
    COMPUTATIONS.map(comp => comp.compId)
  );
  docker.pull.restore();

  sinon.stub(docker, 'pull').yields('error', null);
  images = await pullImages(COMPUTATIONS);

  t.deepEqual(
    images.map(image => image.compId),
    COMPUTATIONS.map(comp => comp.compId)
  );
  docker.pull.restore();

  sinon.stub(docker, 'pull').yields(null, 'stream');

  const compList = COMPUTATIONS.map(comp => comp.img);
  images = await pullImagesFromList(compList);

  t.is(compList.length, images.length);

  docker.pull.restore();
});

test('setLogger', async (t) => {
  const logger = winston.loggers.add('coinstac-main', {
    level: 'silly',
    transports: [new Console()],
  });
  const res = setLogger(logger);

  t.deepEqual(res, logger);
});

test('startService, stopService, stopAllServices', async (t) => {
  /* startService1 */
  const container = {
    inspect: () => {},
  };

  sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub().resolves(container),
    stop: () => {},
    inspect: sinon.stub().yields(null, { State: { Running: true } }),
  });

  let opts = {
    docker: { CMD: [] },
  };

  let res = await startService('service-1', 'test-1', opts);
  t.is(typeof res, 'function');

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();

  /* startService2 */
  sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub().resolves(container),
    stop: () => {},
    inspect: sinon.stub().yields('error', null),
  });

  await startService('service-2', 'test-2', opts);

  try {
    await startService('service-2', 'test-2', opts);
  } catch (error) {
    t.is(error, 'error');
  }

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();

  // /* startService3 */
  sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub().resolves(container),
    stop: () => {},
    inspect: sinon.stub().yields(null, { State: { Running: true } }),
  });

  res = await startService('service-3', 'test-3', opts);
  t.is(typeof res, 'function');
  res = await startService('service-3', 'test-3', opts);
  t.is(typeof res, 'function');

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();

  /* startService4 */
  sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub().resolves(container),
    stop: () => {},
    inspect: sinon.stub().yields(null, { State: { Running: false } }),
  });

  res = await startService('service-4', 'test-4', opts);
  t.is(typeof res, 'function');

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();

  /* startService5 */
  sinon.stub(portscanner, 'findAPortNotInUse').returns(WS_SERVER_PORT);
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub().resolves(container),
    stop: () => {},
    inspect: sinon.stub().yields(null, { State: { Running: true } }),
  });

  const service = await startService('service-5', 'test-5', opts);
  res = await service(['node', '', '']);

  t.deepEqual(res, {});

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();

  /* startService6 */
  sinon.stub(portscanner, 'findAPortNotInUse').returns(HTTP_SERVER_PORT);
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub().resolves(container),
    stop: () => {},
    inspect: sinon.stub().yields(null, { State: { Running: true } }),
  });

  opts = {
    docker: { CMD: [] },
    http: true,
  };

  const service1 = await startService('service-6', 'test-6', opts);
  res = await service1(['node', '', '']);
  t.is(res, '');

  const service2 = await startService('service-6', 'test-7', opts);
  res = await service2(['node', '', '']);
  t.is(res, '');

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();

  /* stopService1 */
  opts = {
    docker: { CMD: [] },
  };

  sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub().resolves(container),
    stop: sinon.stub().resolves(),
    inspect: sinon.stub().yields(null, { State: { Running: true } }),
  });

  await startService('service', 'test', opts);
  res = await stopService('service', 'test');

  t.is(res, 'service');

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();

  /* stopService2 */
  sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub().resolves(container),
    stop: sinon.stub().rejects('error'),
    inspect: sinon.stub().yields(null, { State: { Running: true } }),
  });

  await startService('service', 'test', opts);
  res = await stopService('service', 'test');

  t.is(res, 'service');

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();

  /* stopAllServices */
  sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub().resolves(container),
    stop: () => {},
    inspect: sinon.stub().yields(null, { State: { Running: true } }),
  });

  await startService('service', 'test-1', opts);
  const services = await stopAllServices();

  t.true(keys(services).includes('service'));
  t.true(Object.keys(services.service.users).includes('test-1'));

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();
});

test.after.always('cleanup file for ws server', () => new Promise((resolve, reject) => {
  unlink(resolvePath(__dirname, './large.json'), (err) => {
    if (err) return reject(err);
    resolve();
  });
}));

test.after.always('cleanup file for http server', () => new Promise((resolve, reject) => {
  unlink(resolvePath(__dirname, './large2.json'), (err) => {
    if (err) return reject(err);
    resolve();
  });
}));

test.after.always('cleanup stubs', () => {
  return new Promise((resolve) => {
    resolve();
  });
});
