
const WPDS_PORT = 3000;

const path = require('path');
const webpack = require('webpack');
const isDev = process.env.NODE_ENV === 'development';

const pkg = require('./package.json');

/**
 * Get files that webpack will ignore from bundling, and expect to be available in the env
 * @return {object} { packageName: 'commonjs packageName' } formatted entries
 */
const getExternals = () => {
  const internals = [/react/]; // assert that all of these entries remain in webpack bundle
  const externals = [];
  const externalsHash = {
    electron: 'commonjs electron',
    fs: 'commonjs fs',
    ipc: 'commonjs ipc',
    path: 'commonjs path',
    convict: 'commonjs convict',
    os: 'commonjs os',
  };

  // add all packages to externals that aren't otherwise explicity internal
  Object.keys(pkg.dependencies).forEach((packageName) => {
    const isInternal = internals.some((internal) => packageName.match(internal));
    if (isInternal) { return; }
    externalsHash[packageName] = `commonjs ${packageName}`;
  });


  externals.push(externalsHash);
  [
    /common\/boot/,
    /app\/main\/.*js/,
    // /app\/render\/*.js/, // @note, we _must_ bundle render files! jsx/es6 for days!
  ].forEach(rgx => {
    externals.push((context, request, callback) => {
      if (rgx.test(request)) {
        return callback(null, `require('${request}')`);
      }
      callback();
    });
  });
  return externals;
};

module.exports = {
  WPDS_PORT: 3000,
  bail: !isDev,
  context: `${__dirname}/app`,
  devtool: 'eval',
  entry: [
    './render/index.js',
  ].concat(isDev ? [
    `webpack-dev-server/client?http://localhost:${WPDS_PORT}`,
    'webpack/hot/only-dev-server',
  ] : []),
  output: {
    path: isDev ? __dirname : `${__dirname}/app/render/build`,
    filename: 'bundle.js',
    publicPath: isDev ? 'http://localhost:3000/' : `${__dirname}/app/render/build/`,
  },
  externals: getExternals(),
  plugins: [
    new webpack.NoErrorsPlugin(),
  ].concat(isDev ? [
    new webpack.HotModuleReplacementPlugin(),
  ] : [
    new webpack.optimize.UglifyJsPlugin({ sourceMap: false }),
  ]),
  resolve: {
    modulesDirectories: [
      'node_modules',
      __dirname,
    ],
    extensions: ['', '.js', '.jsx'],
    alias: { },
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file' },
      { test: /\.json$/, loader: 'json' },
      { test: /\.jsx?$/, loaders: ['react-hot', 'babel'], include: path.join(__dirname, 'app/') },
      { test: /\.scss$/, loader: 'style!css!sass?sourceMap' },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=image/svg+xml' },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/octet-stream',
      },
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/font-woff',
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/font-woff',
      },
      { test: /\.md$/, loader: 'html!markdown' },
      {
        test: /\.png/,
        loader: 'file-loader',
      },
    ],
  },
};
