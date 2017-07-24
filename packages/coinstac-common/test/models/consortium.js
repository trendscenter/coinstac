'use strict';

const Consortium = require('../../').models.Consortium;
const test = require('tape');
const _ = require('lodash');

const validOpts = () => ({
  _id: 'testConsortiumId',
  users: ['adumbledor', 'hpotter'],
  owners: [],
  description: 'foo',
  label: 'foo',
  tags: ['foo'],
});
const mockConsortium = new Consortium(validOpts());

test('model::consortium - hasMember', (t) => {
  t.plan(2);
  t.ok(
    mockConsortium.hasMember('hpotter'),
    'Finds existing members'
  );
  t.notOk(
    mockConsortium.hasMember('foobar'),
    'Non-existant memeber'
  );
});

test('model::consortium - isOwnedBy', (t) => {
  // Create a model without an owner property
  const ownerlessModel = new Consortium(validOpts());

  // Create a model with an owners property
  const ownersOps = _.assign(validOpts(), {
    owners: ['adumbledor'],
  });
  const ownersModel = new Consortium(ownersOps);

  t.notOk(ownerlessModel.isOwnedBy('foobar'), 'returns false if no owner');
  t.ok(ownersModel.isOwnedBy('adumbledor'), 'returns true if is an owner');
  t.notOk(ownersModel.isOwnedBy('foobar'), 'returns false if is not an owner');
  t.end();
});

test('Consortium.compareUsernames', (t) => {
  t.plan(3);
  t.ok(Consortium.compareUsernames('foo', 'foo'), 'matching usernames');
  t.ok(Consortium.compareUsernames(' Foo', 'foo'), 'whitespace/case diff');
  t.notOk(Consortium.compareUsernames('bar', 'foo'), 'different usernames');
});
