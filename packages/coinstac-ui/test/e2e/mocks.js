const path = require('path');
const testFile = path.join(__dirname, 'test_files/site1/site1_Covariate.csv');

module.exports = (dialog) => {
  dialog.showOpenDialog = () => {
    return [testFile];
  };
};
