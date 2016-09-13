'use strict';

const output = {
  complete: false,
  process: null,
};

if (process.argv[2] === '--remote') {
  output.complete = true;
  output.process = 'remote';
} else {
  output.process = 'local';
}

console.log(JSON.stringify(output)); // eslint-disable-line no-console

