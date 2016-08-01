import app from 'ampersand-app';
import {
  joinSlaveComputation,
} from '../../../../app/render/state/ducks/bg-services';
import noop from 'lodash/noop';
import setProp from 'lodash/set';
import sinon from 'sinon';
import tape from 'tape';

tape('joins slave computation', t => {
  const consortiumId1 = 'geodude';
  const consortiumId2 = 'charmander';
  const joinRunStub = sinon.stub().returns(Promise.resolve());
  const runId1 = 'bulbasaur';
  const runId2 = 'pikachu';
  const runId3 = 'jigglypuff';
  const username = 'kittens';

  const consortium = {
    _id: consortiumId1,
    activeRunId: runId1,
    label: 'Geodude is cool',
    users: [username],
  };

  const localDocs = [{
    _id: `${runId1}-puppies`,
  }, {
    _id: `${runId2}-${username}`,
  }, {
    _id: `${runId3}-calves`,
  }];
  const remoteDocs = [{
    _id: runId1,
    consortiumId: consortiumId1,
  }, {
    _id: runId2,
    consortiumId: consortiumId2,
  }];
  const projects = [{
    _id: 'project-1',
    consortiumId: consortiumId1,
  }, {
    _id: 'project-2',
    consortiumId: consortiumId1,
  }];

  setProp(app, 'core.auth.getUser', () => ({ username }));
  setProp(app, 'core.dbRegistry.get', noop);
  setProp(app, 'core.computations.joinRun', joinRunStub);

  const projectsDBFindStub = sinon.stub().returns(Promise.resolve(projects));

  const dbGetStub = sinon.stub(app.core.dbRegistry, 'get', (dbName) => {
    if (dbName.indexOf('local-consortium-') > -1) {
      return {
        all: () => Promise.resolve(localDocs),
      };
    } else if (dbName.indexOf('remote-consortium-') > -1) {
      return {
        find: () => Promise.resolve(remoteDocs),
      };
    } else if (dbName === 'projects') {
      return {
        find: projectsDBFindStub,
      };
    }
  });

  t.plan(2);

  joinSlaveComputation(consortium)
    .then(() => {
      t.deepEqual(
        projectsDBFindStub.lastCall.args[0],
        {
          selector: {
            consortiumId: {
              $in: [consortiumId1],
            },
          },
        },
        'only retrieves unrun projects'
      );

      t.deepEqual(
        [
          joinRunStub.firstCall.args[0],
          joinRunStub.secondCall.args[0],
        ],
        [{
          consortiumId: consortiumId1,
          projectId: 'project-1',
          runId: runId1,
        }, {
          consortiumId: consortiumId1,
          projectId: 'project-2',
          runId: runId1,
        }],
        'calls joinRun with proper args'
      );
    })
    .catch(t.end)
    .then(() => {
      // teardown
      dbGetStub.restore();
      delete app.core;
    });
});
