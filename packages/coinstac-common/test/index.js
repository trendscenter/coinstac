'use strict';

require('./helpers/boot');
const path = require('path');
const glob = require('glob');

const handleFilesToTest = function (err, files) {
  if (err) throw err;
  files = files.filter(function (f) {
    // filter files!
    const indexMatch = f.match(/test\/index.js/);
    const utilMatch = f.match(/utils\/index.js/);
    const mockMatch = f.match(/mocks/);
    return (!indexMatch && !mockMatch && !utilMatch);
  });
  files.forEach(function requireSubTests(f) { require(path.resolve('./', f)); });
};

glob(__dirname + '/*.js', handleFilesToTest);
glob(__dirname + '/**/index.js', handleFilesToTest);
