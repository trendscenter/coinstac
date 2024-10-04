/* eslint-disable no-console */
const { EXIST_TIMEOUT, COMPUTATION_TIMEOUT, COMPUTATION_DOWNLOAD_TIMEOUT } = require('../lib/constants');

const createConsortium = async ({ name, description }, app) => {
  // Go to create consortium page
  await app.click('a:has-text("Consortia")');

  await app.click('a[name="create-consortium-button"]', { timeout: EXIST_TIMEOUT });

  // Assert
  await app.waitForSelector('h4:has-text("Consortium Creation")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);

  // Create consortium
  await app.fill('#name', name);
  await app.fill('#description', description);

  await app.click('button:has-text("Save")');

  // Assert
  await app.waitForSelector('div:has-text("Consortium Saved")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);

  await app.click('a:has-text("Consortia")');

  await app.waitForSelector(`h5:has-text("${name}")`, {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);
};

const addUser = async ({ consortiumName, username }, app) => {
  await app.click('a:has-text("Consortia")');

  await app.click(`a[name="${consortiumName}"]`, { timeout: EXIST_TIMEOUT });

  await app.click('.consortium-add-user', { timeout: EXIST_TIMEOUT });

  await app.click(`.react-select-dropdown-menu div:has-text("${username}")`, { timeout: EXIST_TIMEOUT });

  await app.click('button:has-text("Add Member")');

  // Assert
  await app.waitForSelector(`span:has-text("${username}")`, {
    state: 'visible',
    timeout: 30000,
  }).should.eventually.not.equal(null);
};

const accessAsMember = async ({ username }, app) => {
  await app.click('a:has-text("Consortia")');

  await app.waitForSelector('h6:has-text("Member")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  });
  await app.waitForSelector(`span:has-text("${username}")`, {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  });
};

const grantOwnership = async ({ consortiumName, username }, app) => {
  await app.click('a:has-text("Consortia")');

  await app.click(`a[name="${consortiumName}"]`, { timeout: EXIST_TIMEOUT });

  await app.click('#consortium-member-table tbody tr:last-child input[name="isOwner"]', { timeout: EXIST_TIMEOUT });

  // Assert
  await Promise.all([
    app.waitForSelector(`div:has-text("${username}")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
    app.waitForSelector('#consortium-member-table tbody tr:last-child input[name="isOwner"]:checked', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
  ]);
};

const setPipeline = async ({ consortium, pipeline, computation }, app) => {
  await app.click('a:has-text("Consortia")');

  await app.click(`a[name="${consortium.name}"]`, { timeout: EXIST_TIMEOUT });

  await app.click('#consortium-tabs span:has-text("Pipelines")', { timeout: EXIST_TIMEOUT });

  await app.click('#owned-pipelines-dropdown', { timeout: EXIST_TIMEOUT });
  await app.click(`#owned-pipelines-dropdown-menu li:has-text("${pipeline.name}")`, { timeout: EXIST_TIMEOUT });

  // Assert
  await Promise.all([
    app.waitForSelector(`a:has-text("${pipeline.name}")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
    app.waitForSelector(`div:has-text("${computation.name} Download Complete")`, {
      state: 'visible',
      timeout: COMPUTATION_DOWNLOAD_TIMEOUT,
    }).should.eventually.not.equal(null),
  ]);
};

const joinConsortium = async ({ consortium, computation }, app) => {
  await app.click('a:has-text("Consortia")');

  await app.click('span:has-text("Other Consortia")');

  await app.click(`button[name="${consortium.name}-join-cons-button"]`, { timeout: EXIST_TIMEOUT });

  await app.click('span:has-text("My Consortia")');

  // Assert
  await Promise.all([
    app.waitForSelector(`button[name="${consortium.name}-leave-cons-button"]`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
    app.waitForSelector(`div:has-text("${computation.name} Download Complete")`, {
      state: 'visible',
      timeout: COMPUTATION_DOWNLOAD_TIMEOUT,
    }).should.eventually.not.equal(null),
  ]);
};

const mapDataToConsortium = async (consortiumName, app) => {
  await app.click('a:has-text("Map")', { timeout: EXIST_TIMEOUT });

  await app.click(`a[name="${consortiumName}"]`, { timeout: EXIST_TIMEOUT });

  await app.click('button:has-text("Select File(s)")', { timeout: EXIST_TIMEOUT });

  await app.click('button:has-text("Auto Map")', { timeout: EXIST_TIMEOUT });

  await app.click('button:has-text("Save")', { timeout: EXIST_TIMEOUT });

  await app.click('a:has-text("Consortia")', { timeout: EXIST_TIMEOUT });

  // Assert
  app.waitForSelector('button:has-text("Start Pipeline")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);
};

const mapDataToConsortiumRegressionCsv = async (consortiumName, app) => {
  await app.click('a:has-text("Map")', { timeout: EXIST_TIMEOUT });

  await app.click(`a[name="${consortiumName}"]`, { timeout: EXIST_TIMEOUT });

  await app.locator(':nth-match(:text("Select File(s)"), 1)').click();

  await app.locator(':nth-match(:text("Select File(s)"), 2)').click();

  await app.click('button:has-text("Save")', { timeout: EXIST_TIMEOUT });

  await app.click('a:has-text("Consortia")', { timeout: EXIST_TIMEOUT });

  // Assert
  app.waitForSelector('button:has-text("Start Pipeline")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);
};

const mapDataToConsortiumDpsvmCsv = async (consortiumName, app) => {
  await app.click('a:has-text("Map")', { timeout: EXIST_TIMEOUT });

  await app.click(`a[name="${consortiumName}"]`, { timeout: EXIST_TIMEOUT });

  await app.locator(':nth-match(:text("Select File(s)"), 1)').click();

  await app.locator(':nth-match(:text("Select File(s)"), 2)').click();

  await app.click('button:has-text("Save")', { timeout: EXIST_TIMEOUT });

  await app.click('a:has-text("Consortia")', { timeout: EXIST_TIMEOUT });

  // Assert
  app.waitForSelector('button:has-text("Start Pipeline")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);
};

const runComputationBasic = async (
  { consortium },
  app,
  computationTimeout = COMPUTATION_TIMEOUT,
) => {
  try {
    await app.click('button:has-text("Start Pipeline")', { timeout: EXIST_TIMEOUT });

    // Assert
    app.waitForSelector(`div:has-text("Pipeline Starting for ${consortium.name}.")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null);
  } catch (e) {
    console.log(`-----------------------------------------${e}`);
  }

  // Display computation progress
  await app.click('a:has-text("Home")', { timeout: EXIST_TIMEOUT });

  // Assert
  app.waitForSelector('div.run-item-paper:first-child span:has-text("In Progress")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);

  // Display results
  await app.click('div.run-item-paper:first-child a:has-text("View Results")', { timeout: computationTimeout });
};

const runComputation = async (
  data,
  app,
  computationTimeout = COMPUTATION_TIMEOUT,
) => {
  await runComputationBasic(data, app, computationTimeout);

  const { consortium, pipeline } = data;

  // Assert
  await Promise.all([
    app.waitForSelector('h3:has-text("Regressions")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
    app.waitForSelector(`h6:has-text("Results: ${consortium.name} | ${pipeline.name}")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
  ]);
};

const runRegressionVBMComputation = async (
  data,
  app,
  computationTimeout = COMPUTATION_TIMEOUT,
) => {
  await runComputationBasic(data, app, computationTimeout);

  const { consortium, pipeline } = data;

  // Assert
  await Promise.all([
    app.waitForSelector('h4:has-text("Local stats")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
    app.waitForSelector(`h6:has-text("Results: ${consortium.name} | ${pipeline.name}")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
  ]);
};

const runDpsvmCsvComputation = async (
  data,
  app,
  computationTimeout = COMPUTATION_TIMEOUT,
) => {
  await runComputationBasic(data, app, computationTimeout);

  const { consortium, pipeline } = data;

  // Assert
  await Promise.all([
    app.waitForSelector('h3:has-text("Differentially private SVM classifier")', {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
    app.waitForSelector(`h6:has-text("Results: ${consortium.name} | ${pipeline.name}")`, {
      state: 'visible',
      timeout: EXIST_TIMEOUT,
    }).should.eventually.not.equal(null),
  ]);
};

const deleteConsortium = async (name, app) => {
  await app.click('a:has-text("Consortia")', { timeout: EXIST_TIMEOUT });

  await app.click(`button[name="${name}-delete"]`, { timeout: EXIST_TIMEOUT });

  await app.click('#list-delete-modal button:has-text("Delete")', { timeout: EXIST_TIMEOUT });

  // Assert

  // Wait for consortium item to be deleted from consortium list
  await app.waitForSelector(`h1:has-text("${name}")`, {
    state: 'hidden',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.equal(null);
};

module.exports = {
  create: createConsortium,
  addUser,
  accessAsMember,
  grantOwnership,
  setPipeline,
  join: joinConsortium,
  mapData: mapDataToConsortium,
  mapDataToConsortiumRegressionCsv,
  mapDataToConsortiumDpsvmCsv,
  runComputation,
  runRegressionVBMComputation,
  runDpsvmCsvComputation,
  delete: deleteConsortium,
};
