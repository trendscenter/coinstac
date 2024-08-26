const { EXIST_TIMEOUT } = require('../lib/constants');

const addCovariate = async (name, type, index, app) => {
  await app.click('button:has-text("Add Covariates")', { timeout: EXIST_TIMEOUT });

  await app.click(`#covariates-${index}-data-dropdown`, { timeout: EXIST_TIMEOUT });
  await app.click(`#covariates-${index}-data-dropdown-menu li:has-text("${type}")`, { timeout: EXIST_TIMEOUT });

  await app.fill(`#covariates-${index}-input-name`, name);
};

const addPipelineCommonData = async ({ pipeline, consortium, computation }, app) => {
  // Go to create pipeline page
  await app.click('a:has-text("Pipelines")');

  await app.click('a[name="create-pipeline-button"]', { timeout: EXIST_TIMEOUT });

  // Assert
  await app.waitForSelector('h4:has-text("Pipeline Creation")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);

  // Create pipeline
  await app.fill('#name', pipeline.name);
  await app.fill('#description', pipeline.description);

  await app.click('#pipelineconsortia', { timeout: EXIST_TIMEOUT });
  await app.click(`#consortium-menu li:has-text("${consortium.name}")`, { timeout: EXIST_TIMEOUT });

  await app.click('#computation-dropdown', { timeout: EXIST_TIMEOUT });
  await app.click(`#computation-menu li:has-text("${computation.name}")`, { timeout: EXIST_TIMEOUT });

  await app.click('.pipeline-step', { timeout: EXIST_TIMEOUT });
};

const savePipeline = async (app) => {
  await app.click('button:has-text("Save Pipeline")', { timeout: EXIST_TIMEOUT });

  // Assert
  await app.waitForSelector('div:has-text("Pipeline Saved")', {
    state: 'visible',
    timeout: EXIST_TIMEOUT,
  }).should.eventually.not.equal(null);
};

const createPipeline = async (data, app) => {
  await addPipelineCommonData(data, app);

  await addCovariate('isControl', 'boolean', 0, app);
  await addCovariate('age', 'number', 1, app);
  await addCovariate('gender', 'string', 2, app);

  await app.click('button:has-text("Add Data")', { timeout: EXIST_TIMEOUT });

  await app.click('#data-0-data-dropdown', { timeout: EXIST_TIMEOUT });
  await app.click('#data-0-data-dropdown-menu li:has-text("FreeSurfer")', { timeout: EXIST_TIMEOUT });

  await app.click('#data-0-area', { timeout: EXIST_TIMEOUT });
  await app.click('#data-0-area .react-select-dropdown-menu div:has-text("5th-Ventricle")', { timeout: EXIST_TIMEOUT });

  await app.fill('[name="step-lambda"]', '1');

  await savePipeline(app);
};

const createRegressionCSVPipeline = async (data, app) => {
  await addPipelineCommonData(data, app);

  await app.click('button:has-text("Add Local Data")', { timeout: EXIST_TIMEOUT });
  await app.click('button:has-text("Data Type")', { timeout: EXIST_TIMEOUT });
  await app.click('li:has-text("Data CSV File")', { timeout: EXIST_TIMEOUT });

  await app.click('button:has-text("Add Local Covariates")', { timeout: EXIST_TIMEOUT });
  await app.click('button:has-text("Data Type")', { timeout: EXIST_TIMEOUT });
  await app.click('li:has-text("Covariate CSV File")', { timeout: EXIST_TIMEOUT });

  await savePipeline(app);
};

const createRegressionVBMPipeline = async (data, app) => {
  await addPipelineCommonData(data, app);

  await addCovariate('isControl', 'boolean', 0, app);
  await addCovariate('age', 'number', 1, app);
  await addCovariate('sex', 'string', 2, app);

  await app.click('button:has-text("Add Data")', { timeout: EXIST_TIMEOUT });
  await app.click('button:has-text("Data Type")', { timeout: EXIST_TIMEOUT });
  await app.click('li:has-text("NiFTI")', { timeout: EXIST_TIMEOUT });

  await savePipeline(app);
};

module.exports = {
  create: createPipeline,
  createRegressionCSVPipeline,
  createRegressionVBMPipeline,
};
