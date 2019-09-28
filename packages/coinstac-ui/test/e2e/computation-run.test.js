const { Application } = require('spectron');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');

const electronPath = path.join(__dirname, '../..', 'node_modules', '.bin', 'electron');
const appPath = path.join(__dirname, '../..');
const mocksPath = path.join(__dirname, 'mocks.js');

const EXIST_TIMEOUT = 4000;
const NOTIFICATION_DISMISS_TIMEOUT = 6000;
const COMPUTATION_TIMEOUT = 120000;
const COMPUTATION_DOWNLOAD_TIMEOUT = 30000;
const USER_ID = 'test1';
const PASS = 'password';
const CONS_NAME = 'e2e-consortium';
const CONS_DESC = 'e2e-description';
const PIPE_NAME = 'e2e-pipeline';
const PIPE_DESC = 'e2e-pipeline-description';
const COMPUTATION_NAME = 'Single Shot Regression';

chai.should();
chai.use(chaiAsPromised);

const app = new Application({
  path: electronPath,
  env: { NODE_ENV: 'test', TEST_INSTANCE: 'test-1' },
  args: [appPath, '-r', mocksPath],
});

describe('e2e run computation with 1 member', () => {
  before(() => app.start());

  after(() => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('displays the correct title', () => (
    app.client.waitUntilWindowLoaded(10000).windowByIndex(1)
      .getTitle().should.eventually.equal('COINSTAC')
  ));

  it('authenticates demo user', () => (
    app.client
      .waitForVisible('#login-username', EXIST_TIMEOUT)
      .setValue('#login-username', USER_ID)
      .setValue('#login-password', PASS)
      .click('button=Log In')
      .waitForExist('.user-account-name', EXIST_TIMEOUT)
      .getText('.user-account-name').should.eventually.equal(USER_ID)
  ));

  it('accesses the Add Consortium page', () => (
    app.client
      .click('a=Consortia')
      .waitForVisible('a[name="create-consortium-button"]', EXIST_TIMEOUT)
      .click('a[name="create-consortium-button"]')
      .isVisible('h4=Consortium Creation').should.eventually.equal(true)
  ));

  it('creates a consortium', () => (
    app.client
      .setValue('#name', CONS_NAME)
      .setValue('#description', CONS_DESC)
      .click('button=Save')
      .waitForText('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Consortium Saved'))
      .then(() => app.client
        .waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true)
        .click('a=Consortia')
        .waitForVisible(`h1=${CONS_NAME}`))
  ));

  it('accesses the Add Pipeline page', () => (
    app.client
      .click('a=Pipelines')
      .waitForVisible('a[name="create-pipeline-button"]', EXIST_TIMEOUT)
      .click('a[name="create-pipeline-button"]')
      .isVisible('h4=Pipeline Creation').should.eventually.equal(true)
  ));

  it('creates a pipeline', () => (
    app.client
      .setValue('#name', PIPE_NAME)
      .setValue('#description', PIPE_DESC)
      .click('#pipelineconsortia')
      .waitForVisible('#consortium-menu', EXIST_TIMEOUT)
      .element('#consortium-menu')
      .click(`li=${CONS_NAME}`)
      .waitForVisible('#consortium-menu', EXIST_TIMEOUT, true)
      .click('#computation-dropdown')
      .waitForVisible('#computation-menu', EXIST_TIMEOUT)
      .element('#computation-menu')
      .click(`li=${COMPUTATION_NAME}`)
      .waitForVisible('#computation-menu', EXIST_TIMEOUT, true)
      .waitForVisible('.pipeline-step')
      .click('.pipeline-step')
      .waitForVisible('button=Add Covariates')
      .click('button=Add Covariates')
      .click('#covariates-0-data-dropdown')
      .waitForVisible('#covariates-0-data-dropdown-menu', EXIST_TIMEOUT)
      .element('#covariates-0-data-dropdown-menu')
      .click('li=boolean')
      .waitForVisible('#covariates-0-data-dropdown-menu', EXIST_TIMEOUT, true)
      .click('#input-source-0-dropdown')
      .waitForVisible('#input-source-0-dropdown-menu', EXIST_TIMEOUT)
      .element('#input-source-0-dropdown-menu')
      .click('li=File')
      .waitForVisible('#input-source-0-dropdown-menu', EXIST_TIMEOUT, true)
      .setValue('#covariates-0-input-name', 'isControl')
      .click('button=Add Covariates')
      .click('#covariates-1-data-dropdown')
      .waitForVisible('#covariates-1-data-dropdown-menu', EXIST_TIMEOUT)
      .element('#covariates-1-data-dropdown-menu')
      .click('li=number')
      .waitForVisible('#covariates-1-data-dropdown-menu', EXIST_TIMEOUT, true)
      .click('#input-source-1-dropdown')
      .waitForVisible('#input-source-1-dropdown-menu', EXIST_TIMEOUT)
      .element('#input-source-1-dropdown-menu')
      .click('li=File')
      .waitForVisible('#input-source-1-dropdown-menu', EXIST_TIMEOUT, true)
      .setValue('#covariates-1-input-name', 'age')
      .click('button=Add Data')
      .click('#data-0-data-dropdown')
      .waitForVisible('#data-0-data-dropdown-menu', EXIST_TIMEOUT)
      .element('#data-0-data-dropdown-menu')
      .click('li=FreeSurfer')
      .waitForVisible('#data-0-data-dropdown-menu', EXIST_TIMEOUT, true)
      .click('#data-0-area')
      .waitForVisible('#data-0-area .react-select-dropdown-menu', EXIST_TIMEOUT)
      .element('#data-0-area .react-select-dropdown-menu')
      .click('div=5th-Ventricle', EXIST_TIMEOUT)
      .waitForVisible('#data-0-area .react-select-dropdown-menu', EXIST_TIMEOUT, true)
      .click('#data-0-area')
      .waitForVisible('#data-0-area .react-select-dropdown-menu', EXIST_TIMEOUT)
      .element('#data-0-area .react-select-dropdown-menu')
      .click('div=BrainSegVol', EXIST_TIMEOUT)
      .waitForVisible('#data-0-area .react-select-dropdown-menu', EXIST_TIMEOUT, true)
      .setValue('[name="step-lambda"]', '0')
      .click('button=Save Pipeline')
      .waitForVisible('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Pipeline Saved.'))
      .then(() => app.client
        .waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true))
  ));

  it('sets the created pipeline to the consortium', () => (
    app.client
      .click('a=Consortia')
      .waitForVisible(`a[name="${CONS_NAME}"]`, EXIST_TIMEOUT)
      .click(`a[name="${CONS_NAME}"]`)
      .waitForVisible('#consortium-tabs', EXIST_TIMEOUT)
      .element('#consortium-tabs')
      .click('span=Pipelines')
      .waitForVisible('#owned-pipelines-dropdown', EXIST_TIMEOUT)
      .click('#owned-pipelines-dropdown')
      .waitForVisible('#owned-pipelines-dropdown-menu', EXIST_TIMEOUT)
      .element('#owned-pipelines-dropdown-menu')
      .click(`li=${PIPE_NAME}`)
      .waitForVisible(`a=${PIPE_NAME}`, EXIST_TIMEOUT)
      .waitForVisible('.notification-message=Pipeline computations downloading via Docker.', EXIST_TIMEOUT)
      .element('.notification:last-child')
      .click('.notification-dismiss')
      .waitForVisible('.notification-message=Pipeline computations downloading via Docker.', EXIST_TIMEOUT, true)
      .waitForVisible(`.notification-message=${COMPUTATION_NAME} Download Complete`, COMPUTATION_DOWNLOAD_TIMEOUT)
      .element('.notification:last-child')
      .click('.notification-dismiss')
      .waitForVisible(`.notification-message=${COMPUTATION_NAME} Download Complete`, EXIST_TIMEOUT, true)
      .waitForVisible('.notification-message*=Pipeline Computations Downloaded', COMPUTATION_DOWNLOAD_TIMEOUT)
      .element('.notification:last-child')
      .click('.notification-dismiss')
      .waitForVisible('.notification-message*=Pipeline Computations Downloaded', EXIST_TIMEOUT, true)
  ));

  it('map data to consortium', () => (
    app.client
      .click('a=Maps')
      .waitForVisible(`a[name="${CONS_NAME}-map-data"]`, 20000)
      .click(`a[name="${CONS_NAME}-map-data"]`)
      .waitForVisible('button=Add Files Group', EXIST_TIMEOUT)
      .click('button=Add Files Group')
      .waitForVisible('button=Auto Map', EXIST_TIMEOUT)
      .click('button=Auto Map')
      .waitForVisible('button=Save', EXIST_TIMEOUT)
      .click('button=Save')
      .waitForVisible('a=Back to Consortia', EXIST_TIMEOUT)
      .click('a=Back to Consortia')
  ));

  it('runs a computation', () => (
    app.client
      .waitForVisible('button=Start Pipeline', EXIST_TIMEOUT)
      .click('button=Start Pipeline')
      .waitForText('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal(`Decentralized Pipeline Starting for ${CONS_NAME}.`))
      .then(() => app.client.waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true))
  ));

  it('displays computation progress', () => (
    app.client
      .click('a=Home')
      .waitForVisible('div.run-item-paper:first-child', EXIST_TIMEOUT)
      .element('div.run-item-paper:first-child')
      .isVisible('span=In Progress').should.eventually.equal(true)
  ));

  it('displays results', () => (
    app.client
      .click('a=Home')
      .waitForVisible('div.run-item-paper:first-child', EXIST_TIMEOUT)
      .element('div.run-item-paper:first-child')
      .waitForVisible('a=View Results', COMPUTATION_TIMEOUT)
      .element('div.run-item-paper:first-child')
      .click('a=View Results')
      .waitForVisible('h3=Regressions', EXIST_TIMEOUT)
      .isVisible(`h6=Results: ${CONS_NAME} || ${PIPE_NAME}`).should.eventually.equal(true)
  ));

  it('deletes consortium', () => (
    app.client
      .click('a=Consortia')
      .waitForVisible(`button[name="${CONS_NAME}-delete"]`, EXIST_TIMEOUT)
      .click(`button[name="${CONS_NAME}-delete"]`)
      .waitForVisible('#list-delete-modal')
      .element('#list-delete-modal')
      .click('button=Delete')
      .waitForVisible(`h1=${CONS_NAME}`, EXIST_TIMEOUT, true)
  ));

  it('logs out', () => (
    app.client
      .waitForVisible('a=Log Out', EXIST_TIMEOUT)
      .click('a=Log Out')
      .waitForVisible('button=Log In', EXIST_TIMEOUT)
  ));
});
