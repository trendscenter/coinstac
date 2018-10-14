const fs = require('fs');

/**
 * test if the remote compute says the DecentralizedComputation is completed
 */
const exitIfComplete = (passed) => {
  const hasRemoteData = passed.remoteResult.data !== undefined;
  const isComplete = hasRemoteData ? passed.remoteResult.data.complete : false;
  if (isComplete) {
    console.error('complete--no activity required'); // eslint-disable-line
    process.exit(0);
  }
};

/**
 * doFilewiseComputation
 */
const doFilewiseComputation = (filename) => {
  // read and "process" passed files
  // in our demo, we read a JSON file, dummy-data.json
  const firstFile = fs.readFileSync(filename);
  const firstFileData = JSON.parse(firstFile);

  // stdout reports the computation result to the pipeline
  // @note - you may use stderr to LOG content for debugging
  process.stderr.write(`I read and parsed a file.  It's value is: ${firstFileData.value}`); // eslint-disable-line
  console.log(JSON.stringify(firstFileData)); // eslint-disable-line
};

// extract passed data from passed args
// we recommend using a formal argument parser!
process.argv.forEach((arg, ndx) => {
  // e.g. -run { "filenames": [ ... ] }
  if (arg.indexOf('--') === 0) {
    const passed = JSON.parse(process.argv[ndx + 1]);
    if (passed.previousData) { return process.exit(0); }
    exitIfComplete(passed);
    doFilewiseComputation(passed.userData.filenames[0]);
    process.exit(0);
  }
});
console.error('failed to parse!'); // eslint-disable-line
process.exit(1);
