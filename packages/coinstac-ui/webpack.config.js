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
      test: /\.json$/,
      use: ['json-loader'],
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
    publicPath: './build/',
  },
  plugins: [new webpack.optimize.OccurrenceOrderPlugin()],
  resolve: {
    extensions: ['.json', '.js', '.jsx'],
  },
};

if (process.env.NODE_ENV === 'development') {
  config.bail = false;
  // config.plugins.push(new webpack.NoErrorsPlugin());

  config.devServer = {
    inline: true,
  };

  // Massage configuration for hot module replacement:
  config.output.publicPath = `http://localhost:${port}/`;
  config.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin()
  );

  config.entry.unshift(
    `${require.resolve('webpack-dev-server/client')}?http://localhost:${port}`,
    require.resolve('webpack/hot/dev-server')
  );

  /**
   * Remove react and redux from externals to make HMR easier.
   * {@link https://github.com/gaearon/react-hot-loader/tree/master/docs#usage-with-external-react}
   */
  const pattern = /react|redux/;
  config.externals = config.externals.filter(name => !pattern.test(name));
} else {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({ sourceMap: false })
  );
}

module.exports = config;
