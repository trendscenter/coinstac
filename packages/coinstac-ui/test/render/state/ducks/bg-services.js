import app from 'ampersand-app';
import EventEmitter from 'events';
import {
  joinSlaveComputation,
} from '../../../../app/render/state/ducks/bg-services';
import noop from 'lodash/noop';
import setProp from 'lodash/set';
import sinon from 'sinon';
import tape from 'tape';

tape('joins slave computation', t => {
  const consortiumId = 'geodude';
  const ee = new EventEmitter();
  const getActiveRunIdStub = sinon.stub();
  const getByStub = sinon.stub();
  const joinRunStub = sinon.stub();
  const joinSlavedRunStub = sinon.stub();
  const shouldJoinRunStub = sinon.stub();
  const runId = 'bulbasaur';

  const consortium = {
    _id: consortiumId,
    activeRunId: runId,
    label: 'Geodude is cool',
    users: ['pikachu'],
  };

  const project = {
    _id: 'project-1',
    consortiumId,
  };

  getByStub.returns(Promise.resolve(project));
  getByStub.onCall(0).returns(Promise.resolve(undefined));
  getActiveRunIdStub.returns(Promise.resolve(runId));
  getActiveRunIdStub.onCall(1).returns(Promise.resolve(undefined));
  shouldJoinRunStub.returns(Promise.resolve(true));
  shouldJoinRunStub.onCall(2).returns(Promise.resolve(false));

  setProp(app, 'core.computations.joinRun', joinRunStub);
  setProp(app, 'core.computations.joinSlavedRun', joinSlavedRunStub);
  setProp(app, 'core.computations.shouldJoinRun', shouldJoinRunStub);
  setProp(app, 'core.consortia.getActiveRunId', getActiveRunIdStub);
  setProp(app, 'core.pool.events', ee);
  setProp(app, 'core.projects.getBy', getByStub);

  // TODO: Figure out how to mock the utils/notifications.js module
  setProp(app, 'notifications.push', noop);

  t.plan(7);

  joinSlaveComputation(consortium)
    .then(() => {
      t.ok(
        getByStub.calledWithExactly('consortiumId', consortiumId),
        'calls projects getBy'
      );
      t.ok(
        getActiveRunIdStub.calledWithExactly(consortiumId),
        'gets active run ID'
      );
      t.ok(
        shouldJoinRunStub.calledWithExactly(consortiumId, false),
        'calls should join'
      );
      t.notOk(joinRunStub.callCount, 'doesn’t call without project');
      t.notOk(joinSlavedRunStub.callCount, 'doesn’t call slaved without project');

      return joinSlaveComputation(consortium);
    })
    .then(() => {
      t.notOk(joinRunStub.callCount, 'doesn’t call without run ID');
      return joinSlaveComputation(consortium);
    })
    .then(() => {
      t.notOk(joinRunStub.callCount, 'doesn’t call without should join');
      return joinSlaveComputation(consortium);
    })
    .then(() => {
      t.deepEqual(
        joinRunStub.firstCall.args[0],
        {
          consortiumId,
          projectId: 'project-1',
          runId,
        },
        'calls joinRun with proper args'
      );
    })
    .catch(t.end)
    .then(() => {
      // teardown
      delete app.core;
      delete app.notifications;
    });
});
