/* eslint-disable no-console */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs').promises;
const { _electron: electron } = require('playwright');
const { exec } = require('child_process');

const appPath = path.join(__dirname, '../..');

let instances = [];

const devicePrefix = 'test';

chai.should();
chai.use(chaiAsPromised);

const getNewAppId = () => instances.length + 1;

const createInstance = async (appId) => {
  const deviceId = `${devicePrefix}${appId}`;
  const app = await electron.launch({
    args: [
      '--enable-logging',
      appPath,
      ...(process.env.CI ? [
        '--disable-dev-shm-usage',
        '--mockDeviceId',
        deviceId,
      ] : []),
    ],
    env: Object.assign({}, process.env, {
      TEST_INSTANCE: `test-${appId}`,
      NODE_ENV: 'test',
      ...(process.env.CI ? { APP_DATA_PATH: `/tmp/${deviceId}/` } : {}),
    }),
    logger: {
      isEnabled: () => true,
      log: (name, severity, message) => console.log(`INSTANCE ${appId} -> ${name}: ${message}`),
    },
  });
  const appWindow = await app.firstWindow();
  appWindow.on('console', msg => console.log(`INSTANCE ${appId} -> ${msg.text()}`));
  appWindow.on('pageerror', (err) => {
    console.log(`******** Window Error Instance ${appId}: ${err.message}`);
  });

  return { app, appWindow };
};

const setup = async (instanceCount = 1) => {
  const promises = Array(instanceCount).fill(0).map(() => {
    const appId = getNewAppId();
    return createInstance(appId);
  });

  instances = await Promise.all(promises);
  return instances;
};

const cleanup = async () => {
  if (process.env.CI) {
    console.log('/********** Main process logs **********/');
    console.log((await fs.readFile('coinstac-log.json')).toString());
  }

  return Promise.all(instances.map(instance => instance.app.close()));
};

const screenshot = async () => {
  if (process.env.CI && this.currentTest.state === 'failed') {
    await fs.mkdir('/tmp/screenshots', { recursive: true });
    exec(`xwd -root -silent | convert xwd:- png:/tmp/screenshots/screenshot-${this.currentTest.title.replaceAll(' ', '-')}$(date +%s).png`);
  }
};

module.exports = {
  instances,
  setup,
  cleanup,
  screenshot,
};
