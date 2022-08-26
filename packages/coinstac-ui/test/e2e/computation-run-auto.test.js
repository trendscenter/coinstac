/* eslint-disable no-console, no-empty */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs').promises;
const { _electron: electron } = require('playwright');
const { exec } = require('child_process');

const COMP_NAME = process.env.npm_config_comp_name;
const COMP_ALIAS = process.env.npm_config_comp_alias;
const COMP_SITES = process.env.npm_config_comp_sites;
const COMP_DATA_TYPE = process.env.npm_config_comp_data_type;
const COMP_TIMEOUT = parseInt(process.env.npm_config_comp_timeout);
const COMP_COVARIATES = process.env.npm_config_comp_covariates;

console.log(COMP_NAME, COMP_ALIAS, COMP_SITES, COMP_DATA_TYPE, COMP_TIMEOUT,COMP_COVARIATES);

const appPath = path.join(__dirname, '../..');

const EXIST_TIMEOUT = 30000;
const LOGIN_TIMEOUT = 30000;
const COMPUTATION_TIMEOUT = COMP_TIMEOUT;
const COMPUTATION_DOWNLOAD_TIMEOUT = 40000;
const USER_ID_1 = 'test1';
const USER_ID_2 = 'test2';
const PASS = 'password';
const CONS_NAME = `${COMP_ALIAS}-consortium-${COMP_SITES}-member`;
const CONS_DESC = ' ';
const PIPE_NAME = `${COMP_ALIAS}-pipeline`;
const PIPE_DESC = ' ';
const COMPUTATION_NAME = COMP_NAME;

chai.should();
chai.use(chaiAsPromised);

