const { Application } = require('spectron');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const electron = require('electron');

const { logFilter } = require('./helper');

const appPath = path.join(__dirname, '../..');

const EXIST_TIMEOUT = 6000;
const COMPUTATION_TIMEOUT = 150000;
const COMPUTATION_DOWNLOAD_TIMEOUT = 40000;
const USER_ID_1 = 'test1';
const USER_ID_2 = 'test2';
const PASS = 'password';
const CONS_NAME = 'e2e-consortium-2-member';
const CONS_DESC = 'e2e-description-2-member';
const PIPE_NAME = 'e2e-pipeline-2-member';
const PIPE_DESC = 'e2e-pipeline-description-2-member';
const COMPUTATION_NAME = 'Ridge Regression (Singleshot) - FreeSurfer Volumes';

chai.should();
chai.use(chaiAsPromised);

// chromedriver opts are for headless usage
// but dont affect local tests
const app1 = new Application({
  path: electron,
  env: { TEST_INSTANCE: 'test-1', NODE_ENV: 'test' },
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
  env: { TEST_INSTANCE: 'test-2', NODE_ENV: 'test' },
  args: [appPath],
  chromeDriverArgs: [
    '--no-sandbox',
    '--whitelisted-ips=',
    '--disable-dev-shm-usage',
  ],
  port: 9516,
});

