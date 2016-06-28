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
      auth: {
        getUser: sinon.stub().returns({
          username: 'testUserName',
        }),
      },
      consortia: {
        get: sinon.stub(),
      },
      dbRegistry: {
        get: sinon.stub().returns({
          find: () => Promise.resolve([]),
        }),
      },
      projects: {
        get: sinon.stub(),
      },
      pool: {
        triggerRunner: sinon.stub().returns(Promise.resolve(
          'consider-yourself-triggered'
        )),
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
  const args = {
    consortiumId: 'bla bla bla',
    projectId: 'wat wat wat',
  };
  const params = getStubbedParams();
  const computationService = new ComputationService(params);

  params.client.consortia.get.onCall(0).returns(Promise.resolve({
    _id: 'bla bla bla',
    label: 'WAT is consortium?',
    owners: [],
  }));
  params.client.consortia.get.onCall(1).returns(Promise.resolve({
    _id: 'bla bla bla',
    activeComputationId: 'most active evar',
    label: 'WAT is consortium?',
    owners: [],
  }));

  params.client.projects.get.returns(Promise.resolve({
    _id: 'wat wat wat',
    label: 'Bla is project?',
  }));

  t.plan(2);

  computationService.kickoff(args)
    .then(() => t.fail('resolves when consortium lacks active computation ID'))
    .catch(error => {
      t.ok(
        error && error.message.indexOf('active computation') > -1,
        'rejects when consortium lacks active computation ID'
      );

      return computationService.kickoff(args);
    })
    .then(() => t.fail('resolves when not a consortium owner'))
    .catch(error => {
      t.ok(
        error && error.message.indexOf('consortium owner') > -1,
        'rejects when not a consortium owner'
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

  params.client.consortia.get.returns(Promise.resolve({
    _id: consortiumId,
    activeComputationId: 'the-most-active-id-evar',
    label: 'Baller Consortium',
    owners: ['testUserName'],
  }));
  params.client.projects.get.returns(Promise.resolve(project));

  t.plan(7);

  computationService.kickoff({ consortiumId, projectId })
    .then(response => {
      t.equal(
        params.client.consortia.get.firstCall.args[0],
        consortiumId,
        'retrieves consortium via consortiumId'
      );
      t.equal(
        params.client.projects.get.firstCall.args[0],
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
