'use strict';
var appOpts;

var parse = function() {
  if (process.defaultApp) {
    const opts = require('commander')
    .option('-dev, --development', 'run in development mode (NODE_ENV === "development")')
    .option('-w, --webpack', 'boot webpack dev server as child process')
    .option('--hotswap', 'enable hotswapping of node modules for main process')
    .option('--log-level [level]', 'set log level (silly/verbose/info/warn/error)')
    .parse(process.argv);
    appOpts = opts;

    if (opts.development) {
      process.env.NODE_ENV = 'development';
      console.log('NODE_ENV set to "development"');
    }

    if (opts.webpack) {
      var spawn = require('child_process').spawn;
      console.log('booting webpack-dev-server');
      var wpds = spawn('node', ['webpack-dev-server.js', '--development']);
      wpds.stdout.on('data', function(data) {
        data = data.toString();
        // don't fill the screen with useful build information. scan for it,
        // summarize it instead
        var builtRegex = /.*(\[(built|not cacheable)\]|\{0\}).*[\r\n]/gm;
        var builtFiles = data.match(builtRegex);
        data = data.replace(builtRegex, '');
        console.log([
          'coinstac-wpds:',
          builtFiles ? '(' + builtFiles.length + ' files processed)' : '',
          data,
        ].join(' '));
      });

      wpds.stderr.on('data', function(data) {
        console.error('coinstac-webpack-server [error]: ' + data);
      });

      wpds.on('close', function(code) {
        if (code !== 0) {
          console.log('coinstac-webpack-server [fatal] ' + code);
        }
      });

      process.on('exit', wpds.kill);
    }
  }
};

parse.get = function() {
  return appOpts || {};
};

module.exports = parse;
