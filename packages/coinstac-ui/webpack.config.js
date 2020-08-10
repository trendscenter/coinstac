'use strict';

const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const pkg = require('./package.json');

const port = 3000;

const env = dotenv.config({ path: '../../.env', safe: true }).parsed;

const config = {
  bail: true,
  devServer: {
    historyApiFallback: true,
    hot: true,
    port,
  },
  entry: {
    app: ['babel-polyfill', path.join(__dirname, 'app', 'render', 'index.js')],
  },

  /**
   * Don't bundle anything in node_modules and ensure Webpack doesn't resolve
   * Electron's internals.
   * {@link https://webpack.github.io/docs/configuration.html#externals}
   */
  externals: Object.keys(pkg.dependencies).concat(
    Object.keys(pkg.devDependencies),
    'electron',
    'fs',
    'path'
  ),
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    }, {
      test: /\.eot(\?v: \d+\.\d+\.\d+)?$/,
      use: ['file-loader'],
    }, {
      include: path.join(__dirname, 'app', 'render'),
      test: /\.(js|jsx)$/,
      use: [{
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
      }],
    }, {
      test: /\.scss$/,
      use: [{
        loader: 'style-loader',
      }, {
        loader: 'css-loader',
      }, {
        loader: 'sass-loader',
        options: {
          sourceMap: true,
        },
      }],
    }, {
      test: /\.svg(\?v: \d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10000,
          minetype: 'image/svg+xml',
        },
      }],
    }, {
      test: /\.ttf(\?v: \d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10000,
          minetype: 'application/octet-stream',
        },
      }],
    }, {
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff',
        },
      }],
      test: /\.woff(\?v: \d+\.\d+\.\d+)?$/,
    }, {
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff',
        },
      }],
      test: /\.woff2(\?v: \d+\.\d+\.\d+)?$/,
    }, {
      use: ['file-loader'],
      test: /\.png/,
    }],
  },
  node: {
    __dirname: false,
  },
  output: {
    filename: 'bundle.js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'build', 'render'),
    // relative to entry path
    publicPath: '../../build/render/',
  },
  plugins: [
    new webpack.EnvironmentPlugin(env),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],
  resolve: {
    extensions: ['.json', '.js', '.jsx'],
  },
};

if (process.env.NODE_ENV === 'development') {
  config.bail = false;
  config.devtool = 'eval-source-map';
  // config.plugins.push(new webpack.NoErrorsPlugin());

  // Massage configuration for hot module replacement:
  config.output.publicPath = `http://localhost:${port}/`;
  config.plugins.push(
    new webpack.EnvironmentPlugin(env),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin()
  );

  /**
   * Remove react and redux from externals to make HMR easier.
   * {@link https://github.com/gaearon/react-hot-loader/tree/master/docs#usage-with-external-react}
   */
  const pattern = /redux/;
  config.externals = config.externals.filter(name => !pattern.test(name));
}

module.exports = config;
