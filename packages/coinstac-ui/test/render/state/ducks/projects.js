import app from 'ampersand-app';
import noop from 'lodash/noop';
import projectsReducer, {
  mapProject,
  removeProject,
  updateProjectStatus,
  UPDATE_PROJECT_STATUS,
} from '../../../../app/render/state/ducks/projects';
import setProp from 'lodash/set';
import sinon from 'sinon';
import tape from 'tape';

tape('Project mapping', t => {
  setProp(app, 'core.computations.canStartComputation', noop);

  const canStartStub = sinon.stub(app.core.computations, 'canStartComputation');
  const consortiumId = 'cats';
  const project = {
    _id: 'memes',
    consortiumId: null,
    files: [],
    name: 'The Best Memes',
  };

  canStartStub.returns(Promise.resolve());
  canStartStub.onCall(0).returns(Promise.reject());

  t.plan(6);

  mapProject(project)
    .then(p => {
      t.ok('allowComputationRun' in p && 'status' in p, 'adds properties');
      t.notOk(p.allowComputationRun, 'no consortium == no comp run');
      t.ok(p.status, 'waiting', 'sets default status');

      return mapProject(Object.assign({}, p, { consortiumId }));
    })
    .then(p => {
      t.notOk(p.allowComputationRun, 'disallows comp run via client-core');

      return mapProject(Object.assign({}, p, {
        consortiumId,
        status: 'active',
      }));
    })
    .then(p => {
      t.ok(p.status, 'active', 'doesn\'t modify set status');
      t.ok(p.allowComputationRun, 'permits comp run via client-core');
    })
    .catch(t.end)
    .then(() => canStartStub.restore());
});

tape('Updates project status', t => {
  const project1 = {
    _id: 'portland',
    allowComputationRun: false,
    consortiumId: 'minneapolis',
    status: 'waiting',
  };
  const project2 = {
    _id: 'nashville',
    allowComputationRun: false,
    consortiumId: 'indianapolis',
    status: 'error',
  };

  t.deepEqual(
    updateProjectStatus({
      id: 'yolo',
      status: 'wat',
    }),
    {
      id: 'yolo',
      status: 'wat',
      type: UPDATE_PROJECT_STATUS,
    },
    'action creator generates proper payload'
  );
  t.deepEqual(
    projectsReducer(
      [project1, project2],
      updateProjectStatus({
        id: 'nashville',
        status: 'active',
      })
    ),
    [project1, Object.assign({}, project2, { status: 'active' })],
    'updates project'
  );

  t.end();
});

tape('removes project', (t) => {
  const projectId = 'delete-me';
  const initialProjects = [{
    _id: projectId,
    name: 'Project to delete',
  }, {
    _id: 'save-me',
    name: 'Project to save',
  }];

  t.deepEqual(
    projectsReducer(initialProjects, removeProject(projectId)),
    [initialProjects[1]],
    'removes project from state'
  );
  t.end();
});

