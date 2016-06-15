'use strict';
var _ = require('lodash');
var joi = require('joi');
var Base = require('../../').models.Base;
var util = require('util');
var test = require('tape');
var now = require('performance-now');

// define SimpleModel, pure JS class, no validation
function SimpleModel(attrs) {
  _.assign(this, attrs);
}

// define HeavyModel
function HeavyModel() {
  Base.apply(this, arguments);
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
  HeavyModel.apply(this, arguments);
}

util.inherits(HeavyModelNoValidation, HeavyModel);
HeavyModelNoValidation.prototype.validate = attrs => attrs;
HeavyModelNoValidation.prototype.validateOnSet = function () {};

var factory = function (opts) {
  return new HeavyModel(opts);
};

var validOps = function () {
  return {
    string: 'abcdefghijklmnop',
    stringData: '2016-02-05T16:49:50-07:00',
    number: 10,
    object: { someRandomData: 'rando-calrisian' },
  };
};

test('perf - reality check', function (t) {
  var begin = now();
  var end = now();
  var noTimeDiff = parseFloat((end - begin).toFixed(2), 10);
  t.ok(
      noTimeDiff > 0 && noTimeDiff < 1,
      'no time diff takes more than 0 ms and less than 1ms'
    );
  t.end();
});

test('perf - pojo model time diff', function (t) {
  var pojoTime;
  var simpleModelTime;
  var heavyModelTime;
  var heavyModelNoValidationTime;
  var model;
  const modelGenCount = 2000;

    // pojo time
  var begin = now();
  for (var i = 0; i < _.times(modelGenCount).length; i++) {
    model = validOps();
  }

  var end = now();

  pojoTime = parseFloat((end - begin).toFixed(2), 10);

    // simple model time
  begin = now();
  for (var i = 0; i < _.times(modelGenCount).length; i++) {
    model = new SimpleModel(validOps());
  }

  end = now();

  simpleModelTime = parseFloat((end - begin).toFixed(2), 10);

    // heavy model time
  begin = now();
  for (var i = 0; i < _.times(modelGenCount).length; i++) {
    model = new HeavyModel(validOps());
  }

  end = now();

  heavyModelTime = parseFloat((end - begin).toFixed(2), 10);

    // heavy model no validation time
  begin = now();
  for (var i = 0; i < _.times(modelGenCount).length; i++) {
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
