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
const USER_ID_1 = 'test1';
const USER_ID_2 = 'test2';
const PASS = 'password';
const CONS_NAME = 'e2e-consortium';
const CONS_DESC = 'e2e-description';
const PIPE_NAME = 'e2e-pipeline';
const PIPE_DESC = 'e2e-pipeline-description';
const COMPUTATION_NAME = 'single shot regression demo';

chai.should();
chai.use(chaiAsPromised);

const app1 = new Application({
  path: electronPath,
  env: { NODE_ENV: 'test', TEST_INSTANCE: 'test-1' },
  args: [appPath, '-r', mocksPath],
});

const app2 = new Application({
  path: electronPath,
  env: { NODE_ENV: 'test', TEST_INSTANCE: 'test-2' },
  args: [appPath, '-r', mocksPath],
});

describe('Testing::e2e', () => {
  before(() => (
    Promise.all([
      app1.start(),
      app2.start(),
    ])
  ));

  after(() => (
    Promise.all([
      app1.stop(),
      app2.browserWindow.close(),
    ])
  ));

  it('opens a single window on first instance', () => (
    app1.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1)
  ));

  it('opens a single window on second instance', () => (
    app2.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1)
  ));

  it('displays the correct title', () => (
    app1.client.waitUntilWindowLoaded()
      .getTitle().should.eventually.equal('COINSTAC')
  ));

  it('authenticates demo user on first instance', () => (
    app1.client
      .waitForVisible('#login-username', EXIST_TIMEOUT)
      .setValue('#login-username', USER_ID_1)
      .setValue('#login-password', PASS)
      .click('button=Log In')
      .waitForExist('.user-account-name', EXIST_TIMEOUT)
      .getText('.user-account-name').should.eventually.equal(USER_ID_1)
  ));

  it('authenticates demo user on second instance', () => (
    app2.client
      .waitForVisible('#login-username', EXIST_TIMEOUT)
      .setValue('#login-username', USER_ID_2)
      .setValue('#login-password', PASS)
      .click('button=Log In')
      .waitForExist('.user-account-name', EXIST_TIMEOUT)
      .getText('.user-account-name').should.eventually.equal(USER_ID_2)
  ));

  it('accesses the Add Consortium page', () => (
    app1.client
      .click('a=Consortia')
      .waitForVisible('a=Create Consortium', EXIST_TIMEOUT)
      .click('a=Create Consortium')
      .isVisible('h1=Consortium Creation').should.eventually.equal(true)
  ));

  it('creates a consortium', () => (
    app1.client
      .setValue('#name', CONS_NAME)
      .setValue('#description', CONS_DESC)
      .click('button=Save')
      .waitForText('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Consortium Saved'))
      .then(() => app1.client
        .waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true)
        .click('a=Consortia')
        .waitForVisible(`h3=${CONS_NAME}`))
  ));

  it('accesses the Add Pipeline page', () => (
    app1.client
      .click('a=Pipelines')
      .waitForVisible('a=Create Pipeline', EXIST_TIMEOUT)
      .click('a=Create Pipeline')
      .isVisible('h1=Pipeline Creation').should.eventually.equal(true)
  ));

  it('creates a pipeline', () => (
    app1.client
      .setValue('#name', PIPE_NAME)
      .setValue('#description', PIPE_DESC)
      .click('#pipelineconsortia')
      .waitForVisible('.dropdown-menu[aria-labelledby="pipelineconsortia"]', EXIST_TIMEOUT)
      .click(`a=${CONS_NAME}`)
      .click('#computation-dropdown')
      .waitForVisible('.dropdown-menu[aria-labelledby="computation-dropdown"]', EXIST_TIMEOUT)
      .click(`a=${COMPUTATION_NAME}`)
      .waitForVisible('button=Add Covariates')
      .click('button=Add Covariates')
      .click('#covariates-0-data-dropdown')
      .waitForVisible('.dropdown-menu[aria-labelledby="covariates-0-data-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="covariates-0-data-dropdown"]')
      .click('a=boolean')
      .click('#input-source-0-dropdown')
      .waitForVisible('.dropdown-menu[aria-labelledby="input-source-0-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="input-source-0-dropdown"]')
      .click('a=File')
      .setValue('#covariates-0-input-name', 'isControl')
      .click('button=Add Covariates')
      .click('#covariates-1-data-dropdown')
      .waitForVisible('.dropdown-menu[aria-labelledby="covariates-1-data-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="covariates-1-data-dropdown"]')
      .click('a=number')
      .click('#input-source-1-dropdown')
      .waitForVisible('.dropdown-menu[aria-labelledby="input-source-1-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="input-source-1-dropdown"]')
      .click('a=File')
      .setValue('#covariates-1-input-name', 'age')
      .click('button=Add Data')
      .click('#data-0-data-dropdown')
      .waitForVisible('.dropdown-menu[aria-labelledby="data-0-data-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="data-0-data-dropdown"]')
      .click('a=FreeSurfer')
      .click('#data-0-area .Select-control')
      .waitForVisible('#data-0-area .Select-menu-outer', EXIST_TIMEOUT)
      .element('#data-0-area .Select-menu-outer')
      .click('div=5th-Ventricle', EXIST_TIMEOUT)
      .click('#data-0-area .Select-control')
      .waitForVisible('#data-0-area .Select-menu-outer', EXIST_TIMEOUT)
      .element('#data-0-area .Select-menu-outer')
      .click('div=BrainSegVol', EXIST_TIMEOUT)
      .setValue('[name="step-lambda"]', '0')
      .click('button=Save Pipeline')
      .waitForVisible('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Pipeline Saved.'))
      .then(() => app1.client
        .click('.notification .notification-dismiss')) // Click on dismiss notification button
  ));

  it('sets the created pipeline to the consortium', () => (
    app1.client
      .click('a=Consortia')
      .waitForVisible(`a[name="${CONS_NAME}"]`, EXIST_TIMEOUT)
      .click(`a[name="${CONS_NAME}"]`)
      .waitForExist('#consortium-tabs #consortium-tabs-tab-2', EXIST_TIMEOUT)
      .element('#consortium-tabs')
      .click('a=Pipelines')
      .waitForVisible('#owned-pipelines-dropdown', EXIST_TIMEOUT)
      .click('#owned-pipelines-dropdown')
      .waitForVisible('.dropdown-menu[aria-labelledby="owned-pipelines-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="owned-pipelines-dropdown"]')
      .click(`a=${PIPE_NAME}`)
      .waitForVisible(`h4=${PIPE_NAME}`, EXIST_TIMEOUT)
  ));

  it('joins a consortium', () => (
    app2.client
      .click('a=Consortia')
      .waitForVisible(`button[name="${CONS_NAME}-join-cons-button"]`, EXIST_TIMEOUT)
      .click(`button[name="${CONS_NAME}-join-cons-button"]`)
      .waitForVisible(`button[name="${CONS_NAME}-leave-cons-button"]`, EXIST_TIMEOUT)
      .waitForVisible('div=Pipeline computations downloading via Docker.', EXIST_TIMEOUT)
      .click('.notification .notification-dismiss')
      .waitForVisible('div=Pipeline computations downloading via Docker.', EXIST_TIMEOUT, true)
      .waitForVisible(`div=${COMPUTATION_NAME} Download Complete`, COMPUTATION_DOWNLOAD_TIMEOUT) // Dismiss computation download notification
      .click('.notification .notification-dismiss')
      .waitForVisible(`div=${COMPUTATION_NAME} Download Complete`, NOTIFICATION_DISMISS_TIMEOUT, true)
      .waitForVisible('.notification', COMPUTATION_DOWNLOAD_TIMEOUT)
      .click('.notification .notification-dismiss')
      .waitForVisible('.notification', NOTIFICATION_DISMISS_TIMEOUT, true)
  ));

  it('creates a file collection for instance 1', () => (
    app1.client
      .click('a=Collections')
      .waitForVisible('a=Create File Collection', EXIST_TIMEOUT)
      .click('a=Create File Collection')
      .waitForVisible('h1=New Collection', EXIST_TIMEOUT)
      .setValue('#name', CONS_NAME)
      .setValue('#description', CONS_DESC)
      .click('button=Save')
      .waitForText('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Collection Saved.'))
      .then(() => app1.client.waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true))
  ));

  it('sets the data set into the file collection for instance 1', () => (
    app1.client
      .element('#collection-tabs')
      .click('a=Files')
      .waitForVisible('h3=Collection Files', EXIST_TIMEOUT)
      .click('button=Add Group')
      .waitForVisible('button=Add Files Group', EXIST_TIMEOUT)
      .click('label=A metadata file containing file paths and covariates.')
      .click('button=Add Files Group')
      .waitForVisible('button=Remove File Group', EXIST_TIMEOUT)
      .waitForVisible('.notification-message', EXIST_TIMEOUT)
      .waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true)
      .element('#collection-tabs')
      .click('a=Consortia')
      .waitForVisible('h3=Add to Consortia', EXIST_TIMEOUT)
      .click('#member-consortia-dropdown')
      .waitForVisible('.dropdown-menu[aria-labelledby="member-consortia-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="member-consortia-dropdown"]')
      .click(`a=${CONS_NAME}`)
      .waitForVisible('div.panel', EXIST_TIMEOUT)
      .element('.tab-pane.active .panel-body li')
      .click('select')
      .element('.tab-pane.active .panel-body li')
      .click('option=Group 1 (.CSV)')
      .element('.tab-pane.active .panel-body li:nth-child(2)')
      .click('select')
      .element('.tab-pane.active .panel-body li:nth-child(2)')
      .click('option=Group 1 (.CSV)')
      .element('.tab-pane.active .panel-body > div:nth-child(2)')
      .click('select')
      .element('.tab-pane.active .panel-body > div:nth-child(2)')
      .click('option=Group 1 (.CSV)')
      .element('.tab-pane.active')
      .click('button=Save')
      .waitForText('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Collection Saved.'))
      .then(() => app1.client.waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true))
  ));

  it('creates a file collection for instance 2', () => (
    app2.client
      .click('a=Collections')
      .waitForVisible('a=Create File Collection', EXIST_TIMEOUT)
      .click('a=Create File Collection')
      .waitForVisible('h1=New Collection', EXIST_TIMEOUT)
      .setValue('#name', CONS_NAME)
      .setValue('#description', CONS_DESC)
      .click('button=Save')
      .waitForText('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Collection Saved.'))
      .then(() => app2.client.waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true))
  ));

  it('sets the data set into the file collection for instance 2', () => (
    app2.client
      .element('#collection-tabs')
      .click('a=Files')
      .waitForVisible('h3=Collection Files', EXIST_TIMEOUT)
      .click('button=Add Group')
      .waitForVisible('button=Add Files Group', EXIST_TIMEOUT)
      .click('label=A metadata file containing file paths and covariates.')
      .click('button=Add Files Group')
      .waitForVisible('button=Remove File Group', EXIST_TIMEOUT)
      .waitForVisible('.notification-message', EXIST_TIMEOUT)
      .waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true)
      .element('#collection-tabs')
      .click('a=Consortia')
      .waitForVisible('h3=Add to Consortia', EXIST_TIMEOUT)
      .click('#member-consortia-dropdown')
      .waitForVisible('.dropdown-menu[aria-labelledby="member-consortia-dropdown"]', EXIST_TIMEOUT)
      .element('.dropdown-menu[aria-labelledby="member-consortia-dropdown"]')
      .click(`a=${CONS_NAME}`)
      .waitForVisible('div.panel', EXIST_TIMEOUT)
      .element('.tab-pane.active .panel-body li')
      .click('select')
      .element('.tab-pane.active .panel-body li')
      .click('option=Group 1 (.CSV)')
      .element('.tab-pane.active .panel-body li:nth-child(2)')
      .click('select')
      .element('.tab-pane.active .panel-body li:nth-child(2)')
      .click('option=Group 1 (.CSV)')
      .element('.tab-pane.active .panel-body > div:nth-child(2)')
      .click('select')
      .element('.tab-pane.active .panel-body > div:nth-child(2)')
      .click('option=Group 1 (.CSV)')
      .element('.tab-pane.active')
      .click('button=Save')
      .waitForText('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal('Collection Saved.'))
      .then(() => app2.client.waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true))
  ));

  it('runs a computation', () => (
    app1.client
      .click('a=Consortia')
      .waitForVisible('h1=Consortia', EXIST_TIMEOUT)
      .click('button=Start Pipeline')
      .waitForText('.notification-message', EXIST_TIMEOUT)
      .getText('.notification-message')
      .then(notificationMessage => notificationMessage.should.equal(`Decentralized Pipeline Starting for ${CONS_NAME}.`))
      .then(() => app1.client.waitForVisible('.notification-message', NOTIFICATION_DISMISS_TIMEOUT, true))
  ));

  it('displays computation progress', () => (
    app1.client
      .click('a=Home')
      .waitForVisible('div.panel:first-child', EXIST_TIMEOUT)
      .element('div.panel:first-child')
      .isVisible('span=In Progress').should.eventually.equal(true)
  ));

  it('displays results', () => (
    app1.client
      .click('a=Home')
      .waitForVisible('div.panel:first-child', EXIST_TIMEOUT)
      .element('div.panel:first-child')
      .waitForVisible('a=View Results', COMPUTATION_TIMEOUT)
      .element('div.panel:first-child')
      .click('a=View Results')
      .waitForVisible('h3=Regressions', EXIST_TIMEOUT)
      .isVisible(`span=Results: ${CONS_NAME} || ${PIPE_NAME}`).should.eventually.equal(true)
  ));

  it('deletes consortium', () => (
    app1.client
      .click('a=Consortia')
      .waitForVisible(`button[name="${CONS_NAME}-delete"]`, EXIST_TIMEOUT)
      .click(`button[name="${CONS_NAME}-delete"]`)
      .element('.modal-dialog')
      .click('button=Delete')
      .waitForVisible(`h3=${CONS_NAME}`, EXIST_TIMEOUT, true)
  ));

  it('logs out', () => (
    Promise.all([
      app1.client
        .waitForVisible('button=Log Out', EXIST_TIMEOUT)
        .click('button=Log Out')
        .waitForVisible('button=Log In', EXIST_TIMEOUT),
      app2.client
        .waitForVisible('button=Log Out', EXIST_TIMEOUT)
        .click('button=Log Out')
        .waitForVisible('button=Log In', EXIST_TIMEOUT),
    ])
  ));
});
