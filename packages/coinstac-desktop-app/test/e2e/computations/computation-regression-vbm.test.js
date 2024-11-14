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
    name: 'Regression - VBM',
  },
};

describe('e2e run regression-vbm computation', () => {
  before(async () => {
    appWindow = await setup(1, {
      instanceData: [
        {
          appId: 'regression-vbm',
          env: {
            COVARIATE_FILE_PATH: path.join(
              __dirname,
              '../../../../../algorithm-development/test-data/nifti-test-data/site1/covariates.csv',
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
    await pipeline.createRegressionVBMPipeline(DATA, appWindow);
  });

  it('map data to consortium', async () => {
    await consortium.mapData(DATA.consortium.name, appWindow);
  });

  it('runs a computation', async () => {
    await consortium.runRegressionVBMComputation(DATA, appWindow, 360000);
  });

  it('deletes consortium', async () => {
    await consortium.delete(DATA.consortium.name, appWindow);
  });

  it('logs out', async () => {
    await user.logOut(appWindow);
  });
});
