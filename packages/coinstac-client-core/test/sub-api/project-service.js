'use strict';

const test = require('tape');
const clientFactory = require('../utils/client-factory');
const projectFactory = require('../utils/project-factory');

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
