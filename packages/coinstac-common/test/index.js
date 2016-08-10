'use strict';

require('./helpers/boot');
const path = require('path');
const glob = require('glob');

function handleFilesToTest(err, files) {
  if (err) throw err;
  files = files.filter(f => {
    // filter files!
    const indexMatch = f.match(/test\/index.js/);
    const utilMatch = f.match(/utils\/index.js/);
    const mockMatch = f.match(/mocks/);
    return (!indexMatch && !mockMatch && !utilMatch);
  });
  files.forEach(f => {
    require(path.resolve('./', f)); // eslint-disable-line global-require
  });
}

glob(`${__dirname}/*.js`, handleFilesToTest);
glob(`${__dirname}/**/index.js`, handleFilesToTest);
