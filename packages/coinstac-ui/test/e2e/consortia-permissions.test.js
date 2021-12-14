/* eslint-disable no-console */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs').promises;
const { _electron: electron } = require('playwright');

const appPath = path.join(__dirname, '../..');

const EXIST_TIMEOUT = 30000;
const LOGIN_TIMEOUT = 30000;
const USER_ID_1 = 'test1';
const USER_ID_2 = 'test4';
const PASS = 'password';
const CONS_NAME = 'e2e-consortium-2-member';
const CONS_DESC = 'e2e-description-2-member';

chai.should();
chai.use(chaiAsPromised);

let app1;
let app2;
let appWindow1;
let appWindow2;
const _deviceId1 = 'test1';
const _deviceId2 = 'test4';
describe('e2e consortia permissions', () => {
  before(async () => {
    app1 = await electron.launch({
      args: [
        '--enable-logging',
        appPath,
        ...(process.env.CI ? [
          '--disable-dev-shm-usage',
          '--mockDeviceId',
          _deviceId1,
        ] : []),
      ],
      env: Object.assign({}, process.env, {
        TEST_INSTANCE: 'test-1',
        NODE_ENV: 'test',
        ...(process.env.CI ? { APP_DATA_PATH: `/tmp/${_deviceId1}/` } : {}),
      }),
      logger: {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`INSTANCE 1 -> ${name}: ${message}`),
      },
    });
    appWindow1 = await app1.firstWindow();
    appWindow1.on('console', msg => console.log(`INSTANCE 1 -> ${msg.text()}`));

    app2 = await electron.launch({
      args: [
        '--enable-logging',
        appPath,
        ...(process.env.CI ? [
          '--disable-dev-shm-usage',
          '--mockDeviceId',
          _deviceId2,
        ] : []),
      ],
      env: Object.assign({}, process.env, {
        TEST_INSTANCE: 'test-2',
        NODE_ENV: 'test',
        ...(process.env.CI ? { APP_DATA_PATH: `/tmp/${_deviceId2}/` } : {}),
      }),
      logger: {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`INSTANCE 2 -> ${name}: ${message}`),
      },
    });
    appWindow2 = await app2.firstWindow();
    appWindow2.on('console', msg => console.log(`INSTANCE 2 -> ${msg.text()}`));
  });

  after(async () => {
    if (process.env.CI) {
      console.log('/********** Main process logs **********/');
      console.log((await fs.readFile('coinstac-log.json')).toString());
    }

    return Promise.all([
      app1.close(),
      app2.close(),
    ]);
  });

  it('displays the correct title', async () => {
    return appWindow1.title().should.eventually.equal('COINSTAC');
  });

  it('authenticates demo user on first instance', async () => {
    await appWindow1.click('#login-username', { timeout: EXIST_TIMEOUT });
    await appWindow1.fill('#login-username', USER_ID_1);
    await appWindow1.fill('#login-password', PASS);

    await appWindow1.click('button:has-text("Log In")');

    // Assert
    return appWindow1.innerText('.user-account-name', { timeout: LOGIN_TIMEOUT }).should.eventually.equal(USER_ID_1);
  });

  it('authenticates demo user on second instance', async () => {
    await appWindow2.click('#login-username', { timeout: EXIST_TIMEOUT });
    await appWindow2.fill('#login-username', USER_ID_2);
    await appWindow2.fill('#login-password', PASS);

    await appWindow2.click('button:has-text("Log In")');

    // Assert
    return appWindow2.innerText('.user-account-name', { timeout: LOGIN_TIMEOUT }).should.eventually.equal(USER_ID_2);
  });

  it('accesses the Add Consortium page', async () => {
    await appWindow1.click('a:has-text("Consortia")');

    await appWindow1.click('a[name="create-consortium-button"]', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow1.waitForSelector('h4:has-text("Consortium Creation")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('creates a consortium', async () => {
    await appWindow1.fill('#name', CONS_NAME);
    await appWindow1.fill('#description', CONS_DESC);

    await appWindow1.click('button:has-text("Save")');

    // Assert
    await appWindow1.waitForSelector('div:has-text("Consortium Saved")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);

    await appWindow1.click('a:has-text("Consortia")');

    await appWindow1.waitForSelector(`h5:has-text("${CONS_NAME}")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('add another user as member', async () => {
    await appWindow1.click('a:has-text("Consortia")');

    await appWindow1.click(`a[name="${CONS_NAME}"]`, { timeout: EXIST_TIMEOUT });

    await appWindow1.click('.consortium-add-user', { timeout: EXIST_TIMEOUT });

    await appWindow1.click(`.react-select-dropdown-menu div:has-text("${USER_ID_2}")`, { timeout: EXIST_TIMEOUT });

    await appWindow1.click('button:has-text("Add Member")');

    // Assert
    return appWindow1.waitForSelector(`span:has-text("${USER_ID_2}")`, {
      state: 'visible',
      timeout: 30000,
    }).should.eventually.not.equal(null);
  });

  it('access consortium as member', async () => {
    await appWindow2.click('a:has-text("Consortia")');

    await appWindow2.click(`a[name="${CONS_NAME}"]`, { timeout: EXIST_TIMEOUT });

    // Assert
    return Promise.all([
      appWindow2.waitForSelector(`div:has-text("${USER_ID_2}")`, {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
      appWindow2.waitForSelector('#consortium-member-table tbody tr:last-child input[name="isOwner"]:checked', {
        state: 'hidden',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.equal(null),
    ]);
  });

  it('grant ownership to a member', async () => {
    await appWindow1.click('a:has-text("Consortia")');

    await appWindow1.click(`a[name="${CONS_NAME}"]`, { timeout: EXIST_TIMEOUT });

    await appWindow1.click('#consortium-member-table tbody tr:last-child input[name="isOwner"]', { timeout: EXIST_TIMEOUT });

    // Assert
    return Promise.all([
      appWindow2.waitForSelector(`div:has-text("${USER_ID_2}")`, {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
      appWindow2.waitForSelector('#consortium-member-table tbody tr:last-child input[name="isOwner"]:checked', {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
    ]);
  });

  it('deletes consortium', async () => {
    await appWindow1.click('a:has-text("Consortia")', { timeout: EXIST_TIMEOUT });

    await appWindow1.click(`button[name="${CONS_NAME}-delete"]`, { timeout: EXIST_TIMEOUT });

    await appWindow1.click('#list-delete-modal button:has-text("Delete")', { timeout: EXIST_TIMEOUT });

    // Assert

    // Wait for consortium item to be deleted from consortium list
    return appWindow1.waitForSelector(`h1:has-text("${CONS_NAME}")`, {
      state: 'hidden',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.equal(null);
  });

  it('logs out', async () => {
    await appWindow1.click('a:has-text("Log Out")', { timeout: EXIST_TIMEOUT });
    await appWindow2.click('a:has-text("Log Out")', { timeout: EXIST_TIMEOUT });

    // Assert
    return Promise.all([
      appWindow1.waitForSelector('button:has-text("Log In")', {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
      appWindow2.waitForSelector('button:has-text("Log In")', {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
    ]);
  });
});
