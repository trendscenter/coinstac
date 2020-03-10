require('trace');
require('clarify');
const rethink = require('rethinkdb');

// const drneVbm = require('./data/coinstac-schema-regression-vbm');
// const ssrVbm = require('./data/coinstac-schema-regression-ss-vbm');
//const msrVbm = require('./data/coinstac-schema-regression-ms-vbm');
//
// const drneFsl = require('./data/coinstac-schema-regression-fsl');
// const ssrFsl = require('./data/coinstac-schema-regression-ss-fsl');
const msrFsl = require('./data/coinstac-schema-regression-ms-fsl');
//
// const ddfnc = require('./data/coinstac-ddfnc-pipeline');
// const vbm = require('./data/coinstac-vbm-pre');
//
// const fmri = require('./data/coinstac-fmri');
//
// const decentralized = require('./data/coinstac-decentralized-test');
// const decentralizedError = require('./data/coinstac-decentralized-error');
// const enigmaSans = require('./data/coinstac-enigma-sans');
// const local = require('./data/coinstac-local-test');
// const localError = require('./data/coinstac-local-error');

const helperFunctions = require('../src/auth-helpers');

let connection;

helperFunctions.getRethinkConnection()
  .then((db) => {
    connection = db;
    return rethink.dbList().contains('coinstac')
      .do((exists) => {
        return rethink.branch(
          exists,
          rethink.dbDrop('coinstac'),
          { dbs_dropped: 0 }
        );
      }).run(connection)
      .then(() => {
        if (process.argv[2]) {
          return rethink.db('rethinkdb').table('users')
            .get('admin').update({ password: process.argv[2] })
            .run(connection)
            .then(() => connection.close())
            .then(() => {
              helperFunctions.setDBMap({ rethinkdbAdmin: { user: 'admin', password: process.argv[2] } });
              return helperFunctions.getRethinkConnection();
            })
            .then((newDBConn) => { connection = newDBConn; });
        }
      })
      .then(() => rethink.dbCreate('coinstac').run(connection))
      .then(() => rethink.tableCreate('computations').run(connection))
      .then(() => rethink.table('computations').insert([
        // Object.assign({}, local, { submittedBy: 'test1' }),
        // Object.assign({}, decentralized, { submittedBy: 'test1' }),
        // Object.assign({}, ssrFsl, { submittedBy: 'test1' }),
        Object.assign({}, msrFsl, { submittedBy: 'test1' }),
        // Object.assign({}, vbm, { submittedBy: 'author' }),
        // Object.assign({}, ddfnc, { submittedBy: 'test1' }),
        // Object.assign({}, drneVbm, { submittedBy: 'test1' }),
        // Object.assign({}, ssrVbm, { submittedBy: 'test1' }),
        // Object.assign({}, drneFsl, { submittedBy: 'author' }),
        // Object.assign({}, decentralizedError, { submittedBy: 'test1' }),
        // Object.assign({}, enigmaSans, { submittedBy: 'test1' }),
        // Object.assign({}, localError, { submittedBy: 'test1' }),
        // Object.assign({}, fmri, { submittedBy: 'test1' }),
      ], { returnChanges: true }).run(connection))
      .then(() => rethink.tableCreate('pipelines').run(connection))
      .then(compInsertResult => rethink.table('pipelines').insert([
        {
          delete: false,
          description: 'mcr',
          id: 'test-pipeline-msr',
          name: 'msr test',
          owningConsortium: 'test-cons-2',
          shared: false,
          steps: [
            {
              computations: ['msrFsl'],
              controller: {
                id: null,
                options: {},
                type: 'decentralized',
              },
              id: 'HJKRyjTuM',
              inputMap: {
                covariates: {
                  ownerMappings: [
                    {
                      name: 'isControl',
                      source: 'file',
                      type: 'boolean',
                    },
                    {
                      name: 'age',
                      source: 'file',
                      type: 'number',
                    },
                  ],
                },
                data: {
                  ownerMappings: [
                    {
                      type: 'FreeSurfer',
                      value: ['3rd-Ventricle', '4th-Ventricle', '5th-Ventricle'],
                    },
                  ],
                },
                lambda: { value: 2 },
              },
            },
          ],
        },
      ]).run(connection))
      .then(() => rethink.tableCreate('users').run(connection))
      .then(() => rethink.tableCreate('runs').run(connection))
      .then(() => rethink.tableCreate('consortia').run(connection))
      .then(() => rethink.table('consortia').insert({
        id: 'test-cons-2',
        activePipelineId: 'test-pipeline-msr',
        name: 'Test Consortia 2',
        description: 'This consortia is for testing too.',
        owners: [{'rm48dmwlr':'test1'}],
        members: [{'rm48dmwlr':'test1'}],
        isPrivate: false,
      }).run(connection));
  })
  .then(() => helperFunctions.hashPassword('password'))
  .then(passwordHash => helperFunctions.createUser({
    id: 'rm48dmwlr',
    username: 'test1',
    name: 'Testy Testerson',
    institution: 'mrn',
    email: 'test@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        'test-cons-2': ['owner', 'member'],
      },
      pipelines: {},
    },
    consortiaStatuses: {
      'test-cons-2': 'none',
    },
  }, passwordHash))
  .then(() => helperFunctions.hashPassword('password'))
  .then(passwordHash => helperFunctions.createUser({
    id: '5mfos03dk',
    username: 'test2',
    name: 'Deuce McTestington',
    institution: 'mrn',
    email: 'test2@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        'test-cons-2': ['member'],
      },
      pipelines: {},
    },
    consortiaStatuses: {
      'test-cons-2': 'none',
    },
  }, passwordHash))
  .then(() => helperFunctions.hashPassword('password'))
  .then(passwordHash => helperFunctions.createUser({
    id: '9ckdme39s',
    username: 'test3',
    name: 'Tre Testerino',
    institution: 'mrn',
    email: 'test3@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        'test-cons-2': ['member'],
      },
      pipelines: {},
    },
    consortiaStatuses: {
      'test-cons-2': 'none',
    },
  }, passwordHash))
  .then(() => helperFunctions.hashPassword('password'))
  .then(passwordHash => helperFunctions.createUser({
    id: 'dnxke43is',
    username: 'test4',
    name: 'Quattro Testevez',
    institution: 'mrn',
    email: 'test4@mrn.org',
    permissions: {
      computations: {},
      consortia: {
        'test-cons-2': ['member'],
      },
      pipelines: {},
    },
    consortiaStatuses: {
      'test-cons-2': 'none',
    },
  }, passwordHash))
  .then(() => helperFunctions.hashPassword('password'))
  .then(passwordHash => helperFunctions.createUser({
    id: 'tidm3skxi',
    username: 'test5',
    name: 'Cinco De Testino',
    institution: 'mrn',
    email: 'test5@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
    },
    consortiaStatuses: {},
  }, passwordHash))
  .then(() => helperFunctions.hashPassword(process.argv[3]
     || helperFunctions.getDBMap().rethinkdbServer.password))
  .then(passwordHash => helperFunctions.createUser({
    id: '4neid0cmd',
    username: 'server',
    name: 'Severus Serverson',
    institution: 'mrn',
    email: 'server@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
    },
    consortiaStatuses: {},
  }, passwordHash))
  .then(() => helperFunctions.hashPassword('password'))
  .then(passwordHash => helperFunctions.createUser({
    id: '9dmskxj3',
    username: 'author',
    name: 'Arthur McAuthor',
    institution: 'mrn',
    email: 'author@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
    },
  }, passwordHash))
  .then(() => {
    process.exit();
  })
  .catch(console.log); // eslint-disable-line no-console
