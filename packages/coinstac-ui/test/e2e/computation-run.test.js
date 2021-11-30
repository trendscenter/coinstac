/* eslint-disable no-console */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs').promises;
const { _electron: electron } = require('playwright');

const appPath = path.join(__dirname, '../..');

const EXIST_TIMEOUT = 10000000;
const COMPUTATION_TIMEOUT = 150000;
const COMPUTATION_DOWNLOAD_TIMEOUT = 40000;
const USER_ID = 'test1';
const PASS = 'password';
const CONS_NAME = 'e2e-consortium-single';
const CONS_DESC = 'e2e-description-single';
const PIPE_NAME = 'e2e-pipeline-single';
const PIPE_DESC = 'e2e-pipeline-description-single';
const COMPUTATION_NAME = 'Ridge Regression (Singleshot) - FreeSurfer Volumes';

chai.should();
chai.use(chaiAsPromised);

let appWindow;
let app;

describe('e2e run computation with 1 member', () => {
  before(async () => {
    await fs.rm('coinstac-log.json');
    app = await electron.launch({
      // path: electron,
      args: ['--enable-logging', appPath],
      env: Object.assign({}, process.env, { NODE_ENV: 'test' }),
      logger: {
        isEnabled: () => true,
        log: (name, severity, message) => console.log(`${name}: ${message}`),
      },
    });
    appWindow = await app.firstWindow();
    appWindow.on('console', msg => console.log(msg.text()));
  });

  after(async () => {
    // if (process.env.CI) {
      console.log('/********** Main process logs **********/');
      console.log((await fs.readFile('coinstac-log.json')).toString());
    // }
    return app.close();
  });

  it('displays the correct title', async () => {
    return appWindow.title().should.eventually.equal('COINSTAC');
  });

  it('authenticates demo user', async () => {
    await appWindow.click('#login-username', { timeout: EXIST_TIMEOUT });
    await appWindow.fill('#login-username', USER_ID);
    await appWindow.fill('#login-password', PASS);

    await appWindow.click('button:has-text("Log In")');

    // Assert
    return appWindow.innerText('.user-account-name', { timeout: EXIST_TIMEOUT }).should.eventually.equal(USER_ID);
  });

  it('accesses the Add Consortium page', async () => {
    await appWindow.click('a:has-text("Consortia")');

    await appWindow.click('a[name="create-consortium-button"]', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow.waitForSelector('h4:has-text("Consortium Creation")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('creates a consortium', async () => {
    await appWindow.fill('#name', CONS_NAME);
    await appWindow.fill('#description', CONS_DESC);

    await appWindow.click('button:has-text("Save")');

    // Assert
    await appWindow.waitForSelector('div:has-text("Consortium Saved")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);

    await appWindow.click('a:has-text("Consortia")');

    await appWindow.waitForSelector(`h5:has-text("${CONS_NAME}")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('accesses the Add Pipeline page', async () => {
    await appWindow.click('a:has-text("Pipelines")');

    await appWindow.click('a[name="create-pipeline-button"]', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow.waitForSelector('h4:has-text("Pipeline Creation")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('creates a pipeline', async () => {
    await appWindow.fill('#name', PIPE_NAME);
    await appWindow.fill('#description', PIPE_DESC);

    await appWindow.click('#pipelineconsortia', { timeout: EXIST_TIMEOUT });
    await appWindow.click(`#consortium-menu li:has-text("${CONS_NAME}")`, { timeout: EXIST_TIMEOUT });

    await appWindow.click('#computation-dropdown', { timeout: EXIST_TIMEOUT });
    await appWindow.click(`#computation-menu li:has-text("${COMPUTATION_NAME}")`, { timeout: EXIST_TIMEOUT });

    await appWindow.click('.pipeline-step', { timeout: EXIST_TIMEOUT });

    const addCovariate = async (name, type, index) => {
      await appWindow.click('button:has-text("Add Covariates")', { timeout: EXIST_TIMEOUT });

      await appWindow.click(`#covariates-${index}-data-dropdown`, { timeout: EXIST_TIMEOUT });
      await appWindow.click(`#covariates-${index}-data-dropdown-menu li:has-text("${type}")`, { timeout: EXIST_TIMEOUT });

      await appWindow.fill(`#covariates-${index}-input-name`, name);
    };

    await addCovariate('isControl', 'boolean', 0);
    await addCovariate('age', 'number', 1);

    await appWindow.click('button:has-text("Add Data")', { timeout: EXIST_TIMEOUT });

    await appWindow.click('#data-0-data-dropdown', { timeout: EXIST_TIMEOUT });
    await appWindow.click('#data-0-data-dropdown-menu li:has-text("FreeSurfer")', { timeout: EXIST_TIMEOUT });

    await appWindow.click('#data-0-area', { timeout: EXIST_TIMEOUT });
    await appWindow.click('#data-0-area .react-select-dropdown-menu div:has-text("5th-Ventricle")', { timeout: EXIST_TIMEOUT });

    await appWindow.fill('[name="step-lambda"]', '0');

    await appWindow.click('button:has-text("Save Pipeline")', { timeout: EXIST_TIMEOUT });

    // Assert
    await appWindow.waitForSelector('div:has-text("Pipeline Saved")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('sets the created pipeline to the consortium', async () => {
    await appWindow.click('a:has-text("Consortia")');

    await appWindow.click(`a[name="${CONS_NAME}"]`, { timeout: EXIST_TIMEOUT });

    await appWindow.click('#consortium-tabs span:has-text("Pipelines")', { timeout: EXIST_TIMEOUT });

    await appWindow.click('#owned-pipelines-dropdown', { timeout: EXIST_TIMEOUT });
    await appWindow.click(`#owned-pipelines-dropdown-menu li:has-text("${PIPE_NAME}")`, { timeout: EXIST_TIMEOUT });

    // Assert
    return Promise.all([
      appWindow.waitForSelector(`a:has-text("${PIPE_NAME}")`, {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
      appWindow.waitForSelector(`div:has-text("${COMPUTATION_NAME} Download Complete")`, {
        state: 'visible',
        timeout: COMPUTATION_DOWNLOAD_TIMEOUT,
      }).should.eventually.not.equal(null),
    ]);
  });

  it('map data to consortium', async () => {
    await appWindow.click('a:has-text("Maps")', { timeout: EXIST_TIMEOUT });

    await appWindow.click(`a[name="${CONS_NAME}"]`, { timeout: EXIST_TIMEOUT });

    await appWindow.click('button:has-text("Select File(s)")', { timeout: EXIST_TIMEOUT });

    await appWindow.click('button:has-text("Auto Map")', { timeout: EXIST_TIMEOUT });

    await appWindow.click('button:has-text("Save")', { timeout: EXIST_TIMEOUT });

    await appWindow.click('a:has-text("Consortia")', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow.waitForSelector('button:has-text("Start Pipeline")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('runs a computation', async () => {
    await appWindow.click('button:has-text("Start Pipeline")', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow.waitForSelector(`div:has-text("Pipeline Starting for ${CONS_NAME}.")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('displays computation progress', async () => {
    await appWindow.click('a:has-text("Home")', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow.waitForSelector('div.run-item-paper:first-child span:has-text("In Progress")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });

  it('displays results', async () => {
    // Wait for computation to complete (results button only shows up at the end of the run)
    await appWindow.click('div.run-item-paper:first-child a:has-text("View Results")', { timeout: COMPUTATION_TIMEOUT });

    // Assert
    return Promise.all([
      appWindow.waitForSelector('h3:has-text("Regressions")', {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
      appWindow.waitForSelector(`h6:has-text("Results: ${CONS_NAME} || ${PIPE_NAME}")`, {
        state: 'visible',
        timeout: EXIST_TIMEOUT,
      }).should.eventually.not.equal(null),
    ]);
  });

  it('deletes consortium', async () => {
    await appWindow.click('a:has-text("Consortia")', { timeout: EXIST_TIMEOUT });

    await appWindow.click(`button[name="${CONS_NAME}-delete"]`, { timeout: EXIST_TIMEOUT });

    await appWindow.click('#list-delete-modal button:has-text("Delete")', { timeout: EXIST_TIMEOUT });

    // Assert

    // Wait for consortium item to be deleted from consortium list
    return appWindow.waitForSelector(`h1:has-text("${CONS_NAME}")`, {
      state: 'hidden',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.equal(null);
  });

  it('logs out', async () => {
    await appWindow.click('a:has-text("Log Out")', { timeout: EXIST_TIMEOUT });

    // Assert
    return appWindow.waitForSelector('button:has-text("Log In")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  });
});
