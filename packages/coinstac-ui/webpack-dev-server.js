'use strict';

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  contentBase: './app/',
  colors: true,
}).listen(config.WPDS_PORT, 'localhost', err => {
  /* eslint-disable no-console */
  if (err) { console.log(err); }
  console.log(`Listening at localhost: ${config.WPDS_PORT}`);
  /* eslint-enable no-console */
});
