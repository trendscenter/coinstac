/**
 * @module test-pool-utils
 * @description X-PipelineRunnerPool is a highly integrated abstraction,
 * requiring serveral layers of instantiated components within.  Although many
 * of the components could be stubbed (Runners/Pipelines/Registries), the value
 * of this abstraction is essentially the orchestration of said components.
 * Thus, the best way to acheive coverage for PipelineRunnerPools is to provide
 * minimially stubbed subcomponents in order to assert proper orchestration.
 * this module brings a virtual db server online, provisions registries, and
 * offers basic helpers to assist in PipelineRunnerPool testing.
 *
 * @warning this component may share state between tests.  ensure that your tests
 * utilize varying dbs and computations as necessary to minimize test
 * co-dependencies
 *
 */

const bluebird = require('bluebird');
const pdbs = require('spawn-pouchdb-server');
const cp = require('child_process');
const pdbsConfig = require('./.pouchdb-server-config');
const common = require('../../../../../');
const dbRegistryFactory = common.services.dbRegistry;
const Consortium = common.models.Consortium;
const User = common.models.User;
const RemoteComputationResult = common.models.computation.RemoteComputationResult;
const cloneDeep = require('lodash/cloneDeep');
const assign = require('lodash/assign');
const path = require('path');
const DecentralizedComputation =
  require('../../../../../src/models/decentralized-computation.js');


/**
 * @function fail
 * @description handle setup/teardown errors mercilessly.  kill the process
 * and abandon tests
 */
const fail = (err) => {
    console.error(err);
    process.exit(1);
};

module.exports = {
  buildComputationRegistry() {
    this.computationRegistry = {
      registry: [],

      add(name, version) {
        return this.registry.find((decentralized) => (
          decentralized.name === name && decentralized.version === version
        ));
      },
    };

    return Promise.resolve(this.computationRegistry);
  },

  stubBasicComputation(compId) {
    const decentralized = new DecentralizedComputation({
      cwd: __dirname,
      local: {
        fn(wat) {
          return Promise.resolve(compId);
        },
        type: 'function',
      },
      name: compId,
      remote: {
        fn(wat) {
          return Promise.resolve(compId);
        },
        type: 'function',
      },
      repository: {
        url: `https://github.com/MRN-Code/${compId}`,
      },
      version: compId,
      meta: {
        description: `Description for ${compId}`,
        name: compId,
      },
    });

    this.computationRegistry.registry.push(decentralized);
  },

  computationRegistry: null, // see `buildComputationRegistry`

    getDummyConsortium: (function() {
        var count = 0;
        return function() {
            ++count;
            return new Consortium({
                _id: 'testconsortium' + count,
                description: 'test-consortium-' + count,
                label: 'test-consortium-' + count,
                users: [],
                owners: []
            });
        };
    })(),

    getDummyUser: function() {
        return new User({
            username: 'testuser',
            email: 'testuser@mrn.org',
            password: 'test-pw'
        });
    },

    getDummyRemoteResult: function() {
        return new RemoteComputationResult({
            _id: 'runId',
            usernames: ['testUser'],
            computationId: 'testComptuation',
            consortiumId: 'testConsortium',
            computationInputs: [[
              ['TotalGrayVol'],
              200,
            ]],
        });
    },

    /**
     * @function getPoolOpts
     * @description get a functional set of constructor opts for PipelineRunnerPool
     */
    getPoolOpts: function(opts) {
        return assign({}, opts, {
            computationRegistry: this.computationRegistry,
            dbRegistry: this.getDBRegistry(opts.dbRegistry)
        });
    },

    /**
     * configure a registry that sets up local dbs to be inmem and
     * remote dbs inmem.  the remote dbs will connect to another
     * inmem db (pouchdb-server), simulating a full roundtrip
     */
    getDBRegistry: function(opts) {
        opts = opts || {};
        return dbRegistryFactory({
            isLocal: opts.isLocal,
            isRemote: opts.isLocal ? false : true,
            local: { pouchConfig: { adapter: 'memory' } },
            noURLPrefix: true, // disable db pre-fixing (e.g. no `up/`, `down/`)
            remote: {
                pouchConfig: { adapter: 'memory' },
                db: { protocol: 'http', hostname: 'localhost', port: pdbsConfig.port },
            },
            localStoresSyncBoth: [
                /local-consortium-.*/,
                /remote-consortium-.*/,
                /consortia/,
                /computations/
            ],
            remoteStoresSyncBoth: [
                /local-consortium-.*/,
                /remote-consortium-.*/,
                /consortia/,
                /computations/
            ],
            replicationOpts: { retry: false, heartbeat: 4000, timeout: false },
            path: __dirname
        });
    },

    /**
     * @function setup
     * @description boots a pouchdb-server, a dbRegistry instance, and
     * a computation registry instance.  these utilities are commonly
     * required for PipelineRunnerPool testing
     */
    setup: function() {
      return new Promise((res, rej) => {
        try {
          cp.execSync('pkill -f pouchdb-server');
        } catch (err) {
          // return rej(err); // permit fail
        }

        // @note ^^^ helpful to uncomment when tests are failing

        // spawn-pouchdb-server mutates user input >:(
        // https://github.com/hoodiehq/spawn-pouchdb-server/pull/33
        pdbs(cloneDeep(pdbsConfig), (err, srv) => {
            if (err) { fail(err); }
            this.server = srv;
            return this.buildComputationRegistry()
            .then(() => res());
        });
      });
    },

    /**
     * @function suppressCreateDestroyHandlers
     * @description simply squashes abstract methods that otherwise throw
     * Errors when called.  use when we know calls will be made to the methods
     * but are irrelevant to our test
     */
    suppressCreateDestroyHandlers: function(pool) {
      pool._handleCreatedDB = pool._handleDestroyedDB = function() {}; // squash!
    },

    teardown: function() {
      return new Promise((res) => {
        this.server.stop((err) => {
          if (err) { fail(err.message); }
          res();
        });
      });
    }

};
