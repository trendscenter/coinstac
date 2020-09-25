const { Application } = require('spectron');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const electron = require('electron');

const appPath = path.join(__dirname, '../..');

const EXIST_TIMEOUT = 6000;
const USER_ID_1 = 'test1';
const USER_ID_2 = 'test2';
const PASS = 'password';
const CONS_NAME = 'e2e-consortium-permission';
const CONS_DESC = 'e2e-description-permission';

chai.should();
chai.use(chaiAsPromised);

const app1 = new Application({
  path: electron,
  env: { TEST_INSTANCE: 'test-1' },
  args: [appPath],
  chromeDriverArgs: [
    '--no-sandbox',
    '--whitelisted-ips=',
    '--disable-dev-shm-usage',
  ],
  port: 9515,
});

const app2 = new Application({
  path: electron,
  env: { TEST_INSTANCE: 'test-2' },
  args: [appPath],
  chromeDriverArgs: [
    '--no-sandbox',
    '--whitelisted-ips=',
    '--disable-dev-shm-usage',
  ],
  port: 9516,
});

describe('e2e consortia permissions', () => {
  before(async () => {
    await Promise.all([
      app1.start(),
      app2.start(),
    ]);

    return Promise.all([
      app1.client.waitUntilWindowLoaded(10000),
      app2.client.waitUntilWindowLoaded(10000),
    ]);
  });

  after(async () => {
    if (process.env.CI) {
      await app1.client.getMainProcessLogs().then((logs) => {
        logs.forEach((log) => {
          console.log(log); // eslint-disable-line no-console
        });
      });
      console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Second Client Logs %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%'); // eslint-disable-line no-console
      await app2.client.getMainProcessLogs().then((logs) => {
        logs.forEach((log) => {
          console.log(log); // eslint-disable-line no-console
        });
      });
    }
    Promise.all([
      app1.stop(),
      app2.stop(),
    ]);
  });

  it('authenticates demo user on first instance', async () => {
    const usernameField = await app1.client.$('#login-username');
    await usernameField.waitForClickable({ timeout: EXIST_TIMEOUT });
    await usernameField.setValue(USER_ID_1);

    const passwordField = await app1.client.$('#login-password');
    await passwordField.setValue(PASS);

    const loginButton = await app1.client.$('button=Log In');
    await loginButton.click();

    const userTitleElement = await app1.client.$('.user-account-name');
    await userTitleElement.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    // Assert
    return userTitleElement.getText().should.eventually.equal(USER_ID_1);
  });

  it('authenticates demo user on second instance', async () => {
    const usernameField = await app2.client.$('#login-username');
    await usernameField.waitForClickable({ timeout: EXIST_TIMEOUT });
    await usernameField.setValue(USER_ID_2);

    const passwordField = await app2.client.$('#login-password');
    await passwordField.setValue(PASS);

    const loginButton = await app2.client.$('button=Log In');
    await loginButton.click();

    const userTitleElement = await app2.client.$('.user-account-name');
    await userTitleElement.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    // Assert
    return userTitleElement.getText().should.eventually.equal(USER_ID_2);
  });

  it('accesses the Add Consortium page', async () => {
    const consortiaMenuButton = await app1.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const createConsortiumButton = await app1.client.$('a[name="create-consortium-button"]');
    await createConsortiumButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await createConsortiumButton.click();

    const createConsortiumTitle = await app1.client.$('h4=Consortium Creation');

    // Assert
    return createConsortiumTitle.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    }).should.eventually.equal(true);
  });

  it('creates a consortium', async () => {
    const nameField = await app1.client.$('#name');
    await nameField.setValue(CONS_NAME);

    const descriptionField = await app1.client.$('#description');
    await descriptionField.setValue(CONS_DESC);

    const saveButton = await app1.client.$('button=Save');
    await saveButton.click();

    const saveNotification = await app1.client.$('span=Consortium Saved');
    const isSaveNotificationDisplayed = await saveNotification.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    });

    const consortiaMenuButton = await app1.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const consortiumItemListTitle = await app1.client.$(`h5=${CONS_NAME}`);
    const isItemListDisplayed = await consortiumItemListTitle.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    });

    // Assert
    isSaveNotificationDisplayed.should.equal(true);
    isItemListDisplayed.should.equal(true);
  });

  it('add another user as member', async () => {
    const consortiaMenuButton = await app1.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const viewDetailsButton = await app1.client.$(`a[name="${CONS_NAME}"]`);
    await viewDetailsButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await viewDetailsButton.click();

    const pageTitle = await app1.client.$('h4=Consortium Edit');
    await pageTitle.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    const addUserButton = await app1.client.$('.consortium-add-user');
    await addUserButton.click();

    const userDropdownMenu = await app1.client.$('.react-select-dropdown-menu');
    await userDropdownMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
    const userOption = await userDropdownMenu.$(`div=${USER_ID_2}`);
    await userOption.waitForClickable({ timeout: EXIST_TIMEOUT });
    await userOption.click();

    const addMemberButton = await app1.client.$('button=Add Member');
    await addMemberButton.click();

    // Assert
    const userListItem = await app1.client.$(`div=${USER_ID_2}`);

    return userListItem.waitForDisplayed({ timeout: EXIST_TIMEOUT })
      .should.eventually.equal(true);
  });

  it('access consortium as member', async () => {
    const consortiaMenuButton = await app2.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const viewDetailsButton = await app2.client.$(`a[name="${CONS_NAME}"]`);
    await viewDetailsButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await viewDetailsButton.click();

    const pageTitle = await app2.client.$('h4=Consortium Edit');
    await pageTitle.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    const userListItem = await app2.client.$(`div=${USER_ID_2}`);
    await userListItem.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    // Assert
    const userTableRow = await app2.client.$('#consortium-member-table tbody tr:last-child');

    const isOwnerCheckbox = await userTableRow.$('input[name="isOwner"]');

    return isOwnerCheckbox.isSelected().should.eventually.equal(false);
  });

  it('grant ownership to a member', async () => {
    const consortiaMenuButton = await app1.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const viewDetailsButton = await app1.client.$(`a[name="${CONS_NAME}"]`);
    await viewDetailsButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await viewDetailsButton.click();

    const pageTitle = await app1.client.$('h4=Consortium Edit');
    await pageTitle.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    const userListItem = await app1.client.$(`span=${USER_ID_2}`);
    await userListItem.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    const userTableRow = await app1.client.$('#consortium-member-table tbody tr:last-child');

    const isOwnerCheckbox = await userTableRow.$('input[name="isOwner"]');

    await isOwnerCheckbox.click();

    // Assert
    const consortiaMenuButtonSite2 = await app2.client.$('a=Consortia');
    await consortiaMenuButtonSite2.click();

    const viewDetailsButtonSite2 = await app2.client.$(`a[name="${CONS_NAME}"]`);
    await viewDetailsButtonSite2.waitForClickable({ timeout: EXIST_TIMEOUT });
    await viewDetailsButtonSite2.click();

    const pageTitleSite2 = await app2.client.$('h4=Consortium Edit');
    await pageTitleSite2.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    const userListItemSite2 = await app2.client.$(`span=${USER_ID_2}`);
    await userListItemSite2.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    const userTableRowSite2 = await app2.client.$('#consortium-member-table tbody tr:last-child');

    const isOwnerCheckboxSite2 = await userTableRowSite2.$('input[name="isOwner"]');

    return isOwnerCheckboxSite2.isSelected().should.eventually.equal(true);
  });

  it('deletes consortium', async () => {
    const consortiaMenuButton = await app1.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const deleteConsortiumButton = await app1.client.$(`button[name="${CONS_NAME}-delete"]`);
    await deleteConsortiumButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await deleteConsortiumButton.click();

    const deleteModal = await app1.client.$('#list-delete-modal');
    const confirmButton = await deleteModal.$('button=Delete');
    await confirmButton.waitForClickable({ timeout: EXIST_TIMEOUT });

    await confirmButton.click();

    // Assert
    const consortiumListItemTitle = await app1.client.$(`h1=${CONS_NAME}`);

    // Wait for consortium item to be deleted from consortium list
    return consortiumListItemTitle.waitForDisplayed({ timeout: EXIST_TIMEOUT, reverse: true })
      .should.eventually.equal(true);
  });

  it('logs out', async () => {
    const logoutButtonSite1 = await app1.client.$('a=Log Out');
    await logoutButtonSite1.waitForClickable({ timeout: EXIST_TIMEOUT });
    await logoutButtonSite1.click();

    const logoutButtonSite2 = await app2.client.$('a=Log Out');
    await logoutButtonSite2.waitForClickable({ timeout: EXIST_TIMEOUT });
    await logoutButtonSite2.click();

    // Assert
    const loginButtonSite1 = await app1.client.$('button=Log In');
    const loginButtonSite2 = await app2.client.$('button=Log In');

    return Promise.all([
      loginButtonSite1.waitForClickable({ timeout: EXIST_TIMEOUT }).should.eventually.equal(true),
      loginButtonSite2.waitForClickable({ timeout: EXIST_TIMEOUT }).should.eventually.equal(true),
    ]);
  });
});
