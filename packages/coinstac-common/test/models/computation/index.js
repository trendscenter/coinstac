'use strict';
var path = require('path');
var glob = require('glob');
var files = glob.sync(path.join(__dirname, '/*.js')).filter(function (f) {
    // filter this file!
  return !f.match(/index.js/) && !f.match(/test-/);
});

files.forEach(function requireTest(file) {
  var fullPath = path.resolve('./', file);
  require(fullPath);
});
