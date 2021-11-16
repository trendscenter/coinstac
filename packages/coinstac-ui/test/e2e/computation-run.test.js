const { Application } = require('spectron');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const electron = require('electron');

const { logFilter } = require('./helper');

const appPath = path.join(__dirname, '../..');

const EXIST_TIMEOUT = 10000;
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

const app = new Application({
  path: electron,
  args: [appPath],
  env: { NODE_ENV: 'test' },
  chromeDriverArgs: [
    '--no-sandbox',
    '--whitelisted-ips=',
    '--disable-dev-shm-usage',
  ],
});

describe('e2e run computation with 1 member', () => {
  before(async () => {
    await app.start();
    return app.client.waitUntilWindowLoaded(10000);
  });

  after(async () => {
    if (process.env.CI) {
      await app.client.getMainProcessLogs().then((logs) => {
        logs.filter(logFilter).forEach((log) => {
          console.log(log); // eslint-disable-line no-console
        });
      });
    }
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('displays the correct title', async () => {
    return app.client.getTitle().should.eventually.equal('COINSTAC');
  });

  it('authenticates demo user', async () => {
    const usernameField = await app.client.$('#login-username');
    await usernameField.waitForClickable({ timeout: EXIST_TIMEOUT });
    await usernameField.setValue(USER_ID);

    const passwordField = await app.client.$('#login-password');
    await passwordField.setValue(PASS);

    const loginButton = await app.client.$('button=Log In');
    await loginButton.click();

    const userTitleElement = await app.client.$('.user-account-name');
    await userTitleElement.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    // Assert
    return userTitleElement.getText().should.eventually.equal(USER_ID);
  });

  it('accesses the Add Consortium page', async () => {
    const consortiaMenuButton = await app.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const createConsortiumButton = await app.client.$('a[name="create-consortium-button"]');
    await createConsortiumButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await createConsortiumButton.click();

    const createConsortiumTitle = await app.client.$('h4=Consortium Creation');

    // Assert
    return createConsortiumTitle.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    }).should.eventually.equal(true);
  });

  it('creates a consortium', async () => {
    const nameField = await app.client.$('#name');
    await nameField.setValue(CONS_NAME);

    const descriptionField = await app.client.$('#description');
    await descriptionField.setValue(CONS_DESC);

    const saveButton = await app.client.$('button=Save');
    await saveButton.click();

    const saveNotification = await app.client.$('div=Consortium Saved');
    const isSaveNotificationDisplayed = await saveNotification.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    });

    const consortiaMenuButton = await app.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const consortiumItemListTitle = await app.client.$(`h5=${CONS_NAME}`);
    const isItemListDisplayed = await consortiumItemListTitle.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    });

    // Assert
    isSaveNotificationDisplayed.should.equal(true);
    isItemListDisplayed.should.equal(true);
  });

  it('accesses the Add Pipeline page', async () => {
    const pipelinesMenuButton = await app.client.$('a=Pipelines');
    await pipelinesMenuButton.click();

    const createPipelineButton = await app.client.$('a[name="create-pipeline-button"]');
    await createPipelineButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await createPipelineButton.click();

    const createPipelineTitle = await app.client.$('h4=Pipeline Creation');

    // Assert
    return createPipelineTitle.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    }).should.eventually.equal(true);
  });

  it('creates a pipeline', async () => {
    const nameField = await app.client.$('#name');
    await nameField.setValue(PIPE_NAME);

    const descriptionField = await app.client.$('#description');
    await descriptionField.setValue(PIPE_DESC);

    const consortiumDropdown = await app.client.$('#pipelineconsortia');
    await consortiumDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
    await consortiumDropdown.click();
    const consortiumMenu = await app.client.$('#consortium-menu');
    await consortiumMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
    const consortiumItem = await consortiumMenu.$(`li=${CONS_NAME}`);
    await consortiumItem.waitForClickable({ timeout: EXIST_TIMEOUT });
    await consortiumItem.click();
    await consortiumDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

    const computationDropdown = await app.client.$('#computation-dropdown');
    await computationDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
    await computationDropdown.click();
    const computationMenu = await app.client.$('#computation-menu');
    await computationMenu.waitForExist({ timeout: EXIST_TIMEOUT });
    const computationItem = await computationMenu.$(`li=${COMPUTATION_NAME}`);
    await computationItem.waitForClickable({ timeout: EXIST_TIMEOUT });
    await computationItem.click({ x: 10, y: 10 });
    await computationDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

    const pipelineStepElement = await app.client.$('.pipeline-step');
    await pipelineStepElement.waitForClickable({ timeout: EXIST_TIMEOUT });
    await pipelineStepElement.click();

    const addCovariate = async (name, type, index) => {
      const addCovariatesButton = await app.client.$('button=Add Covariates');
      await addCovariatesButton.click();

      const dataDropdown = await app.client.$(`#covariates-${index}-data-dropdown`);
      await dataDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
      await dataDropdown.click();
      const dataDropdownMenu = await app.client.$(`#covariates-${index}-data-dropdown-menu`);
      await dataDropdownMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
      const dataTypeOption = await dataDropdownMenu.$(`li=${type}`);
      await dataTypeOption.waitForClickable({ timeout: EXIST_TIMEOUT });
      await dataTypeOption.click();
      await dataDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

      const nameInput = await app.client.$(`#covariates-${index}-input-name`);
      await nameInput.setValue(name);
    };

    await addCovariate('isControl', 'boolean', 0);
    await addCovariate('age', 'number', 1);

    const addDataButton = await app.client.$('button=Add Data');
    await addDataButton.click();

    const dataDropdown = await app.client.$('#data-0-data-dropdown');
    await dataDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
    await dataDropdown.click();
    const dataDropdownMenu = await app.client.$('#data-0-data-dropdown-menu');
    await dataDropdownMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
    const freesurferOption = await dataDropdownMenu.$('li=FreeSurfer');
    await freesurferOption.waitForClickable({ timeout: EXIST_TIMEOUT });
    await freesurferOption.click();
    await dataDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

    const dataInterest = await app.client.$('#data-0-area');
    await dataInterest.waitForClickable({ timeout: EXIST_TIMEOUT });
    await dataInterest.click();
    const dataInterestDropdownMenu = await dataInterest.$('.react-select-dropdown-menu');
    await dataInterestDropdownMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
    const fifthVentricleOption = await dataInterestDropdownMenu.$('div=5th-Ventricle');
    await fifthVentricleOption.waitForClickable();
    await fifthVentricleOption.click();

    const lambdaField = await app.client.$('[name="step-lambda"]');
    await lambdaField.setValue('0');

    const saveButton = await app.client.$('button=Save Pipeline');
    await saveButton.click();

    const saveNotification = await app.client.$('div=Pipeline Saved');
    const isSaveNotificationDisplayed = await saveNotification.waitForDisplayed({
      timeout: EXIST_TIMEOUT,
    });

    // Assert
    return isSaveNotificationDisplayed.should.equal(true);
  });

  it('sets the created pipeline to the consortium', async () => {
    const consortiaMenuButton = await app.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const viewDetailsButton = await app.client.$(`a[name="${CONS_NAME}"]`);
    await viewDetailsButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await viewDetailsButton.click();

    const consortiumEditTabs = await app.client.$('#consortium-tabs');
    const pipelinesTabMenu = await consortiumEditTabs.$('span=Pipelines');
    await pipelinesTabMenu.waitForClickable({ timeout: EXIST_TIMEOUT });
    await pipelinesTabMenu.click();

    const pipelineSelectDropdown = await app.client.$('#owned-pipelines-dropdown');
    await pipelineSelectDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });
    await pipelineSelectDropdown.click();
    const pipelineDropdownMenu = await app.client.$('#owned-pipelines-dropdown-menu');
    await pipelineDropdownMenu.waitForDisplayed({ timeout: EXIST_TIMEOUT });
    const pipelineOption = await pipelineDropdownMenu.$(`li=${PIPE_NAME}`);
    await pipelineOption.waitForClickable({ timeout: EXIST_TIMEOUT });
    await pipelineOption.click();
    await pipelineSelectDropdown.waitForClickable({ timeout: EXIST_TIMEOUT });

    // Assert
    const pipelineLink = await app.client.$(`a=${PIPE_NAME}`);
    const pipelineDownloadCompleteNotification = await app.client.$(`div=${COMPUTATION_NAME} Download Complete`);

    return Promise.all([
      pipelineLink
        .waitForDisplayed({ timeout: EXIST_TIMEOUT }).should.eventually.equal(true),
      pipelineDownloadCompleteNotification
        .waitForDisplayed({ timeout: COMPUTATION_DOWNLOAD_TIMEOUT }).should.eventually.equal(true),
    ]);
  });

  it('map data to consortium', async () => {
    const mapsMenuButton = await app.client.$('a=Maps');
    await mapsMenuButton.click();

    const consortiumMapItemButton = await app.client.$(`a[name="${CONS_NAME}"]`);
    await consortiumMapItemButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await consortiumMapItemButton.click();

    const addFilesGroupButton = await app.client.$('button=Select File(s)');
    await addFilesGroupButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await addFilesGroupButton.click();

    const autoMapButton = await app.client.$('button=Auto Map');
    await autoMapButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await autoMapButton.click();

    const saveButton = await app.client.$('button=Save');
    await saveButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await saveButton.click();

    const consortiaMenuButton = await app.client.$('a=Consortia');
    await consortiaMenuButton.click();

    // Assert
    const startPipelineButton = await app.client.$('button=Start Pipeline');

    return startPipelineButton.waitForClickable({ timeout: EXIST_TIMEOUT })
      .should.eventually.equal(true);
  });

  it('runs a computation', async () => {
    const startPipelineButton = await app.client.$('button=Start Pipeline');
    await startPipelineButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await startPipelineButton.click();

    // Assert
    const pipelineStartNotification = await app.client.$(`div=Pipeline Starting for ${CONS_NAME}.`);

    return pipelineStartNotification.waitForDisplayed({ timeout: EXIST_TIMEOUT })
      .should.eventually.equal(true);
  });

  it('displays computation progress', async () => {
    const homeMenuButton = await app.client.$('a=Home');
    await homeMenuButton.click();

    const runItem = await app.client.$('div.run-item-paper:first-child');
    await runItem.waitForDisplayed({ timeout: EXIST_TIMEOUT });

    // Assert
    const inProgressText = await runItem.$('span=In Progress');

    return inProgressText.waitForDisplayed({ timeout: EXIST_TIMEOUT })
      .should.eventually.equal(true);
  });

  it('displays results', async () => {
    const runItem = await app.client.$('div.run-item-paper:first-child');
    const viewResultsButton = await runItem.$('a=View Results');

    // Wait for computation to complete (results button only shows up at the end of the run)
    await viewResultsButton.waitForClickable({ timeout: COMPUTATION_TIMEOUT });

    await viewResultsButton.click();

    // Assert
    const resultsPageTitle = await app.client.$('h3=Regressions');
    const resultDescription = await app.client.$(`h6=Results: ${CONS_NAME} || ${PIPE_NAME}`);

    return Promise.all([
      resultsPageTitle.waitForDisplayed({ timeout: EXIST_TIMEOUT })
        .should.eventually.equal(true),
      resultDescription.waitForDisplayed({ timeout: EXIST_TIMEOUT })
        .should.eventually.equal(true),
    ]);
  });

  it('deletes consortium', async () => {
    const consortiaMenuButton = await app.client.$('a=Consortia');
    await consortiaMenuButton.click();

    const deleteConsortiumButton = await app.client.$(`button[name="${CONS_NAME}-delete"]`);
    await deleteConsortiumButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await deleteConsortiumButton.click();

    const deleteModal = await app.client.$('#list-delete-modal');
    const confirmButton = await deleteModal.$('button=Delete');
    await confirmButton.waitForClickable({ timeout: EXIST_TIMEOUT });

    await confirmButton.click();

    // Assert
    const consortiumListItemTitle = await app.client.$(`h1=${CONS_NAME}`);

    // Wait for consortium item to be deleted from consortium list
    return consortiumListItemTitle.waitForDisplayed({ timeout: EXIST_TIMEOUT, reverse: true })
      .should.eventually.equal(true);
  });

  it('logs out', async () => {
    const logoutButton = await app.client.$('a=Log Out');
    await logoutButton.waitForClickable({ timeout: EXIST_TIMEOUT });
    await logoutButton.click();

    // Assert
    const loginButton = await app.client.$('button=Log In');

    return loginButton.waitForClickable({ timeout: EXIST_TIMEOUT }).should.eventually.equal(true);
  });
});
