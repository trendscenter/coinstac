const Application = require('spectron').Application;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');

const electronPath = path.join(__dirname, '../..', 'node_modules', '.bin', 'electron');
const appPath = path.join(__dirname, '../..');
const mocksPath = path.join(__dirname, 'mocks.js');

const EXIST_TIMEOUT = 4000;
const NOTIFICATION_DISMISS_TIMEOUT = 6000;
const USER_ID = 'test1';
const PASS = 'password';
const CONS_NAME = 'e2e-consortium';
const CONS_DESC = 'e2e-description';
const PIPE_NAME = 'e2e-pipeline';
const PIPE_DESC = 'e2e-pipeline-description';
const PROJECT_NAME = 'e2e-files';

chai.should();
chai.use(chaiAsPromised);

const app = new Application({
  path: electronPath,
  env: { NODE_ENV: 'test' },
  args: [appPath, '-r', mocksPath],
});

describe('Testing::e2e', () => {
  before(() => app.start());

  after(() => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('opens a single window', () => (
    app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1)
  ));

  it('displays the correct title', () => (
    app.client.waitUntilWindowLoaded()
      .getTitle().should.eventually.equal('COINSTAC')
  ));

  it('authenticates demo user', () => (
    app.client
      .setValue('#login-username', USER_ID)
      .setValue('#login-password', PASS)
      .click('button=Log In')
      .waitForExist('.user-account-name', EXIST_TIMEOUT)
      .getText('.user-account-name').should.eventually.equal(USER_ID)
  ));

  it('accesses the Add Consortium page', () => (
    app.client
      .click('a=Consortia')
      .waitForExist('a=Create Consortium', EXIST_TIMEOUT)
      .click('a=Create Consortium')
      .isVisible('h1=Consortium Creation').should.eventually.equal(true)
  ));

  it('creates a consortium', () => (
    app.client
      .setValue('#name', CONS_NAME)
      .setValue('#description', CONS_DESC)
      .click('button=Save')
      .waitForText('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Consortium Saved'))
      .then(() =>
        // wait for the notification message to disappear
        app.client.waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true)
      )
  ));

  it('accesses the Add Pipeline page', () => (
    app.client
      .click('a=Pipelines')
      .waitForExist('a=Create Pipeline', EXIST_TIMEOUT)
      .click('a=Create Pipeline')
      .isVisible('h1=Pipeline Creation').should.eventually.equal(true)
  ));

  it('creates a pipeline', () => (
    app.client
      .setValue('#name', PIPE_NAME)
      .setValue('#description', PIPE_DESC)
      .click('#pipelineconsortia')
      .waitForExist('.dropdown-menu[aria-labelledby="pipelineconsortia"]', EXIST_TIMEOUT)
      .click(`a=${CONS_NAME}`)
      .click('#computation-dropdown')
      .waitForExist('.dropdown-menu[aria-labelledby="computation-dropdown"]', EXIST_TIMEOUT)
      .click('a=single shot regression demo')
      .waitForExist('button=Add Covariates')
      .click('button=Add Covariates')
      .click('#covariates-0-data-dropdown')
      .waitForExist('.dropdown-menu[aria-labelledby="covariates-0-data-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="covariates-0-data-dropdown"]')
      .click('a=boolean')
      .click('#input-source-0-dropdown')
      .waitForExist('.dropdown-menu[aria-labelledby="input-source-0-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="input-source-0-dropdown"]')
      .click('a=File')
      .setValue('#covariates-0-input-name', 'isControl')
      .click('button=Add Covariates')
      .click('#covariates-1-data-dropdown')
      .waitForExist('.dropdown-menu[aria-labelledby="covariates-1-data-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="covariates-1-data-dropdown"]')
      .click('a=number')
      .click('#input-source-1-dropdown')
      .waitForExist('.dropdown-menu[aria-labelledby="input-source-1-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="input-source-1-dropdown"]')
      .click('a=File')
      .setValue('#covariates-1-input-name', 'age')
      .click('button=Add Data')
      .click('#data-0-data-dropdown')
      .waitForExist('.dropdown-menu[aria-labelledby="data-0-data-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="data-0-data-dropdown"]')
      .click('a=FreeSurfer')
      .click('#data-0-area .Select-control')
      .waitForExist('#data-0-area .Select-menu-outer', EXIST_TIMEOUT)
      .element('#data-0-area .Select-menu-outer')
      .click('div=5th-Ventricle', EXIST_TIMEOUT)
      .click('div=BrainSegVol', EXIST_TIMEOUT)
      .setValue('[name="step-lambda"]', '0')
      .click('button=Save Pipeline')
      .waitForExist('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Pipeline Saved.'))
      .then(() =>
        // wait for the notification message to disappear
        app.client
          .waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true)
      )
  ));
/*
  it('accesses the New Files Collection page', () => (
    app.client
      .click('a=My Files')
      .waitForExist('a=Add Files Collection', EXIST_TIMEOUT)
      .click('a=Add Files Collection')
      .isVisible('h1=New Files Collection').should.eventually.equal(true)
  ));

  it('adds files to a consortium', () => (
    app.client
      .setValue('#form-project-name', PROJECT_NAME)
      .selectByVisibleText('#form-project-consortium-id', CONS_NAME)
      .click('button=Add File')
      .waitForExist('#project-covariates-mapper-1', EXIST_TIMEOUT)
      .selectByValue('#project-covariates-mapper-1', '0')
      .selectByValue('#project-covariates-mapper-2', '1')
      .click('button=Save')
      .waitForExist('div.panel-heading h4.panel-title', EXIST_TIMEOUT)
      .getText('div.panel-heading h4.panel-title a').should.eventually.include(PROJECT_NAME)
  ));

  it('runs a computation', () => (
    app.client
      .click(`#run-${CONS_NAME}`)
      .waitForExist('span=Complete', EXIST_TIMEOUT)
  ));

  it('displays results', () => (
    app.client
      .waitForExist(`#results-${CONS_NAME}`)
      .click(`#results-${CONS_NAME}`)
      .waitForExist('#results', EXIST_TIMEOUT)
      .waitForExist('span=Complete!', EXIST_TIMEOUT)
  ));

  it('deletes files', () => (
    app.client
      .click('a=My Files')
      .waitForExist('a=Add Files Collection', EXIST_TIMEOUT)
      .click(`#delete-${CONS_NAME}`)
      .isVisible(`#delete-${CONS_NAME}`).should.eventually.equal(false)
  ));

  it('deletes a consortium', () => (
    app.client
      .click('a=Consortia')
      .waitForExist('a=Add Consortium', EXIST_TIMEOUT)
      .click(`#delete-${CONS_NAME}`)
      .isVisible(`a=${CONS_NAME}`).should.eventually.equal(false)
  ));*/

  it('logs out', () => (
    app.client
      .click('button=Log Out')
      .waitForExist('button=Log In', EXIST_TIMEOUT)
  ));
});
