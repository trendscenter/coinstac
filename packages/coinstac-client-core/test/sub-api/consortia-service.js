'use strict';

const test = require('tape');
const clientFactory = require('../utils/client-factory');
const userFactory = require('../utils/user-factory');

const consortiumFactory = (opts) => (Object.assign({
  _id: 'thisisonlyatest',
  users: ['adumbledor', 'hpotter', userFactory().username],
  owners: ['adumbledor'],
  description: 'foo',
  label: 'foo',
  tags: ['foo'],
}, opts));

test('ConsortiaService - Model Service methods', (t) => {
  const con1 = consortiumFactory({ _id: '1' });
  const con2 = consortiumFactory({ _id: '2' });
  const handleTeardown = (err) => {
    if (err) { return t.end(err && err.message); }
    t.pass('teardown ok');
    t.end();
  };
  let c1;

  t.plan(4);

  clientFactory()
  .then((client) => {
    c1 = client;
    return c1.consortia.save(con1);
  })
  .then(() => c1.consortia.all())
  .then((docs) => t.equals(docs.length, 1, 'service persists models'))
  .then(() => c1.consortia.getBy('_id', con1._id))
  .then((doc) => t.equals(doc.description, con1.description, 'getBy proxy'))
  .then(() => {
    return c1.consortia.save(con2);
  })
  .then((doc) => {
    t.ok(doc._id, 'doc generated');
  })
  .then(() => c1.teardown(handleTeardown))
  .then(() => t.pass('teardown'))
  .catch(t.end);
});

test('ConsortiaService - getUserConsortia', (t) => {
  const con1 = consortiumFactory();
  let c1;

  t.plan(2);

  clientFactory()
  .then((client) => {
    c1 = client;
    return c1.consortia.save(con1);
  })
  .then(() => c1.consortia.getUserConsortia(userFactory().username))
  .then((docs) => t.equals(docs.length, 1, 'getUserConsortia'))
  .then(() => c1.teardown())
  .then(() => t.pass('teardown'))
  .catch(t.end);
});
