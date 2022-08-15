const path = require('path');

module.exports = (dialog) => {
  let count;
  switch (process.env.TEST_INSTANCE) {
    case 'test-1':
      count = 1;
      break;
    case 'test-2':
      count = 2;
      break;
    default:
      count = 1;
  }

  dialog.showOpenDialog = (window, opts, cb) => {
    const testFile = path.join(__dirname, `../../../../algorithm-development/test-data/freesurfer-test-data/site${count}/site${count}_Covariate.csv`);
    cb([testFile]);
  };
};
