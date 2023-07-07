const {
  setup,
  beforeHandler,
  afterHandler,
  beforeEachHandler,
  afterEachHandler,
} = require('../lib/setup');
const user = require('../lib/user');
const { USER_1, USER_4 } = require('../lib/constants');
const consortia = require('../lib/consortia');

const DATA = {
  consortium: {
    name: 'e2e-consortium-2-member',
    description: 'e2e-description-2-member',
  },
};

let appWindow1;
let appWindow2;

describe('e2e consortia permissions', () => {
  before(async () => {
    [appWindow1, appWindow2] = await setup(2);
    beforeHandler();
  });

  after(afterHandler);

  beforeEach(beforeEachHandler);

  afterEach(afterEachHandler);

  it('displays the correct title', async () => {
    await appWindow1.title().should.eventually.equal('COINSTAC');
  });

  it('authenticates demo user on first instance', async () => {
    await user.logIn(USER_1, appWindow1);
  });

  it('authenticates demo user on second instance', async () => {
    await user.logIn(USER_4, appWindow2);
  });

  it('creates a consortium', async () => {
    await consortia.create(DATA.consortium, appWindow1);
  });

  it('add another user as member', async () => {
    await consortia.addUser({
      consortiumName: DATA.consortium.name,
      username: USER_4.username,
    }, appWindow1);
  });

  it('access consortium as member', async () => {
    await consortia.accessAsMember({ username: USER_4.username }, appWindow2);
  });

  it('grant ownership to a member', async () => {
    await consortia.grantOwnership({
      consortiumName: DATA.consortium.name,
      username: USER_4.username,
    }, appWindow1);
  });

  it('deletes consortium', async () => {
    await consortia.delete(DATA.consortium.name, appWindow1);
  });

  it('logs out', async () => {
    await user.logOut(appWindow1);
    await user.logOut(appWindow2);
  });
});
