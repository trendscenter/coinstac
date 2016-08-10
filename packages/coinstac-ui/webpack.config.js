'use strict';

const path = require('path');
const pkg = require('./package.json');
const webpack = require('webpack');

const port = 3000;

const config = {
  bail: true,
  devtool: 'eval',
  entry: [
    path.join(__dirname, 'app', 'render', 'index.js'),
  ],
  /**
   * Don't bundle anything in node_modules. Electron's `require` will work.
   * {@link https://webpack.github.io/docs/configuration.html#externals}
   */
  externals: Object.keys(pkg.dependencies).concat(
    Object.keys(pkg.devDependencies)
  ),
  module: {
    loaders: [{
      loaders: ['style', 'css'],
      test: /\.css$/,
    }, {
      loaders: ['file'],
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
    }, {
      loaders: ['json'],
      test: /\.json$/,
    }, {
      include: path.join(__dirname, 'app', 'render'),
      loaders: ['react-hot', 'babel'],
      test: /\.js$/,
    }, {
      loaders: ['style', 'css', 'sass?sourceMap'],
      test: /\.scss$/,
    }, {
      loaders: ['url?limit=10000&minetype=image/svg+xml'],
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
    }, {
      loaders: ['url?limit=10000&minetype=application/octet-stream'],
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
    }, {
      loaders: ['url?limit=10000&minetype=application/font-woff'],
      test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
    }, {
      loaders: ['url?limit=10000&minetype=application/font-woff'],
      test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
    }, {
      loaders: ['html', 'markdown'],
      test: /\.md$/,
    }, {
      loaders: ['file'],
      test: /\.png/,
    }],
  },
  output: {
    filename: 'bundle.js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'app', 'render', 'build'),
    publicPath: './build/',
  },
  plugins: [new webpack.optimize.OccurrenceOrderPlugin()],

  // `port` isn't part of Webpack's config. It's used by webpack-dev-server.
  port,
  target: 'electron',
};

if (process.env.NODE_ENV === 'development') {
  config.bail = false;
  // config.plugins.push(new webpack.NoErrorsPlugin());

  // Massage configuration for hot module replacement:
  config.output.publicPath = `http://localhost:${port}/`;
  config.plugins.push(new webpack.HotModuleReplacementPlugin());


  config.entry.unshift(
    `webpack-dev-server/client?http://localhost:${port}`,
    'webpack/hot/only-dev-server'
  );

  /**
   * @todo Determine why webpack-hot-middleware needs the `path` configuration.
   * {@link https://github.com/gaearon/react-transform-boilerplate/issues/47#issuecomment-151909080}
   */
  // config.entry.unshift(
  //   `webpack-hot-middleware/client?path=${config.output.publicPath}__webpack_hmr`
  // );

  // Remove react and redux from externals. This is necessary for hot reloading?
  // const pattern = /react|redux/;
  config.externals = {}; // config.externals.filter(name => !pattern.test(name));
  console.log(config.entry);
} else {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({ sourceMap: false })
  );
}

module.exports = config;
