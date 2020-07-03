const { Application } = require('spectron');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');

const electronPath = path.join(__dirname, '../..', 'node_modules', '.bin', 'electron');
const appPath = path.join(__dirname, '../..');
const mocksPath = path.join(__dirname, 'mocks.js');

const EXIST_TIMEOUT = 6000;
const USER_ID_1 = 'test1';
const USER_ID_2 = 'test2';
const PASS = 'password';
const CONS_NAME = 'e2e-consortium-permission';
const CONS_DESC = 'e2e-description-permission';

chai.should();
chai.use(chaiAsPromised);

const app1 = new Application({
  path: electronPath,
  args: [appPath, '-r', mocksPath],
  port: 9515,
});

const app2 = new Application({
  path: electronPath,
  args: [appPath, '-r', mocksPath],
  port: 9516,
});

describe('e2e consortia permissions', () => {
  before(() => (
    Promise.all([
      app1.start(),
      app2.start(),
    ])
  ));

  after(() => (
    Promise.all([
      app1.stop(),
      app2.stop(),
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
      .waitForVisible('a[name="create-consortium-button"]', EXIST_TIMEOUT)
      .click('a[name="create-consortium-button"]')
      .isVisible('h4=Consortium Creation').should.eventually.equal(true)
  ));

  it('creates a consortium', () => (
    app1.client
      .setValue('#name', CONS_NAME)
      .setValue('#description', CONS_DESC)
      .click('button=Save')
      .waitForVisible('span=Consortium Saved', EXIST_TIMEOUT)
      .click('a=Consortia')
      .waitForVisible(`h5=${CONS_NAME}`)
  ));

  it('add another user as member', () => (
    app1.client
      .click('a=Consortia')
      .waitForVisible(`a[name="${CONS_NAME}"]`, EXIST_TIMEOUT)
      .click(`a[name="${CONS_NAME}"]`)
      .waitForVisible('h4=Consortium Edit', EXIST_TIMEOUT)
      .click('.consortium-add-user')
      .waitForVisible('.react-select-dropdown-menu', EXIST_TIMEOUT)
      .element('.react-select-dropdown-menu', EXIST_TIMEOUT)
      .click(`div=${USER_ID_2}`)
      .click('button=Add Member')
      .waitForVisible(`div=${USER_ID_2}`, EXIST_TIMEOUT)
  ));

  it('access consortium as member', () => (
    app2.client
      .click('a=Consortia')
      .waitForVisible(`a[name="${CONS_NAME}"]`, EXIST_TIMEOUT)
      .click(`a[name="${CONS_NAME}"]`)
      .waitForVisible('h4=Consortium Edit', EXIST_TIMEOUT)
      .waitForVisible(`div=${USER_ID_2}`, EXIST_TIMEOUT)
      .element('#consortium-member-table tbody tr:last-child')
      .isSelected('input[name="isOwner"]').should.eventually.equal(false)
  ));

  it('grant ownership to a member', () => (
    app1.client
      .click('a=Consortia')
      .waitForVisible(`a[name="${CONS_NAME}"]`, EXIST_TIMEOUT)
      .click(`a[name="${CONS_NAME}"]`)
      .waitForVisible('h4=Consortium Edit', EXIST_TIMEOUT)
      .waitForVisible(`span=${USER_ID_2}`, EXIST_TIMEOUT)
      .element('#consortium-member-table tbody tr:last-child')
      .click('input[name="isOwner"]')
  ));

  it('access consortium as owner', () => (
    app2.client
      .click('a=Consortia')
      .waitForVisible(`a[name="${CONS_NAME}"]`, EXIST_TIMEOUT)
      .click(`a[name="${CONS_NAME}"]`)
      .waitForVisible('h4=Consortium Edit', EXIST_TIMEOUT)
      .waitForVisible(`span=${USER_ID_2}`, EXIST_TIMEOUT)
      .element('#consortium-member-table tbody tr:last-child')
      .isSelected('input[name="isOwner"]').should.eventually.equal(true)
  ));

  it('deletes consortium', () => (
    app1.client
      .click('a=Consortia')
      .waitForVisible(`button[name="${CONS_NAME}-delete"]`, EXIST_TIMEOUT)
      .click(`button[name="${CONS_NAME}-delete"]`)
      .waitForVisible('#list-delete-modal')
      .element('#list-delete-modal')
      .click('button=Delete')
      .waitForVisible(`h1=${CONS_NAME}`, EXIST_TIMEOUT, true)
  ));

  it('logs out', () => (
    Promise.all([
      app1.client
        .waitForVisible('a=Log Out', EXIST_TIMEOUT)
        .click('a=Log Out')
        .waitForVisible('button=Log In', EXIST_TIMEOUT),
      app2.client
        .waitForVisible('a=Log Out', EXIST_TIMEOUT)
        .click('a=Log Out')
        .waitForVisible('button=Log In', EXIST_TIMEOUT),
    ])
  ));
});
