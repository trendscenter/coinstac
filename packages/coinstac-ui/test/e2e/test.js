/* eslint func-names: 0, prefer-arrow-callback: 0 */
const Application = require('spectron').Application;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');

const electronPath = path.join(__dirname, '../..', 'node_modules', '.bin', 'electron');
const appPath = path.join(__dirname, '../..');
const mocksPath = path.join(__dirname, 'mocks.js');

const EXIST_TIMEOUT = 4000;
const USER_ID = 'test';
const PASS = 'test';
const CONS_NAME = 'e2e-consortium';
const CONS_DESC = 'e2e-description';
const PROJECT_NAME = 'e2e-files';

global.before(function () {
  chai.should();
  chai.use(chaiAsPromised);
});

const app = new Application({
  path: electronPath,
  env: { NODE_ENV: 'test' },
  args: [appPath, '-r', mocksPath],
});

describe('Testing::e2e', function () {
  before(function () {
    return app.start();
  });

  after(function (done) {
    app.stop().then(function () { done(); });
  });

  it('opens a single window', function () {
    return app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1);
  });

  it('displays the correct title', function () {
    return app.client.waitUntilWindowLoaded()
      .getTitle().should.eventually.equal('COINSTAC');
  });

  it('authenticates demo user', function () {
    return app.client
            .setValue('#login-username', USER_ID)
            .setValue('#login-password', PASS)
            .click('button=Log In')
            .waitForExist('.user-account-name', EXIST_TIMEOUT)
            .getText('.user-account-name').should.eventually.equal(USER_ID);
  });

  it('accesses the Add Consortium page', function () {
    return app.client
            .click('a=Consortia')
            .waitForExist('a=Add Consortium', EXIST_TIMEOUT)
            .click('a=Add Consortium')
            .isVisible('h1=Add New Consortium').should.eventually.equal(true);
  });

  it('creates a consortium', function () {
    return app.client
            .setValue("[name='label']", CONS_NAME)
            .setValue("[name='description']", CONS_DESC)
            .click('p=Decentralized ridge regression.')
            .getValue("[name='activeComputationInputs[0]']")
              .then(function (res) {
                if (res !== 'Right-Cerebellum-Cortex') {
                  return app.client
                  .selectByValue("[name='activeComputationInputs[0]']", 'Right-Cerebellum-Cortex');
                }
              })
            .click('button=New')
            .setValue('#computation-field-map-name-0', 'isControl')
            .selectByValue('#computation-field-map-type-0', 'boolean')
            .click('button=New')
            .setValue('#computation-field-map-name-1', 'age')
            .selectByValue('#computation-field-map-type-1', 'number')
            .click('button=Create')
            .waitForExist('div.panel-heading h4.panel-title', EXIST_TIMEOUT)
            .getText('div.panel-heading h4.panel-title a').should.eventually.equal(CONS_NAME);
  });

  it('accesses the New Files Collection page', function () {
    return app.client
            .click('a=My Files')
            .waitForExist('a=Add Files Collection', EXIST_TIMEOUT)
            .click('a=Add Files Collection')
            .isVisible('h1=New Files Collection').should.eventually.equal(true);
  });

  it('adds files to a consortium', function () {
    return app.client
            .setValue('#form-project-name', PROJECT_NAME)
            .selectByVisibleText('#form-project-consortium-id', CONS_NAME)
            .click('button=Add File')
            .waitForExist('#project-covariates-mapper-1', EXIST_TIMEOUT)
            .selectByValue('#project-covariates-mapper-1', '0')
            .selectByValue('#project-covariates-mapper-2', '1')
            .click('button=Save')
            .waitForExist('div.panel-heading h4.panel-title', EXIST_TIMEOUT)
            .getText('div.panel-heading h4.panel-title a').should.eventually.equal(PROJECT_NAME);
  });

  it('runs a computation', function () {
    return app.client
            .click('button=Run Computation')
            .waitForExist('span=Complete', EXIST_TIMEOUT);
  });

  it('displays results', function () {
    return app.client
            .click('a=View Results')
            .waitForExist('#results', EXIST_TIMEOUT)
            .waitForExist('span=Complete!', EXIST_TIMEOUT);
  });

  it('deletes files', function () {
    return app.client
            .click('a=My Files')
            .waitForExist('a=Add Files Collection', EXIST_TIMEOUT)
            .click('button=Delete')
            .isVisible('div.panel-heading').should.eventually.equal(false);
  });

  it('deletes a consortium', function () {
    return app.client
            .click('a=Consortia')
            .waitForExist('a=Add Consortium', EXIST_TIMEOUT)
            .click('button=Delete')
            .isVisible('div.panel-heading').should.eventually.equal(false);
  });

  it('logs out', function () {
    return app.client
            .click('button=Log Out')
            .waitForExist('button=Log In', EXIST_TIMEOUT);
  });
});
