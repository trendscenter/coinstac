'use strict';

const Dashboard = require('webpack-dashboard');
const DashboardPlugin = require('webpack-dashboard/plugin');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const config = require('./webpack.config');
const dashboard = new Dashboard();
const port = config.port;

config.plugins.push(new DashboardPlugin(dashboard.setData));

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  quiet: true,
}).listen(port, 'localhost', err => {
  /* eslint-disable no-console */
  if (err) {
    console.log(err);
  } else {
    console.log(`Listening at port ${port}`);
  }
  /* eslint-enable no-console */
});
