'use strict';

const _ = require('lodash');
const cycle = require('cycle');
const fs = require('fs');
const path = require('path');

module.exports = {
  api: null, // cached built API

  build(opts) {
    opts = opts || {};
    if (opts.force) {
      delete this.api;
    }
    const allFileStats = [];

    const isJavascriptFile = (path) => {
      if (path.match(/js$/)) { return true; }
    };
    const notIgnored = (filepath) => {
      const IGNORE_API = [
            //    __filename
      ];
      return IGNORE_API.some(txt => filepath.match(txt));
    };
    const statToPath = stat => stat.path;
    const pathToAPIComponents = (filepath) => {
      return {
        fields: filepath.replace(__dirname, '').replace('.js', '').split(path.sep),
        filepath,
      };
    };
    const componentsToAPIInstance = (apiRoot, srvComponent) => {
      const serviceFieldPath = srvComponent.fields.map(_.camelCase).join('.');
      /* eslint-disable global-require, import/no-dynamic-require */
      _.set(apiRoot, serviceFieldPath, require(srvComponent.filepath));
      /* eslint-enable global-require, import/no-dynamic-require */
      return apiRoot;
    };

    return new Promise((res, rej) => {
      if (this.api) {
        return res(opts.decycled ? cycle.decycle(this.api) : this.api);
      }

      fs.walk(__dirname)
        .on('data', stat => allFileStats.push(stat))
        .on('end', () => {
          this.api = allFileStats
            .map(statToPath)
            .filter(isJavascriptFile)
            .filter(notIgnored)
            .map(pathToAPIComponents)
            .reduce(componentsToAPIInstance, {});
          return res(this.api);
        })
        .on('error', rej);

      setTimeout(
        () => {
          rej(new Error('timed out building API'));
        },
        4000
      );
    });
  },
};
