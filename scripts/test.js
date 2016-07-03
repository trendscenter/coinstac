'use strict';

/**
 * Test.
 *
 * Run all COINSTAC packages' tests in parallel. Exit if one fails.
 */
const async = require('async');
const exec = require('shelljs').exec;
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const zip = require('lodash/zip');

async.waterfall([
  cb1 => glob('./packages/*/package.json', cb1),
  (packageFiles, cb2) => {
    async.parallel({
      files: async.constant(packageFiles),
      datas: cb2b => async.map(packageFiles, fs.readFile, cb2b),
    }, cb2);
  },
  (packageObjs, cb3) => {
    async.reduce(
      zip(packageObjs.files, packageObjs.datas),
      [],
      (memo, [file, data], cb3a) => {
        try {
          const packageContent = JSON.parse(data.toString());

          if ('scripts' in packageContent && 'test' in packageContent.scripts) {
            cb3a(null, memo.concat({
              file,
              name: packageContent.name,
              testCommand: packageContent.scripts.test,
            }));
          } else {
            cb3a(null, memo);
          }
        } catch (error) {
          cb3a(error);
        }
      },
      cb3
    );
  },
  (packageObjs, cb4) => {
    // Pool child processes
    const children = [];

    function getDoExec(packageObj) {
      /* eslint-disable no-console */
      console.log(`Running ${packageObj.name} tests…`);
      /* eslint-enable no-console */

      return function doExec(callback) {
        const child = exec(
          'npm test',
          {
            async: true,
            cwd: path.dirname(packageObj.file),
            silent: true,
          },
          (exitCode, stdout, stderr) => {
            if (exitCode || stderr) {
              callback(
                `✗ ${packageObj.name} exited with code "${exitCode}":\n
${packageObj.testCommand}

${stderr.toString()}`
              );

              // Kill all the children when one errors
              children.forEach(c => c.kill());
            } else {
              callback(null, `✓ ${packageObj.name}`);
            }
          }
        );

        children.push(child);
      };
    }

    async.parallel(packageObjs.map(getDoExec), cb4);
  },
], (error, results) => {
  /* eslint-disable no-console */
  if (error) {
    console.error(error);
  } else {
    console.log(Array.isArray(results) ? results.join('\n') : results);
  }
  /* eslint-enable no-console */
});
