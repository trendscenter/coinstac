'use strict';

const getStdin = require('get-stdin');

getStdin().then((str) => {
  console.log(str); // eslint-disable-line no-console
  console.error(str); // eslint-disable-line no-console
});
