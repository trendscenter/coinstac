const { screenshot, setup, cleanup } = require('../lib/setup');
const user = require('../lib/user');
const { USER_1, USER_2 } = require('../lib/constants');
const consortia = require('../lib/consortia');
const pipeline = require('../lib/pipeline');

const DATA = {
  consortium: {
    name: 'e2e-consortium-2-member',
    description: 'e2e-description-2-member',
  },
  pipeline: {
    name: 'e2e-pipeline-2-member',
    description: 'e2e-pipeline-description-2-member',
  },
  computation: {
    name: 'Ridge Regression (Singleshot) - FreeSurfer Volumes',
  },
};

let appWindow1;
let appWindow2;

describe('e2e run computation with 2 members', () => {
  afterEach(screenshot);

  before(async () => {
    [appWindow1, appWindow2] = await setup(2);
  });

  after(cleanup);

  it('displays the correct title', async () => {
    await appWindow1.title().should.eventually.equal('COINSTAC');
  });

  it('authenticates demo user on first instance', async () => {
    await user.logIn(USER_1, appWindow1);
  });

  it('authenticates demo user on second instance', async () => {
    await user.logIn(USER_2, appWindow2);
  });

  it('creates a consortium', async () => {
    await consortia.create(DATA.consortium, appWindow1);
  });

  it('creates a pipeline', async () => {
    await pipeline.create(DATA, appWindow1);
  });

  it('sets the created pipeline to the consortium', async () => {
    await consortia.setPipeline(DATA, appWindow1);
  });

  it('joins a consortium', async () => {
    await consortia.join(DATA, appWindow2);
  });

  it('map data to consortium on site 1', async () => {
    await consortia.mapData(DATA.consortium.name, appWindow1);
  });

  it('map data to consortium on site 2', async () => {
    await consortia.mapData(DATA.consortium.name, appWindow2);
  });

  it('runs a computation', async () => {
    await consortia.runComputation(DATA, appWindow1);
  });

  it('deletes consortium', async () => {
    await consortia.delete(DATA.consortium.name, appWindow1);
  });

  it('logs out', async () => {
    await user.logOut(appWindow1);
    await user.logOut(appWindow2);
  });
});
