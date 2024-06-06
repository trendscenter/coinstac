'use strict';

/* eslint-disable global-require, import/no-extraneous-dependencies */

// Conditionally load development services if run from CLI
if (
  process.defaultApp
  && process.env.NODE_ENV !== 'production'
  && process.env.NODE_ENV !== 'test'
) {
  // active long stack trace
  const chain = require('stack-chain');
  const { sep } = require('path');

  // There is no limit for the size of the stack trace (v8 default is 10)
  Error.stackTraceLimit = 100;

  chain.filter.attach((error, frames) => frames.filter((callSite) => {
    const name = callSite && callSite.getFileName();
    const include = !(
      !name
      || name.indexOf(sep) === -1
      || name.match(/internal\//)
      || name.match(/tick/)
      || name.match(/electron-preb/)
    );
    return include;
  }));

  /**
  * Load electron-debug, which loads devtron automatically.
  *
  * {@link https://github.com/sindresorhus/electron-debug#usage}
  * {@link https://github.com/electron/devtron}
  */
  require('electron-debug')({ showDevTools: true, devToolsMode: 'previous' });
}
