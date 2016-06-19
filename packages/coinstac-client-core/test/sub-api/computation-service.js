'use strict';

const common = require('coinstac-common');
const ComputationService = require('../../src/sub-api/computation-service');
const sinon = require('sinon');
const tape = require('tape');

const Computation = common.models.computation.Computation;
const RemoteComputationResult = common.models.computation.RemoteComputationResult;

tape('ComputationService :: modelServiceHooks', t => {
  const computationService = new ComputationService({
    client: {},
    dbRegistry: {},
  });
  const modelServiceHooks = computationService.modelServiceHooks();

  t.equal(modelServiceHooks.dbName, 'computations', 'returns db name');
  t.equal(modelServiceHooks.ModelType, Computation, 'returns Computation model');

  t.end();
});

tape('ComputationService :: kickoff', t => {
  const consortiumId = 'the-wildest-computation';
  const consortiaGetStub = sinon.stub().returns(Promise.resolve({
    activeComputationId: 'the-most-active-id-evar',
  }));
  const project = {
    name: 'a-project-so-sweet',
    files: [{
      filename: 'dope-file',
    }, {
      filename: 'baller-file',
    }, {
      filename: 'ill-file',
    }],
  };
  const projectsGetStub = sinon.stub().returns(Promise.resolve(project));
  const projectId = 'the-craziest-project';
  const triggerRunnerStub = sinon.stub().returns(
    Promise.resolve('consider-yourself-triggered')
  );

  const computationService = new ComputationService({
    client: {
      consortia: {
        db: {
          get: consortiaGetStub,
        },
      },
      projects: {
        db: {
          get: projectsGetStub,
        },
      },
      pool: {
        triggerRunner: triggerRunnerStub,
      },
    },
    dbRegistry: {},
  });

  t.plan(7);

  computationService.kickoff({ consortiumId, projectId })
    .then(response => {
      t.equal(
        consortiaGetStub.firstCall.args[0],
        consortiumId,
        'retrieves consortium via consortiumId'
      );
      t.equal(
        projectsGetStub.firstCall.args[0],
        projectId,
        'retrieves project via projectId'
      );


      const args = triggerRunnerStub.firstCall.args;

      t.ok(
        args[0] instanceof RemoteComputationResult,
        'passes remote computation result'
      );

      t.ok(
        args[0].computationId === 'the-most-active-id-evar' &&
        args[0].consortiumId === consortiumId,
        'sets computation and consortium IDs on remote computation result'
      );

      t.ok(args[0]._id, 'sets run ID on remote computation result');

      t.equal(
        triggerRunnerStub.firstCall.args[1],
        project,
        'passes project to pool’s triggerRunner method'
      );
      t.equal(
        response,
        'consider-yourself-triggered',
        'passes pool’s triggerRunner’s response'
      );
    })
    .catch(t.end);
});
