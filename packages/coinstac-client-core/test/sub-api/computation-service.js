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
          _hasLikelySynced: true,
          find: () => Promise.resolve([]),
          url: 'http://coins.mrn.org',
        }),
      },
      projects: {
        get: sinon.stub(),
        getMetaFileContents: sinon.stub(),
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

tape('ComputationService :: canStartComputation', t => {
  const consortiumId = 'bla bla bla';
  const consortium = {
    _id: consortiumId,
    label: 'WAT is consortium?',
    owners: [],
  };
  const params = getStubbedParams();
  const computationService = new ComputationService(params);

  params.client.consortia.get.returns(Promise.resolve(
    Object.assign({}, consortium, {
      activeComputationId: 'most active evar',
      owners: ['testUserName'],
    })
  ));
  params.client.consortia.get.onCall(0).returns(Promise.resolve(consortium));
  params.client.consortia.get.onCall(1).returns(Promise.resolve(
    Object.assign({}, consortium, {
      activeComputationId: 'most active evar',
    })
  ));

  params.client.dbRegistry.get.returns(Promise.resolve({
    _hasLikelySynced: true,
    find: () => Promise.resolve([{
      _id: 'baller-document',
    }]),
    url: 'http://coins.mrn.org',
  }));
  params.client.dbRegistry.get.onCall(3).returns(Promise.resolve({
    _hasLikelySynced: true,
    find: () => Promise.resolve([]),
    url: 'http://coins.mrn.org',
  }));

  params.client.projects.get.returns(Promise.resolve({
    _id: 'wat wat wat',
    label: 'Bla is project?',
  }));

  t.plan(4);

  computationService.canStartComputation(consortiumId)
    .then(() => t.fail('resolves when consortium lacks active computation ID'))
    .catch(error => {
      t.ok(
        error && error.message.indexOf('active computation') > -1,
        'rejects when consortium lacks active computation ID'
      );

      return computationService.canStartComputation(consortiumId);
    })
    .then(() => t.fail('resolves when not a consortium owner'))
    .catch(error => {
      t.ok(
        error && error.message.indexOf('consortium owner') > -1,
        'rejects when not a consortium owner'
      );

      return computationService.canStartComputation(consortiumId);
    })
    .then(() => t.fail('resolves when a run is active'))
    .catch(error => {
      t.ok(
        error && error.message.indexOf('one computation') > -1,
        'rejects when a run is active'
      );

      return computationService.canStartComputation(consortiumId);
    })
    .then(() => t.pass('resolves when conditions suitable'))
    .catch(t.end);
});

tape('ComputationService :: doTriggerRunner errors', t => {
  const params = getStubbedParams();
  const computationService = new ComputationService(params);

  params.client.projects.get.returns(Promise.resolve({
    files: [{
      filename: 'session-ale',
      tags: {},
    }],
  }));
  params.client.projects.getMetaFileContents.returns(Promise.resolve([]));

  t.plan(4);

  computationService.doTriggerRunner({})
    .catch(() => {
      t.pass('rejects without consortium ID');

      return computationService.doTriggerRunner({ consortiumId: 'pilsner' });
    })
    .catch(() => {
      t.pass('rejects without project ID');

      return computationService.doTriggerRunner({
        consortiumId: 'pilsner',
        projectId: 'ipa',
      });
    })
    .catch(() => {
      t.pass('rejects without run ID');

      return computationService.doTriggerRunner({
        consortiumId: 'pilsner',
        projectId: 'ipa',
        runId: 'pale-ale',
      });
    })
    .catch(error => {
      t.ok(
        error.message.indexOf('session-ale') > -1,
        'rejects when file meta DNE'
      );
    })
    .catch(t.end);
});

tape('ComputationService :: doTriggerRunner', t => {
  const params = getStubbedParams();

  const computationService = new ComputationService(params);
  const consortiumId = 'the-wildest-computation';
  const project = {
    _id: 'a-project-so-sweet',
    name: 'The Sweetest Project',
    files: [{
      filename: '/Users/coinstac/dope-file.txt',
      tags: {},
    }, {
      filename: '/Users/coinstac/baller-file.txt',
      tags: {},
    }, {
      filename: '/Users/coinstac/ill-file.txt',
    }],
  };
  const runId = 'runningestIdentifier';

  params.client.consortia.get.returns(Promise.resolve({
    _id: consortiumId,
    activeComputationId: 'the-most-active-id-evar',
    label: 'Baller Consortium',
    owners: ['testUserName'],
  }));
  params.client.projects.get.returns(Promise.resolve(project));
  params.client.projects.getMetaFileContents.returns(Promise.resolve([
    ['dope-file.txt', true],
    ['baller-file.txt', false],
    ['ill-file.txt', true],
  ]));

  t.plan(7);

  computationService.doTriggerRunner({
    consortiumId,
    projectId: project._id,
    runId,
  })
    .then(response => {
      t.equal(
        params.client.consortia.get.firstCall.args[0],
        consortiumId,
        'retrieves consortium via consortiumId'
      );
      t.equal(
        params.client.projects.get.firstCall.args[0],
        project._id,
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

      t.equal(args[0]._id, runId, 'sets run ID on remote computation result');

      t.deepEqual(
        triggerRunnerStub.firstCall.args[1],
        Object.assign({}, project, {
          files: project.files.map((file, index) => {
            return Object.assign({}, file, {
              tags: {
                isControl: index % 2 < 1,
              },
            });
          }),
        }),
        'passes transformed project to pool’s triggerRunner method'
      );
      t.equal(
        response,
        'consider-yourself-triggered',
        'passes pool’s triggerRunner’s response'
      );
    })
    .catch(t.end);
});

tape('ComputationService :: kickoff', t => {
  const params = getStubbedParams();

  const computationService = new ComputationService(params);
  const canStub = sinon
    .stub(computationService, 'canStartComputation')
    .returns(Promise.resolve(true));
  const consortiumId = 'brown-ale';
  const doStub = sinon.stub(computationService, 'doTriggerRunner')
    .returns(Promise.resolve('porter'));
  const projectId = 'irish-red';

  params.client.consortia.get.returns({ activeComputationId: '' });

  t.plan(3);

  computationService.kickoff({ consortiumId, projectId })
    .then(response => {
      t.ok(
        params.client.consortia.get.calledWith(consortiumId),
        'retrieves consortium by passed ID'
      );
      t.ok(doStub.firstCall.args[0].runId, 'passes a run ID');
      t.equal(response, 'porter', 'returns doTrigger\'s response');
    })
    .catch(t.end)
    .then(() => {
      // teardown
      canStub.restore();
      doStub.restore();
    });
});

tape('ComputationService :: joinRun', t => {
  const params = getStubbedParams();

  const computationService = new ComputationService(params);
  const consortiumId = 'stout';
  const doStub = sinon.stub(computationService, 'doTriggerRunner')
    .returns(Promise.resolve('farmhouse-ale'));
  const projectId = 'saison';
  const runId = 'bier-de-garde';

  t.plan(2);

  computationService.joinRun({ consortiumId, projectId, runId })
    .then(response => {
      t.ok(
        doStub.calledWithExactly({ consortiumId, projectId, runId }),
        'passes args to doTrigger'
      );
      t.equal(response, 'farmhouse-ale', 'passes doTrigger\'s response');
    })
    .catch(t.end)
    .then(() => {
      // teardown
      doStub.restore();
    });
});
