const path = require('path');
const consortium = require('../../lib/consortia');
const pipeline = require('../../lib/pipeline');
const {
  setup,
  afterHandler,
  afterEachHandler,
  beforeHandler,
  beforeEachHandler,
} = require('../../lib/setup');
const user = require('../../lib/user');
const { USER_1 } = require('../../lib/constants');

let appWindow;

const DATA = {
  consortium: {
    name: 'e2e-consortium-single',
    description: 'e2e-description-single',
  },
  pipeline: {
    name: 'e2e-pipeline-single',
    description: 'e2e-pipeline-description-single',
  },
  computation: {
    name: 'Regression - CSV',
  },
};

describe('e2e run regression-csv computation', () => {
  before(async () => {
    appWindow = await setup(1, {
      instanceData: [
        {
          appId: 'regression-csv',
          env: {
            DATA_FILE_PATH: path.join(
              __dirname,
              '../../../../../algorithm-development/test-data/regression-csv-test-data/input/local0/simulatorRun/site1_data.csv',
            ),
            COVARIATE_FILE_PATH: path.join(
              __dirname,
              '../../../../../algorithm-development/test-data/regression-csv-test-data/input/local0/simulatorRun/site1_Covariate.csv',
            ),
          },
        },
      ],
    });
    beforeHandler();
  });

  after(afterHandler);

  beforeEach(beforeEachHandler);

  afterEach(afterEachHandler);

  it('displays the correct title', async () => {
    await appWindow.title().should.eventually.equal('COINSTAC');
  });

  it('authenticates demo user', async () => {
    await user.logIn(USER_1, appWindow);
  });

  it('creates a consortium', async () => {
    await consortium.create(DATA.consortium, appWindow);
  });

  it('creates a pipeline', async () => {
    await pipeline.createRegressionCsvPipeline(DATA, appWindow);
  });

  it('map data to consortium', async () => {
    await consortium.mapDataToConsortiumRegressionCsv(
      DATA.consortium.name,
      appWindow,
    );
  });

  it('runs a computation', async () => {
    await consortium.runComputation(DATA, appWindow, 360000);
  });

  it('deletes consortium', async () => {
    await consortium.delete(DATA.consortium.name, appWindow);
  });

  it('logs out', async () => {
    await user.logOut(appWindow);
  });
});
