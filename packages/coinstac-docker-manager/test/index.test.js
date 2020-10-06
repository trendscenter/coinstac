const test = require('ava');
const sinon = require('sinon');
const portscanner = require('portscanner');
const winston = require('winston');
const { createReadStream, unlink } = require('fs');
const unzip = require('unzipper');
const resolvePath = require('path').resolve;
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
  // stopService,
  // stopAllServices,
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

  const res = await getImages();
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

  const res1 = await pruneImages();
  t.is(res1.filter(elem => elem === 'success').length, 9);

  docker.listImages.restore();

  sinon.stub(docker, 'listImages').yields('error', null);
  const res2 = await pruneImages();
  t.is(res2, undefined);

  docker.listImages.restore();
  docker.getImage.restore();

  /* removeImage */
  sinon.stub(docker, 'getImage').returns({ remove: sinon.stub() });
  const image = COMPUTATIONS[0].img;

  await removeImage(image);
  t.pass();

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

  /* pullImagesFromList */
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
  setLogger(logger);

  t.pass();
});

test('startService1', async (t) => {
  sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
  sinon.stub(docker, 'createContainer').returns({
    start: sinon.stub(),
    stop: sinon.stub(),
    inspect: sinon.stub().yields(null, { State: { Running: true } }),
  });

  const opts = {
    docker: { CMD: [] },
  };

  await startService('service-1', 'test-1', opts);
  t.pass();

  portscanner.findAPortNotInUse.restore();
  docker.createContainer.restore();
});

// test.serial.before('startService2', async (t) => {
//   sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
//   sinon.stub(docker, 'createContainer').returns({
//     start: sinon.stub(),
//     stop: sinon.stub(),
//     inspect: sinon.stub().yields('error', null),
//   });

//   const opts = {
//     docker: { CMD: [] },
//   };

//   await startService('service-2', 'test-2', opts);
//   t.pass();

//   portscanner.findAPortNotInUse.restore();
//   docker.createContainer.restore();
// });

// test.serial.before('startService3', async (t) => {
//   sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
//   sinon.stub(docker, 'createContainer').returns({
//     start: sinon.stub(),
//     stop: sinon.stub(),
//     inspect: sinon.stub().yields(null, { State: { Running: true } }),
//   });

//   const opts = {
//     docker: { CMD: [] },
//   };

//   await startService('service-3', 'test-3', opts);
//   await startService('service-3', 'test-3', opts);
//   t.pass();

//   portscanner.findAPortNotInUse.restore();
//   docker.createContainer.restore();
// });

// test.serial.before('startService4', async (t) => {
//   sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
//   sinon.stub(docker, 'createContainer').returns({
//     start: sinon.stub(),
//     stop: sinon.stub(),
//     inspect: sinon.stub().yields(null, { State: { Running: false } }),
//   });

//   const opts = {
//     docker: { CMD: [] },
//   };

//   await startService('service-4', 'test-4', opts);
//   t.pass();

//   portscanner.findAPortNotInUse.restore();
//   docker.createContainer.restore();
// });

// test.serial.before('startService5', async (t) => {
//   sinon.stub(portscanner, 'findAPortNotInUse').returns(WS_SERVER_PORT);
//   sinon.stub(docker, 'createContainer').returns({
//     start: sinon.stub(),
//     stop: sinon.stub(),
//     inspect: sinon.stub().yields(null, { State: { Running: true } }),
//   });

//   const opts = {
//     docker: { CMD: [] },
//   };

//   const service = await startService('service-5', 'test-5', opts);
//   await service(['node', '', '']);

//   t.pass();

//   portscanner.findAPortNotInUse.restore();
//   docker.createContainer.restore();
// });

// test.serial.before('startService6', async (t) => {
//   sinon.stub(portscanner, 'findAPortNotInUse').returns(HTTP_SERVER_PORT);
//   sinon.stub(docker, 'createContainer').returns({
//     start: sinon.stub(),
//     stop: sinon.stub(),
//     inspect: sinon.stub().yields(null, { State: { Running: true } }),
//   });

//   const opts = {
//     docker: { CMD: [] },
//     http: true,
//   };

//   const service1 = await startService('service-6', 'test-6', opts);
//   await service1(['node', '', '']);

//   const service2 = await startService('service-6', 'test-7', opts);
//   await service2(['node', '', '']);

//   t.pass();

//   portscanner.findAPortNotInUse.restore();
//   docker.createContainer.restore();
// });

// test.serial.before('stopService1', async (t) => {
//   const opts = { docker: {} };

//   sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
//   sinon.stub(docker, 'createContainer').returns({
//     start: sinon.stub(),
//     stop: sinon.stub().resolves(),
//     inspect: sinon.stub().yields(null, { State: { Running: true } }),
//   });

//   await startService('service', 'test', opts);
//   await stopService('service', 'test');

//   t.pass();

//   portscanner.findAPortNotInUse.restore();
//   docker.createContainer.restore();
// });

// test.serial.before('stopService2', async (t) => {
//   const opts = { docker: {} };

//   sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
//   sinon.stub(docker, 'createContainer').returns({
//     start: sinon.stub(),
//     stop: sinon.stub().rejects('error'),
//     inspect: sinon.stub().yields(null, { State: { Running: true } }),
//   });

//   await startService('service', 'test-1', opts);
//   await stopService('service', 'test-1');

//   t.pass();

//   portscanner.findAPortNotInUse.restore();
//   docker.createContainer.restore();
// });

// test.serial.before('stopAllServices', async (t) => {
//   const opts = { docker: {} };

//   sinon.stub(portscanner, 'findAPortNotInUse').returns(getRandomPort());
//   sinon.stub(docker, 'createContainer').returns({
//     start: sinon.stub(),
//     stop: sinon.stub(),
//     inspect: sinon.stub().yields(null, { State: { Running: true } }),
//   });

//   await startService('service', 'test', opts);
//   await stopAllServices();

//   t.pass();

//   portscanner.findAPortNotInUse.restore();
//   docker.createContainer.restore();
// });

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
