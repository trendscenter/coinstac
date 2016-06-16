'use strict';

const _ = require('lodash');
const path = require('path');
const File = require(path.join(process.cwd(), 'src/models/file.js'));
const test = require('tape');

test('model::project', function (t) {
  const f1 = new File({
    filename: 'free-surfer-dummy-1.txt',
    sha: 'abcef0123456789',
    tags: {},
    modified: 1,
    size: 1,
  });
  const f1s = f1.serialize();
  t.skip('test projects');
  t.end();
});
