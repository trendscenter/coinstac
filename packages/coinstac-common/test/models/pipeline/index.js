'use strict';

const path = require('path');
const glob = require('glob');
const files = glob.sync(path.join(__dirname, '/*.js')).filter(function (f) {
    // filter this file!
  return !f.match(/index.js/);
});

files.forEach(function requireTest(file) {
  const fullPath = path.resolve('./', file);
  require(fullPath);
});