let app1;
let app2;
let appWindow1;
let appWindow2;
const _deviceId1 = 'test1';
const _deviceId2 = 'test2';
describe(`e2e run computation with ${COMP_SITES} members`, () => {
  afterEach(async function screenshot() {
    if (process.env.CI && this.currentTest.state === 'failed') {
      await fs.mkdir('/tmp/screenshots', { recursive: true });
      exec(`xwd -root -silent | convert xwd:- png:/tmp/screenshots/screenshot-${this.currentTest.title.replaceAll(' ', '-')}$(date +%s).png`);
    }
  });
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
    appWindow1.on('pageerror', (err) => {
      console.log(`******** Window Error Instance 1: ${err.message}`);
    });

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
        ...(process.env.CI ? { APP_DATA_PATH: `/tmp/${_deviceId2}/`, CI_PORT_START: '8106' } : {}),
      }),
      logger: {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`INSTANCE 2 -> ${name}: ${message}`),
      },
    });
    appWindow2 = await app2.firstWindow();
    appWindow2.on('console', msg => console.log(`INSTANCE 2 -> ${msg.text()}`));
    appWindow2.on('pageerror', (err) => {
      console.log(`******** Window Error Instance 2: ${err.message}`);
    });
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

    try {
      await appWindow1.click('button:has-text("Never Show Again")', { timeout: 5000 });
    } catch {}

    // Assert
    return appWindow1.innerText('.user-account-name', { timeout: LOGIN_TIMEOUT }).should.eventually.equal(USER_ID_1);
  });

  it('authenticates demo user on second instance', async () => {
    await appWindow2.click('#login-username', { timeout: EXIST_TIMEOUT });
    await appWindow2.fill('#login-username', USER_ID_2);
    await appWindow2.fill('#login-password', PASS);

    await appWindow2.click('button:has-text("Log In")');

    try {
      await appWindow2.click('button:has-text("Never Show Again")', { timeout: 5000 });
    } catch {}

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

  it('accesses the Add Pipeline page', async () => {
    await appWindow1.click('a:has-text("Pipelines")');

    await appWindow1.click('a[name="create-pipeline-button"]', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow1.waitForSelector('h4:has-text("Pipeline Creation")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('creates a pipeline', async () => {
    await appWindow1.fill('#name', PIPE_NAME);
    await appWindow1.fill('#description', PIPE_DESC);

    await appWindow1.click('#pipelineconsortia', { timeout: EXIST_TIMEOUT });
    await appWindow1.click(`#consortium-menu li:has-text("${CONS_NAME}")`, { timeout: EXIST_TIMEOUT });

    await appWindow1.click('#computation-dropdown', { timeout: EXIST_TIMEOUT });
    await appWindow1.click(`#computation-menu li:has-text("${COMPUTATION_NAME}")`, { timeout: EXIST_TIMEOUT });

    await appWindow1.click('.pipeline-step', { timeout: EXIST_TIMEOUT });

    const addCovariate = async (name, type, index) => {
      await appWindow1.click('button:has-text("Add Covariates")', { timeout: EXIST_TIMEOUT });

      await appWindow1.click(`#covariates-${index}-data-dropdown`, { timeout: EXIST_TIMEOUT });
      await appWindow1.click(`#covariates-${index}-data-dropdown-menu li:has-text("${type}")`, { timeout: EXIST_TIMEOUT });

      await appWindow1.fill(`#covariates-${index}-input-name`, name);

      //await appWindow1.waitForSelector(`#covariates-${index}-input-name:has-text("${name}")`, { timeout: EXIST_TIMEOUT });
    };

    if (COMP_COVARIATES) {
      let covariates = COMP_COVARIATES;
      if (typeof covariates === 'string') {
        try {
          covariates = JSON.parse(covariates);
        } catch {}
      }
      if (typeof covariates === 'object') {
        return Promise.all(Object.keys(covariates).map(async (key, index) => {
          await addCovariate(covariates[index].name, covariates[index].type, index);
        }));
      }
    }

    await appWindow1.click('button:has-text("Add Data")', { timeout: EXIST_TIMEOUT });

    await appWindow1.click('#data-0-data-dropdown', { timeout: EXIST_TIMEOUT });
    await appWindow1.click('#data-0-data-dropdown-menu li:has-text("FreeSurfer")', { timeout: EXIST_TIMEOUT });

    await appWindow1.click('#data-0-area', { timeout: EXIST_TIMEOUT });
    await appWindow1.click('#data-0-area .react-select-dropdown-menu div:has-text("5th-Ventricle")', { timeout: EXIST_TIMEOUT });

    await appWindow1.fill('[name="step-lambda"]', '0');

    await appWindow1.click('button:has-text("Save Pipeline")', { timeout: EXIST_TIMEOUT });

    // Assert
    await appWindow1.waitForSelector('div:has-text("Pipeline Saved")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('sets the created pipeline to the consortium', async () => {
    await appWindow1.click('a:has-text("Consortia")');

    await appWindow1.click(`a[name="${CONS_NAME}"]`, { timeout: EXIST_TIMEOUT });

    await appWindow1.click('#consortium-tabs span:has-text("Pipelines")', { timeout: EXIST_TIMEOUT });

    await appWindow1.click('#owned-pipelines-dropdown', { timeout: EXIST_TIMEOUT });
    await appWindow1.click(`#owned-pipelines-dropdown-menu li:has-text("${PIPE_NAME}")`, { timeout: EXIST_TIMEOUT });

    // Assert
    return Promise.all([
      appWindow1.waitForSelector(`a:has-text("${PIPE_NAME}")`, {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
      appWindow1.waitForSelector(`div:has-text("${COMPUTATION_NAME} Download Complete")`, {
        state: 'visible',
        timeout: COMPUTATION_DOWNLOAD_TIMEOUT,
      }).should.eventually.not.equal(null),
    ]);
  });

  it('joins a consortium', async () => {
    await appWindow2.click('a:has-text("Consortia")');

    await appWindow2.click(`button[name="${CONS_NAME}-join-cons-button"]`, { timeout: EXIST_TIMEOUT });

    // Assert
    return Promise.all([
      appWindow2.waitForSelector(`button[name="${CONS_NAME}-leave-cons-button"]`, {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
      appWindow2.waitForSelector(`div:has-text("${COMPUTATION_NAME} Download Complete")`, {
        state: 'visible',
        timeout: COMPUTATION_DOWNLOAD_TIMEOUT,
      }).should.eventually.not.equal(null),
    ]);
  });

  it('map data to consortium on site 1', async () => {
    await appWindow1.click('a:has-text("Maps")', { timeout: EXIST_TIMEOUT });

    await appWindow1.click(`a[name="${CONS_NAME}"]`, { timeout: EXIST_TIMEOUT });

    await appWindow1.click('button:has-text("Select File(s)")', { timeout: EXIST_TIMEOUT });

    await appWindow1.click('button:has-text("Auto Map")', { timeout: EXIST_TIMEOUT });

    await appWindow1.click('button:has-text("Save")', { timeout: EXIST_TIMEOUT });

    await appWindow1.click('a:has-text("Consortia")', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow1.waitForSelector('button:has-text("Start Pipeline")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('map data to consortium on site 2', async () => {
    await appWindow2.click('a:has-text("Maps")', { timeout: EXIST_TIMEOUT });

    await appWindow2.click(`a[name="${CONS_NAME}"]`, { timeout: EXIST_TIMEOUT });

    await appWindow2.click('button:has-text("Select File(s)")', { timeout: EXIST_TIMEOUT });

    await appWindow2.click('button:has-text("Auto Map")', { timeout: EXIST_TIMEOUT });

    await appWindow2.click('button:has-text("Save")', { timeout: EXIST_TIMEOUT });

    await appWindow2.click('a:has-text("Consortia")', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow2.waitForSelector('button:has-text("Map Local Data")', {
      state: 'hidden',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.equal(null);
  });

  it('runs a computation', async () => {
    await appWindow1.click('button:has-text("Start Pipeline")', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow1.waitForSelector(`div:has-text("Pipeline Starting for ${CONS_NAME}.")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('displays computation progress', async () => {
    await appWindow1.click('a:has-text("Home")', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow1.waitForSelector('div.run-item-paper:first-child span:has-text("In Progress")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('displays results', async () => {
    // Wait for computation to complete (results button only shows up at the end of the run)
    await appWindow1.click('div.run-item-paper:first-child a:has-text("View Results")', { timeout: COMPUTATION_TIMEOUT });

    // Assert
    return Promise.all([
      appWindow1.waitForSelector('h3:has-text("Regressions")', {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
      appWindow1.waitForSelector(`h6:has-text("Results: ${CONS_NAME} | ${PIPE_NAME}")`, {
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
