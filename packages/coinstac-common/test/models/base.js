'use strict';

const Base = require('../../').models.Base;
const test = require('tape');

test('model::base - constructor', function (t) {
  let bm = new Base();
  t.ok(bm, 'constructs with valid input');
  let dummyAttrs = { dummy: true, arr: [1, 2, 3] };
  bm = new Base(dummyAttrs);
  t.ok(bm, 'constructs with `any` input (base schema empty)');
  t.deepEquals({}, bm.serialize(), 'base serialize ok (only schema attrs copied)');
  t.end();
});
