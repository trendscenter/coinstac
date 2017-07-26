'use strict';

const DashboardPlugin = require('webpack-dashboard/plugin');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const url = require('url');
const config = require('./webpack.config');

const compiler = webpack(config);
const port = url.parse(config.output.publicPath).port;

compiler.apply(new DashboardPlugin({
  port: 3001,
}));

new WebpackDevServer(compiler, {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
}).listen(port, 'localhost', (err) => {
  /* eslint-disable no-console */
  if (err) {
    console.log(err);
  } else {
    console.log(`Listening at port ${port}`);
  }
  /* eslint-enable no-console */
});