describe('e2e run computation with 2 members', () => {
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
        logs.filter(logFilter).forEach((log) => {
          console.log(log); // eslint-disable-line no-console
        });
      });
      console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Second Client Logs %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%'); // eslint-disable-line no-console
      await app2.client.getMainProcessLogs().then((logs) => {
        logs.filter(logFilter).forEach((log) => {
          console.log(log); // eslint-disable-line no-console
        });
      });
    }
    return Promise.all([
      app1.stop(),
      app2.stop(),
    ]);
  });

  it('displays the correct title', async () => {
    return app1.client.getTitle().should.eventually.equal('COINSTAC');
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

    const saveNotification = await app1.client.$('div=Consortium Saved');
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

  it('accesses the Add Pipeline page', async () => {
    const pipelinesMenuButton = await app1.client.$('a=Pipelines');
    await pipelinesMenuButton.click();

    const createPipelineButton = await app1.client.$('a[name="create-pipeline-button"]');
    await createPipelineButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await createPipelineButton.click();

    const createPipelineTitle = await app1.client.$('h4=Pipeline Creation');

    // Assert
    return createPipelineTitle.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    }).should.eventually.equal(true);
  });

  it('creates a pipeline', async () => {
    const nameField = await app1.client.$('#name');
    await nameField.setValue(PIPE_NAME);

    const descriptionField = await app1.client.$('#description');
    await descriptionField.setValue(PIPE_DESC);

    const consortiumDropdown = await app1.client.$('#pipelineconsortia');
    await consortiumDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
    await consortiumDropdown.click();
    const consortiumMenu = await app1.client.$('#consortium-menu');
    await consortiumMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
    const consortiumItem = await consortiumMenu.$(`li=${CONS_NAME}`);
    await consortiumItem.waitForClickable({ timeout: EXIST_TIMEOUT });
    await consortiumItem.click();
    await consortiumDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

    const computationDropdown = await app1.client.$('#computation-dropdown');
    await computationDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
    await computationDropdown.click();
    const computationMenu = await app1.client.$('#computation-menu');
    await computationMenu.waitForExist({ timeout: EXIST_TIMEOUT });
    const computationItem = await computationMenu.$(`li=${COMPUTATION_NAME}`);
    await computationItem.waitForClickable({ timeout: EXIST_TIMEOUT });
    await computationItem.click({ x: 10, y: 10 });
    await computationDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

    const pipelineStepElement = await app1.client.$('.pipeline-step');
    await pipelineStepElement.waitForClickable({ timeout: EXIST_TIMEOUT });
    await pipelineStepElement.click();

    const addCovariate = async (name, type, index) => {
      const addCovariatesButton = await app1.client.$('button=Add Covariates');
      await addCovariatesButton.click();

      const dataDropdown = await app1.client.$(`#covariates-${index}-data-dropdown`);
      await dataDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
      await dataDropdown.click();
      const dataDropdownMenu = await app1.client.$(`#covariates-${index}-data-dropdown-menu`);
      await dataDropdownMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
      const dataTypeOption = await dataDropdownMenu.$(`li=${type}`);
      await dataTypeOption.waitForClickable({ timeout: EXIST_TIMEOUT });
      await dataTypeOption.click();
      await dataDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

      const nameInput = await app1.client.$(`#covariates-${index}-input-name`);
      await nameInput.setValue(name);
    };

    await addCovariate('isControl', 'boolean', 0);
    await addCovariate('age', 'number', 1);

    const addDataButton = await app1.client.$('button=Add Data');
    await addDataButton.click();

    const dataDropdown = await app1.client.$('#data-0-data-dropdown');
    await dataDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
    await dataDropdown.click();
    const dataDropdownMenu = await app1.client.$('#data-0-data-dropdown-menu');
    await dataDropdownMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
    const freesurferOption = await dataDropdownMenu.$('li=FreeSurfer');
    await freesurferOption.waitForClickable({ timeout: EXIST_TIMEOUT });
    await freesurferOption.click();
    await dataDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

    const dataInterest = await app1.client.$('#data-0-area');
    await dataInterest.waitForClickable({ timeout: EXIST_TIMEOUT });
    await dataInterest.click();
    const dataInterestDropdownMenu = await dataInterest.$('.react-select-dropdown-menu');
    await dataInterestDropdownMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
    const fifthVentricleOption = await dataInterestDropdownMenu.$('div=5th-Ventricle');
    await fifthVentricleOption.waitForClickable();
    await fifthVentricleOption.click();

    const lambdaField = await app1.client.$('[name="step-lambda"]');
    await lambdaField.setValue('0');

    const saveButton = await app1.client.$('button=Save Pipeline');
    await saveButton.click();

    const saveNotification = await app1.client.$('div=Pipeline Saved');
    const isSaveNotificationDisplayed = await saveNotification.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    });

    // Assert
    return isSaveNotificationDisplayed.should.equal(true);
  });

  it('sets the created pipeline to the consortium', async () => {
    const consortiaMenuButton = await app1.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const viewDetailsButton = await app1.client.$(`a[name="${CONS_NAME}"]`);
    await viewDetailsButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await viewDetailsButton.click();

    const consortiumEditTabs = await app1.client.$('#consortium-tabs');
    const pipelinesTabMenu = await consortiumEditTabs.$('span=Pipelines');
    await pipelinesTabMenu.waitForClickable({ timeout: EXIST_TIMEOUT });
    await pipelinesTabMenu.click();

    const pipelineSelectDropdown = await app1.client.$('#owned-pipelines-dropdown');
    await pipelineSelectDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
    await pipelineSelectDropdown.click();
    const pipelineDropdownMenu = await app1.client.$('#owned-pipelines-dropdown-menu');
    await pipelineDropdownMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
    const pipelineOption = await pipelineDropdownMenu.$(`li=${PIPE_NAME}`);
    await pipelineOption.waitForClickable({ timeout: EXIST_TIMEOUT });
    await pipelineOption.click();
    await pipelineSelectDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

    // Assert
    const pipelineLink = await app1.client.$(`a=${PIPE_NAME}`);
    const pipelineDownloadCompleteNotification = await app1.client.$(`div=${COMPUTATION_NAME} Download Complete`);

    return Promise.all([
      pipelineLink
        .waitForDisplayed({ timeout: EXIST_TIMEOUT }).should.eventually.equal(true),
      pipelineDownloadCompleteNotification
        .waitForDisplayed({ timeout: COMPUTATION_DOWNLOAD_TIMEOUT }).should.eventually.equal(true),
    ]);
  });

  it('joins a consortium', async () => {
    const consortiaMenuButton = await app2.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const joinConsortiumButton = await app2.client.$(`button[name="${CONS_NAME}-join-cons-button"]`);
    await joinConsortiumButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await joinConsortiumButton.click();

    // Assert
    const leaveConsortiumButton = await app2.client.$(`button[name="${CONS_NAME}-leave-cons-button"]`);
    const pipelineDownloadCompleteNotification = await app2.client.$(`div=${COMPUTATION_NAME} Download Complete`);

    return Promise.all([
      leaveConsortiumButton.waitForClickable({ timeout: EXIST_TIMEOUT })
        .should.eventually.equal(true),
      pipelineDownloadCompleteNotification
        .waitForDisplayed({ timeout: COMPUTATION_DOWNLOAD_TIMEOUT }).should.eventually.equal(true),
    ]);
  });

  it('map data to consortium on site 1', async () => {
    const mapsMenuButton = await app1.client.$('a=Maps');
    await mapsMenuButton.click();

    const consortiumMapItemButton = await app1.client.$(`a[name="${CONS_NAME}"]`);
    await consortiumMapItemButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await consortiumMapItemButton.click();

    const addFilesGroupButton = await app1.client.$('button=Select File(s)');
    await addFilesGroupButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await addFilesGroupButton.click();

    const autoMapButton = await app1.client.$('button=Auto Map');
    await autoMapButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await autoMapButton.click();

    const saveButton = await app1.client.$('button=Save');
    await saveButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await saveButton.click();

    const consortiaMenuButton = await app1.client.$('a=Consortia');
    await consortiaMenuButton.click();

    // Assert
    const startPipelineButton = await app1.client.$('button=Start Pipeline');

    return startPipelineButton.waitForClickable({ timeout: EXIST_TIMEOUT })
      .should.eventually.equal(true);
  });

  it('map data to consortium on site 2', async () => {
    const mapsMenuButton = await app2.client.$('a=Maps');
    await mapsMenuButton.click();

    const consortiumMapItemButton = await app2.client.$(`a[name="${CONS_NAME}"]`);
    await consortiumMapItemButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await consortiumMapItemButton.click();

    const addFilesGroupButton = await app2.client.$('button=Select File(s)');
    await addFilesGroupButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await addFilesGroupButton.click();

    const autoMapButton = await app2.client.$('button=Auto Map');
    await autoMapButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await autoMapButton.click();

    const saveButton = await app2.client.$('button=Save');
    await saveButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await saveButton.click();

    const consortiaMenuButton = await app2.client.$('a=Consortia');
    await consortiaMenuButton.click();

    // Assert
    const mapDataButton = await app2.client.$('button=Map Local Data');

    return mapDataButton.waitForDisplayed({ timeout: EXIST_TIMEOUT, reverse: true })
      .should.eventually.equal(true);
  });

  it('runs a computation', async () => {
    const startPipelineButton = await app1.client.$('button=Start Pipeline');
    await startPipelineButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await startPipelineButton.click();

    // Assert
    const pipelineStartNotification = await app1.client.$(`div=Pipeline Starting for ${CONS_NAME}.`);

    return pipelineStartNotification.waitForDisplayed({ timeout: EXIST_TIMEOUT })
      .should.eventually.equal(true);
  });

  it('displays computation progress', async () => {
    const homeMenuButton = await app1.client.$('a=Home');
    await homeMenuButton.click();

    const runItem = await app1.client.$('div.run-item-paper:first-child');
    await runItem.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    // Assert
    const inProgressText = await runItem.$('span=In Progress');

    return inProgressText.waitForDisplayed({ timeout: EXIST_TIMEOUT })
      .should.eventually.equal(true);
  });

  it('displays results', async () => {
    const runItem = await app1.client.$('div.run-item-paper:first-child');
    const viewResultsButton = await runItem.$('a=View Results');

    // Wait for computation to complete (results button only shows up at the end of the run)
    await viewResultsButton.waitForClickable({ timeout: COMPUTATION_TIMEOUT });

    await viewResultsButton.click();

    // Assert
    const resultsPageTitle = await app1.client.$('h3=Regressions');
    const resultDescription = await app1.client.$(`h6=Results: ${CONS_NAME} || ${PIPE_NAME}`);

    return Promise.all([
      resultsPageTitle.waitForDisplayed({ timeout: EXIST_TIMEOUT })
        .should.eventually.equal(true),
      resultDescription.waitForDisplayed({ timeout: EXIST_TIMEOUT })
        .should.eventually.equal(true),
    ]);
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
