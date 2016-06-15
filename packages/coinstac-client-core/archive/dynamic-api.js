module.exports = {
    api: null, // cached built API

    build: function(opts) {
        opts = opts || {};
        if (opts.force) {
            delete this.api;
        }
        var allFileStats = [];

        var isJavascriptFile = function(path) {
            if (path.match(/js$/)) { return true; }
        };
        var notIgnored = function(filepath) {
           var IGNORE_API = [
            //    __filename
           ];
           if (IGNORE_API.some(function(txt) { return filepath.match(txt); })) { return false; }
           return true;
        };
        var statToPath = function(stat) { return stat.path; };
        var pathToAPIComponents = function(filepath) {
            return {
                fields: filepath.replace(__dirname, '').replace('.js', '').split(path.sep),
                filepath: filepath
            };
        };
        var componentsToAPIInstance = function(apiRoot, srvComponent, ndx) {
            var serviceFieldPath = srvComponent.fields.map(_.camelCase).join('.');
            _.set(apiRoot, serviceFieldPath, require(srvComponent.filepath));
            return apiRoot;
        };

        return new Promise(function(res, rej) {
            if (this.api) {
                return res(opts.decycled ? require('cycle').decycle(this.api) : this.api);
            }

            fs.walk(__dirname)
            .on('data', function(stat) { allFileStats.push(stat); })
            .on('end', function constructAPI() {
                this.api = allFileStats
                .map(statToPath)
                .filter(isJavascriptFile)
                .filter(notIgnored)
                .map(pathToAPIComponents)
                .reduce(componentsToAPIInstance, {});
                return res(this.api);
            }.bind(this))
            .on('error', rej);

            setTimeout(
                function limitAPIBuildTime() { rej(new Error('timed out building API')); },
                4000
            );

        }.bind(this));
    },
};
