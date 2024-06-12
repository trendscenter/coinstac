import { isFunction, isObject, keys as getKeys } from 'lodash';

function cleanRemoteResponse(fn) {
  // wrap fn with fn that will de-ref the remote obj and return
  // a pure representation of the results
  function cstacRenderRemoteCall(...args) {
    const lastNdx = args.length - 1;
    // detect if callback passed, wrap cb with version that
    // simplifies and de-refs the result (e.g. no memory leak)
    if (args.length && isFunction(args[lastNdx])) {
      const cb = args[lastNdx];
      const pojocb = (err, rslt) => {
        if (rslt && isObject(rslt)) {
          return cb(err, JSON.parse(JSON.stringify(rslt)));
        }

        return cb(err, rslt);
      };
      // eslint-disable-next-line no-param-reassign
      args[lastNdx] = pojocb;
    }
    return fn.apply(this, args);
  }
  cstacRenderRemoteCall.isPlanified = true;
  return cstacRenderRemoteCall;
}

function pojoify(api, keys = [], root) {
  const pojoAPI = {};
  const localRoot = root || api;
  let currKeyPath;
  let value;

  getKeys(api).forEach((key) => {
    value = api[key];
    currKeyPath = keys.concat([key]);
    if (isFunction(value) && !value.isPlanified) {
      pojoAPI[key] = cleanRemoteResponse(value, currKeyPath, localRoot);
    } else if (isObject(value) && !Array.isArray(value)) {
      pojoAPI[key] = pojoify(value, currKeyPath, localRoot);
    } else {
      pojoAPI[key] = value;
    }
  });

  return pojoAPI;
}

module.exports = pojoify;
