'use strict';

const common = require('coinstac-common');
const ComputationService = require('../../src/sub-api/computation-service');
const sinon = require('sinon');
const tape = require('tape');

const Computation = common.models.computation.Computation;
const RemoteComputationResult = common.models.computation.RemoteComputationResult;

/**
 * Get stubbed params fro `ComputationService#kickoff`.
 *
 * @returns {Object}
 */
function getStubbedParams() {
  return {
    client: {
      consortia: {
        db: {
          get: sinon.stub(),
        },
      },
      projects: {
        db: {
          get: sinon.stub(),
        },
      },
      pool: {
        triggerRunner: sinon.stub().returns(Promise.resolve()),
      },
    },
    dbRegistry: {},
  };
}

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

tape('ComputationService :: kickoff errors', t => {
  const params = getStubbedParams();
  const computationService = new ComputationService(params);

  params.client.consortia.db.get.returns(Promise.resolve({
    _id: 'bla bla bla',
    label: 'WAT is consortium?',
  }));
  params.client.projects.db.get.returns(Promise.resolve({
    _id: 'wat wat wat',
    label: 'Bla is project?',
  }));

  t.plan(1);

  computationService.kickoff({
    consortiumId: 'bla bla bla',
    projectId: 'wat wat wat',
  })
    .then(() => t.fail('resolves when consortium lacks active computation ID'))
    .catch(error => {
      t.ok(
        error && error.message.indexOf('active computation') > -1,
        'rejects when consortium lacks active computation ID'
      );
    });
});

tape('ComputationService :: kickoff', t => {
  const params = getStubbedParams();

  const computationService = new ComputationService(params);
  const consortiumId = 'the-wildest-computation';
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
  const projectId = 'the-craziest-project';

  params.client.consortia.db.get.returns(Promise.resolve({
    _id: consortiumId,
    activeComputationId: 'the-most-active-id-evar',
    label: 'Baller Consortium',
  }));
  params.client.projects.db.get.returns(Promise.resolve(project));
  params.client.pool.triggerRunner.returns(Promise.resolve(
    'consider-yourself-triggered'
  ));

  t.plan(7);

  computationService.kickoff({ consortiumId, projectId })
    .then(response => {
      t.equal(
        params.client.consortia.db.get.firstCall.args[0],
        consortiumId,
        'retrieves consortium via consortiumId'
      );
      t.equal(
        params.client.projects.db.get.firstCall.args[0],
        projectId,
        'retrieves project via projectId'
      );


      const triggerRunnerStub = params.client.pool.triggerRunner;
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
