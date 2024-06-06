/* eslint-disable no-console, import/no-extraneous-dependencies */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs').promises;
const { _electron: electron } = require('playwright');
const { execSync } = require('child_process');

const appPath = path.join(__dirname, '../..');

let instances = [];

const devicePrefix = 'test';

chai.should();
chai.use(chaiAsPromised);

function getNewAppId() {
  return instances.length + 1;
}

async function createInstance(appId) {
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
}

async function setup(instanceCount = 1) {
  const promises = Array(instanceCount).fill(0).map(() => {
    const appId = getNewAppId();
    return createInstance(appId);
  });

  instances = await Promise.all(promises);

  if (instanceCount === 1) {
    return instances[0].appWindow;
  }

  return instances.map(instance => instance.appWindow);
}

const originalFunctions = {};
const logLevels = ['info', 'debug', 'warn', 'error', 'log', 'assert', 'verbose', 'trace'];

let allTestMessages = [];
let currentTestMessages = [];

const trackingLogLevel = 'trace';

async function beforeHandler() {
  allTestMessages = [];
  currentTestMessages = [];

  // Save console's default functions
  logLevels.forEach((level) => {
    originalFunctions[level] = console[level];
  });
}

async function afterHandler() {
  if (process.env.CI) {
    console.log('/********** Main process logs **********/');
    console.log((await fs.readFile('coinstac-log.json')).toString());
  }

  await Promise.all(instances.map(instance => instance.app.close()));
}

function beforeEachHandler() {
  // Mock console's functions
  logLevels.forEach((level) => {
    console[level] = (...args) => {
      if (level === trackingLogLevel) {
        currentTestMessages.push(args);
      }
    };
  });
}

async function afterEachHandler() {
  if (this.currentTest.state === 'failed') {
    if (currentTestMessages.length > 0) {
      allTestMessages.push({
        title: this.currentTest.title,
        messages: currentTestMessages,
      });
    }
    currentTestMessages = [];

    if (process.env.CI) {
      await fs.mkdir('/tmp/screenshots', { recursive: true });
      execSync(`xwd -root -silent | convert xwd:- png:/tmp/screenshots/screenshot-${this.currentTest.title.replaceAll(' ', '-')}$(date +%s).png`);
    }
  }

  logLevels.forEach((level) => {
    console[level] = originalFunctions[level];
  });
}

module.exports = {
  instances,
  setup,
  beforeHandler,
  afterHandler,
  beforeEachHandler,
  afterEachHandler,
};
