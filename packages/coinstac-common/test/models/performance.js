'use strict';

const _ = require('lodash');
const joi = require('joi');
const Base = require('../../').models.Base;
const util = require('util');
const test = require('tape');
const now = require('performance-now');

// define SimpleModel, pure JS class, no validation
function SimpleModel(attrs) {
  _.assign(this, attrs);
}

// define HeavyModel
function HeavyModel() {
  Base.apply(this, arguments); // eslint-disable-line
}

HeavyModel.schema = Object.assign({}, Base.schema, {
  string: joi.string().min(10).required(),
  stringData: joi.string().isoDate().required(),
  number: joi.number().min(5).max(15).required(),
  object: joi.object().required(),
});
util.inherits(HeavyModel, Base);

// define HeavyModelNoValidation
function HeavyModelNoValidation(attrs) {
  HeavyModel.apply(this, arguments); // eslint-disable-line
}

util.inherits(HeavyModelNoValidation, HeavyModel);
HeavyModelNoValidation.prototype.validate = attrs => attrs;
HeavyModelNoValidation.prototype.validateOnSet = function () {};

const factory = function (opts) {
  return new HeavyModel(opts);
};

const validOps = function () {
  return {
    string: 'abcdefghijklmnop',
    stringData: '2016-02-05T16:49:50-07:00',
    number: 10,
    object: { someRandomData: 'rando-calrisian' },
  };
};

test('perf - reality check', function (t) {
  let begin = now();
  let end = now();
  let noTimeDiff = parseFloat((end - begin).toFixed(2), 10);
  t.ok(
      noTimeDiff > 0 && noTimeDiff < 1,
      'no time diff takes more than 0 ms and less than 1ms'
    );
  t.end();
});

test('perf - pojo model time diff', function (t) {
  let pojoTime;
  let simpleModelTime;
  let heavyModelTime;
  let heavyModelNoValidationTime;
  let model;
  const modelGenCount = 2000;

    // pojo time
  let begin = now();
  for (let i = 0; i < _.times(modelGenCount).length; i++) {
    model = validOps();
  }

  let end = now();

  pojoTime = parseFloat((end - begin).toFixed(2), 10);

    // simple model time
  begin = now();
  for (let i = 0; i < _.times(modelGenCount).length; i++) {
    model = new SimpleModel(validOps());
  }

  end = now();

  simpleModelTime = parseFloat((end - begin).toFixed(2), 10);

    // heavy model time
  begin = now();
  for (let i = 0; i < _.times(modelGenCount).length; i++) {
    model = new HeavyModel(validOps());
  }

  end = now();

  heavyModelTime = parseFloat((end - begin).toFixed(2), 10);

    // heavy model no validation time
  begin = now();
  for (let i = 0; i < _.times(modelGenCount).length; i++) {
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
});
