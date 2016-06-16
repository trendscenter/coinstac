'use strict';

const passed = {};
process.argv.forEach((arg, ndx) => {
    // e.g. -run { "filenames": [ ... ] }
  if (arg.indexOf('--') === 0) {
    const value = JSON.parse(process.argv[ndx + 1]);
    // console.error(JSON.stringify(value));
    console.log(JSON.stringify(value)); // eslint-disable-line
    process.exit(0);
  }
});
process.exit(1);
