'use strict';

const clientFactory = require('../utils/client-factory');
const fileStats = require('../../src/utils/file-stats');
const projectFactory = require('../utils/project-factory');
const ProjectService = require('../../src/sub-api/project-service');
const sinon = require('sinon');
const test = require('tape');

// TODO: This test fails when this file is tested independently. Why?
test('ProjectService - addFiles/removeFiles', (t) => {
  const p1 = projectFactory();
  let c1;

  t.plan(6);

  clientFactory()
  .then(client => {
    c1 = client;
    return c1.projects.save(p1);
  })
  .then((doc) => Object.assign(p1, doc)) // update p1 w/ latest attrs, e.g. _rev
  .then(() => t.equals(p1.files.length, 0, 'files empty on first persist'))
  // pretend to add some files
  .then(() => c1.projects.addFiles(p1, []))
  .then((files) => t.equals(files.length, 0, 'no files added'))
  // add some files
  .then(() => c1.projects.addFiles(p1, __filename))
  .then((files) => {
    t.equals(files.length, 1, 'files added');
    Object.assign(p1.files, files);
  })
  // attempt to add the same file again
  .then(() => c1.projects.addFiles(p1, __filename))
  .then((files) => {
    t.equals(files.length, 1, 'file add request ignored on duplicate filename');
  })
  // remove files
  .then(() => c1.projects.removeFiles(p1, __filename))
  .then((files) => t.equals(files.length, 0, 'file removed'))
  .then(() => c1.teardown())
  .then(() => t.pass('teardown'))
  .then(t.end, t.end);
});

test('ProjectSerice - gets stats', t => {
  const param1 = [0, 1, 2];
  const param2 = 'wat';
  const prepareStub = sinon.stub(fileStats, 'prepare');

  prepareStub.returns(Promise.resolve('bananas'));


  t.plan(3);

  ProjectService.prototype.getFileStats(param1)
    .then(response => {
      t.equal(prepareStub.lastCall.args[0], param1, 'passes array param');
      t.equal(response, 'bananas', 'passes fileStats#prepare response');

      return ProjectService.prototype.getFileStats(param2);
    })
    .then(() => {
      t.deepEqual(
        prepareStub.lastCall.args[0],
        [param2],
        'changes single items to array'
      );
    })
    .catch(t.end)
    .then(prepareStub.restore);
});
