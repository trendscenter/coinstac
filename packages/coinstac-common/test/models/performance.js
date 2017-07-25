'use strict';

const _ = require('lodash');
const joi = require('joi');
const Base = require('../../').models.Base;
const test = require('tape');
const now = require('performance-now');

// define SimpleModel, pure JS class, no validation
function SimpleModel(attrs) {
  _.assign(this, attrs);
}

// define HeavyModel
class HeavyModel extends Base {}

HeavyModel.schema = Object.assign({}, Base.schema, {
  string: joi.string().min(10).required(),
  stringData: joi.string().isoDate().required(),
  number: joi.number().min(5).max(15)
    .required(),
  object: joi.object().required(),
});

// define HeavyModelNoValidation
class HeavyModelNoValidation extends HeavyModel {}

HeavyModelNoValidation.prototype.validate = attrs => attrs;
HeavyModelNoValidation.prototype.validateOnSet = _.noop;

function validOps() {
  return {
    string: 'abcdefghijklmnop',
    stringData: '2016-02-05T16:49:50-07:00',
    number: 10,
    object: { someRandomData: 'rando-calrisian' },
  };
}

test('perf - reality check', (t) => {
  const begin = now();
  const end = now();
  const noTimeDiff = parseFloat((end - begin).toFixed(2), 10);
  t.ok(
      noTimeDiff > 0 && noTimeDiff < 1,
      'no time diff takes more than 0 ms and less than 1ms'
    );
  t.end();
});

test('perf - pojo model time diff', (t) => {
  /* eslint-disable no-unused-vars,no-redeclare,prefer-const */
  let pojoTime;
  let simpleModelTime;
  let heavyModelTime;
  let heavyModelNoValidationTime;
  let model;
  const modelGenCount = 2000;

    // pojo time
  let begin = now();
  for (let i = 0; i < _.times(modelGenCount).length; i += 1) {
    model = validOps();
  }

  let end = now();

  pojoTime = parseFloat((end - begin).toFixed(2), 10);

    // simple model time
  begin = now();
  for (let i = 0; i < _.times(modelGenCount).length; i += 1) {
    model = new SimpleModel(validOps());
  }

  end = now();

  simpleModelTime = parseFloat((end - begin).toFixed(2), 10);

    // heavy model time
  begin = now();
  for (let i = 0; i < _.times(modelGenCount).length; i += 1) {
    model = new HeavyModel(validOps());
  }

  end = now();

  heavyModelTime = parseFloat((end - begin).toFixed(2), 10);

    // heavy model no validation time
  begin = now();
  for (let i = 0; i < _.times(modelGenCount).length; i += 1) {
    model = new HeavyModelNoValidation(validOps());
  }

  end = now();

  heavyModelNoValidationTime = parseFloat((end - begin).toFixed(2), 10);

    // console.log(`Generated ${modelGenCount} models.  Results in ms:`);
    // console.log('pojo model', pojoTime);
    // console.log('basic no validation js class model', simpleModelTime);
    // console.log('heavy model with validation', heavyModelTime);
    // console.log('heavy model, no validation', heavyModelNoValidationTime);

  t.ok(heavyModelTime / modelGenCount < 5, 'heavy models generated in < 5ms');
  t.end();
  /* eslint-enable no-unused-vars,no-redeclare,prefer-const */
});
