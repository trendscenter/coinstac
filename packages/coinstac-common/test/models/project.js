'use strict';
var _ = require('lodash');
var path = require('path');
var File = require(path.join(process.cwd(), 'src/models/file.js'));
var test = require('tape');

test('model::project', function (t) {
  var f1 = new File({
    filename: 'free-surfer-dummy-1.txt',
    sha: 'abcef0123456789',
    tags: {},
    modified: 1,
    size: 1,
  });
  var f1s = f1.serialize();
  t.skip('test projects');
  t.end();
});
