'use strict';

const _ = require('lodash');
const path = require('path');
const File = require(path.join(process.cwd(), 'src/models/file.js'));
const test = require('tape');

const factory = function (opts) {
  return function () {
    return new File(opts);
  };
};

const validOps = function () {
  return {
    filename: '/test/dir',
    sha: 'testSha0123456789',
    modified: 12347892,
    size: 2,
    tags: {},
  };
};

test('model::file - general', function (t) {
  t.skip('file complexity removed. leaving as placeholder');
  t.end();
});
