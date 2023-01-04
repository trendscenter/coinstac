'use strict';

const { spawn } = require('child_process');
const program = require('commander');

let appOpts;

/* eslint-disable no-console */
function parse() {
  if (process.defaultApp) {
    const opts = program
      .allowUnknownOption()
      .option('-dev, --development', 'run in development mode (NODE_ENV === "development")')
      .option('-w, --webpack', 'boot webpack dev server as child process')
      .option('--log-level [level]', 'set log level (silly/verbose/info/warn/error)')
      .parse(process.argv);
    appOpts = opts;

    if (opts.development) {
      process.env.NODE_ENV = 'development';
      console.log('NODE_ENV set to "development"');
    }

    if (opts.webpack) {
      console.log('booting webpack-dev-server');
      const wpds = spawn('node', ['webpack-dev-server.js', '--development']);
      wpds.stdout.on('data', (data) => {
        data = data.toString();
        // don't fill the screen with useful build information. scan for it,
        // summarize it instead
        const builtRegex = /.*(\[(built|not cacheable)]|\{0\}).*[\r\n]/gm;
        const builtFiles = data.match(builtRegex);
        data = data.replace(builtRegex, '');
        console.log([
          'coinstac-wpds:',
          builtFiles ? `(${builtFiles.length} files processed` : '',
          data,
        ].join(' '));
      });

      wpds.stderr.on('data', (data) => {
        console.error(`coinstac-webpack-server [error]: ${data}`);
      });

      wpds.on('close', (code) => {
        if (code !== 0) {
          console.log(`coinstac-webpack-server [fatal] ${code}`);
        }
      });

      process.on('exit', wpds.kill);
    }
  }
}
/* eslint-enable no-console */

parse.get = function get() {
  return appOpts || {};
};

module.exports = parse;
