'use-strict';

const glob = require('glob');
const loadCSV = require('csv-load-sync');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

/**
 * syncronously loads and parses files from a globbing pattern, and concats the data
 * into an array
 * @param  {string} fileGlob glob pattern for input files
 * @param  {string} delim    delimiter used for txt files, defualts to ','
 * @return {array}          array of parsed input data
 */
const loadFiles = (fileGlob, delim) => {
  const delimiter = delim || ',';
  const files = glob.sync(fileGlob);
  let userData = [];
  files.forEach((filePath) => {
    if (fs.lstatSync(filePath).isFile()) {
      const data = fs.readFileSync(filePath, 'utf8');
      const ext = path.extname(filePath);
      if (ext === '.json') {
        // expects JSON array
        userData = userData.concat(JSON.parse(data));
      } else if (delimiter.match(/\n|\r/g)) {
        userData = userData.concat(data.replace(/\n$|\r$/, '').split(delimiter));
      } else {
        userData = userData.concat(data.replace(/\n|\r/g, '').split(delimiter));
      }
    }
  });
  return userData;
};
/**
 * Takes a input directory glob and/or a csv and returns an array of users
 * constructed from its structure. The glob data files may be delimited text files
 * or json arrays, an optional delimiter can be passed in for text files.
 *
 * The file structure should be as follows:
 ************
 * Glob:
 ************
 * path/to/Data Dir/
 * ├── some-user1
 * │   └── x
 * │   │   ├── some-data.txt
 * │   │   └── some-data.txt
 * │   └── y
 * │       ├── some-data.txt
 * │       └── some-data.txt
 * └── some-user2
 *    └── x
 *    │   ├── some-data.txt
 *    │   └── some-data.txt
 *    └── y
 *        ├── some-data.txt
 *        └── some-data.txt
 ************
 * CSV:
 ************
 * user,t,u,v
 * some-user1,1,2,2
 * some-user2,4,5,6
 *
 * @param  {string} [dirGlob]      the glob path to the input data
 *                                ie: './path/to/My Data/ * * / * /.txt' (without asterisk spaces)
 * @param  {string} [csv]         path to variable csv to load
 * @param  {string} [delimiter]   optional delimiter to use with glob files
 * @return {array}                array of userData objects
 */
const createUserData = (dirGlob, csv, delimiter) => {
  const userData = {};
  if (dirGlob) {
    const baseDir = dirGlob.match(/(?:(?!\*\*).)*/);
    const fileList = glob.sync(dirGlob);
    fileList.forEach((file) => {
      const pathInfo = file.replace(baseDir, '').split('/');
      // assumes the first glob dir is the users
      // and second is the variable
      if (!userData[pathInfo[0]]) {
        userData[pathInfo[0]] = { [pathInfo[1]]: [] };
      } else if (!userData[pathInfo[0]][pathInfo[1]]) {
        userData[pathInfo[0]][pathInfo[1]] = [];
      }
      userData[pathInfo[0]][pathInfo[1]] = userData[pathInfo[0]][pathInfo[1]]
        .concat(loadFiles(file, delimiter));
    });
  }
  if (csv) {
    const parsedCSV = loadCSV(csv);
    if (dirGlob && parsedCSV.length !== Object.keys(userData).length) {
      throw new Error('CSV user number does not match directory user number');
    }
    parsedCSV.forEach((csvUser) => {
      userData[csvUser.user] = _.merge(userData[csvUser.user], _.omit(csvUser, 'user'));
    });
  }
  // convert our object to an array
  return Object.keys(userData).map((key) => { return userData[key]; });
};

module.exports = {
  createUserData,
  loadFiles,
  loadFile: loadFiles,
};
