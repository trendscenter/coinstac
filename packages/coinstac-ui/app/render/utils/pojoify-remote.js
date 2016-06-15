var _ = require('lodash');

var cleanRemoteResponse = function(fn, keyPath, root) {
    // wrap fn with fn that will de-ref the remote obj and return
    // a pure representation of the results
    var cstacRenderRemoteCall = function() {
        var args = _.toArray(arguments);
        var lastNdx = args.length - 1;
        // detect if callback passed, wrap cb with version that
        // simplifies and de-refs the result (e.g. no memory leak)
        if (args.length && _.isFunction(args[lastNdx])) {
            var cb = args[lastNdx];
            var pojocb = function(err, rslt) {
                if (rslt) {
                    rslt = _.isObject(rslt) ? JSON.parse(JSON.stringify(rslt)) : rslt;
                }
                return cb(err, rslt);
            }
            args[lastNdx] = pojocb;
        } 
        return fn.apply(this, args);
    };
    cstacRenderRemoteCall.isPlanified = true;
    return cstacRenderRemoteCall;
};


var pojoify = function(api, keys, root) {
    keys = keys || [];
    var pojoAPI = {};
    var root = root || api;
    var currKeyPath;
    var value;
    _.forEach(_.keys(api), function wrapPojoFn(key) {
        value = api[key];
        currKeyPath = keys.concat([key]);
        if (_.isFunction(value) && !value.isPlanified) {
            pojoAPI[key] = cleanRemoteResponse(value, currKeyPath, root);
        } else if (_.isObject(value) && !_.isArray(value)) {
            pojoAPI[key] = pojoify(value, currKeyPath, root);
        } else {
            pojoAPI[key] = value;
        }
    });
    return pojoAPI;
};

module.exports = pojoify;
