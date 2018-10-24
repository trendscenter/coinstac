'use strict';

const getStdin = require('get-stdin');

getStdin().then((str) => {
  process.stdout.write(str);
  process.stderr.write(str);
});
