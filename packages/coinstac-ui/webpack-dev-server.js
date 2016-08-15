'use strict';

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const config = require('./webpack.config');
const port = config.port;

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
}).listen(port, 'localhost', err => {
  /* eslint-disable no-console */
  if (err) {
    console.log(err);
  } else {
    console.log(`Listening at port ${port}`);
  }
  /* eslint-enable no-console */
});
