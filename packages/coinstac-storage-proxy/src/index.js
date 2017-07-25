'use strict';

const pkg = require('../package.json');
const joi = require('joi');
const Bouncer = require('./bouncer.js');

const optionSchema = joi.object().keys({
  targetBaseUrl: joi.string().uri({ scheme: /https?/ }).required(),
});

const rootPath = '/coinstacdb';
const rootPathRegExp = new RegExp('^/coinstacdb/?($|/_rev|/_local)');
const consortiaPath = `${rootPath}/consortia/{param*}`;
const computationsPath = `${rootPath}/computations/{param*}`;
const upPath = `${rootPath}/up/{param*}`;
const upPathRegExp = new RegExp(`^${rootPath}/up/local-consortium-`);
const downPath = `${rootPath}/down/{param*}`;
const downPathRegExp = new RegExp(`^${rootPath}/down/remote-consortium-`);

const registerRoutes = (server, options, next) => {
  const DEFAULT_BOUNCER_CONFIG = {
    targetBaseUrl: options.targetBaseUrl,
  };

  const bouncerFactory = (opts) => {
    const conf = Object.assign({}, DEFAULT_BOUNCER_CONFIG, opts);
    return new Bouncer(conf);
  };

  server.route(Bouncer.unauthorizedRoute);

  server.route({
    path: rootPath,
    method: 'get',
    config: {
      tags: ['coinstac'],
      auth: false,
    },
    handler: bouncerFactory({ allowEverybody: true, pathRegExp: rootPathRegExp }).handler,
  });

  // Consortia routes.
  server.route({
    config: {
      tags: ['coinstac'],
      auth: false,
    },
    path: consortiaPath,
    method: 'get',
    handler: bouncerFactory({ allowEverybody: true }).handler,
  });

  server.route({
    path: consortiaPath,
    method: 'put',
    handler: bouncerFactory({ allowEverybody: true }).handler,
  });

  server.route({
    path: consortiaPath,
    method: 'post',
    handler: bouncerFactory({
      consortiumOwnersOnly: true,
      exceptionRegExp: [/_revs_diff$/, /_bulk_docs$/],
    }).handler,
  });

  server.route({
    path: consortiaPath,
    method: 'delete',
    handler: bouncerFactory({ consortiumOwnersOnly: true }).handler,
  });

  // Computation routes.
  server.route({
    config: {
      tags: ['coinstac'],
      auth: false,
    },
    path: computationsPath,
    method: 'get',
    handler: bouncerFactory({ allowEverybody: true }).handler,
  });

  server.route({
    path: computationsPath,
    method: 'put',
    handler: bouncerFactory({ rejectEverybody: true }).handler,
  });

  server.route({
    path: computationsPath,
    method: 'post',
    handler: bouncerFactory({
      rejectEverybody: true,
      exceptionRegExp: [/_revs_diff$/, /_bulk_docs$/],
    }).handler,
  });

  server.route({
    path: computationsPath,
    method: 'delete',
    handler: bouncerFactory({ rejectEverybody: true }).handler,
  });

  // Consortium ComputationResult routes.
  server.route({
    path: upPath,
    method: 'get',
    handler: bouncerFactory(
      { rejectEverybody: true, pathRegExp: upPathRegExp }
    ).handler,
  });

  server.route({
    path: upPath,
    method: 'put',
    handler: bouncerFactory({
      consortiumMembersOnly: true,
      pathRegExp: upPathRegExp,
    }).handler,
  });

  server.route({
    path: upPath,
    method: 'post',
    handler: bouncerFactory({
      consortiumMembersOnly: true,
      pathRegExp: upPathRegExp,
    }).handler,
  });

  server.route({
    path: upPath,
    method: 'delete',
    handler: bouncerFactory({
      consortiumMembersOnly: true,
      pathRegExp: upPathRegExp,
    }).handler,
  });

  server.route({
    path: downPath,
    method: 'get',
    handler: bouncerFactory(
      // @TODO allowEverybody for computations
      // @TODO allow consortium members for remote results
      { allowEverybody: true }
    ).handler,
    config: {
      tags: ['coinstac'],
      auth: false,
    },
  });

  server.route({
    path: downPath,
    method: 'put',
    handler: bouncerFactory(
      // this allows users to create remote-consortium-abc databases.
      // this controversially allows users to trigger remote activity on the
      // down/ path. // this is done _primarily_ to keep network chatter down
      // in the expected event that local- users want to start listening to a
      // remote- store, but the remote store _has not yet been generated_ by
      // the coinstac backend service.
      { allowEverybody: true }
    ).handler,
  });

  server.route({
    path: downPath,
    method: 'post',
    handler: bouncerFactory(
      { rejectEverybody: true, pathRegExp: downPathRegExp }
    ).handler,
  });

  server.route({
    path: downPath,
    method: 'delete',
    handler: bouncerFactory(
      { rejectEverybody: true, pathRegExp: downPathRegExp }
    ).handler,
  });

  next();
};

module.exports = function coinstacStorageProxy(server, options, next) {
  joi.assert(options, optionSchema);
  server.dependency('h2o2', (srv, nxt) => {
    registerRoutes(srv, options, nxt);
  });
  next();
};

module.exports.attributes = {
  name: 'coinstac-storage-proxy',
  version: pkg.version,
};
