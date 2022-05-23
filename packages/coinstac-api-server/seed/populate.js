const path = require('path');
const { ObjectID } = require('mongodb');
const fs = require('fs');
const database = require('../src/database');
const helperFunctions = require('../src/auth-helpers');
const fetchAllComputations = require('./fetchAllComputations');

async function getComputationsFromSeedData() {
  const seedDataPath = './seed/data';
  const fileNames = await fs.promises.readdir(seedDataPath);
  const filePromises = fileNames.filter((fileName) => {
    return fileName.includes('.json');
  }).map(async (fileName) => {
    const json = await fs.promises.readFile(path.join(seedDataPath, fileName));
    return JSON.parse(json);
  });

  return Promise.all(filePromises);
}

async function getComputations() {
  const computationsFromApi = await fetchAllComputations();
  const computationsFromSeedData = await getComputationsFromSeedData();

  // dedupe computations, overwriting api computations with seed data computations if there are collisions.
  const computationsByMetaId = {};
  computationsFromApi.forEach((computation) => {
    computationsByMetaId[computation.meta.id] = computation;
  });
  computationsFromSeedData.forEach((computation) => {
    computationsByMetaId[computation.meta.id] = computation;
  });

  const computations = Object.keys(computationsByMetaId).map((key) => {
    return computationsByMetaId[key];
  });


  return computations;
}

async function populateComputations(computations) {
  const db = database.getDbInstance();

  const computationEntries = computations.map((computation) => {
    return { ...computation, submittedBy: 'author', _id: database.createUniqueId() };
  });

  const currentComps = await db.collection('computations').find().toArray();
  const operations = computationEntries.reduce((ops, comp) => {
    const cc = currentComps.find(cc => cc.meta.id === comp.meta.id);
    if (cc) {
      ops.update.push(Object.assign({}, comp, { _id: cc._id }));
      return ops;
    }
    ops.insert.push(comp);
    return ops;
  }, { update: [], insert: [] });
  if (operations.insert.length > 0) await db.collection('computations').insertMany(operations.insert);
  await Promise.all(operations.update.map(async (op) => {
    await db.collection('computations').updateMany({ _id: ObjectID(op._id) }, { $set: { meta: op.meta, computation: op.computation } });
  }));
}

async function populateUsers() {
  const password = await helperFunctions.hashPassword('password');

  await helperFunctions.createUser({
    _id: database.createUniqueId(),
    username: 'test1',
    name: 'Testy Testerson',
    institution: 'mrn',
    email: 'test@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
      headlessClients: {},
      roles: {
        admin: true,
        author: true,
      },
    },
    consortiaStatuses: {},
  }, password);

  await helperFunctions.createUser({
    _id: database.createUniqueId(),
    username: 'test2',
    name: 'Deuce Masterson',
    institution: 'mrn',
    email: 'test2@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
      headlessClients: {},
      roles: {
        admin: false,
        author: true,
      },
    },
    consortiaStatuses: {},
  }, password);

  await helperFunctions.createUser({
    _id: database.createUniqueId(),
    username: 'test3',
    name: 'Tre Testington III',
    institution: 'mrn',
    email: 'test3@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
      headlessClients: {},
      roles: {
        admin: false,
        author: false,
      },
    },
    consortiaStatuses: {},
  }, password);

  await helperFunctions.createUser({
    _id: database.createUniqueId(),
    username: 'test4',
    name: 'Quattro Quintana',
    institution: 'mrn',
    email: 'test4@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
      headlessClients: {},
      roles: {
        admin: true,
        author: true,
      },
    },
    consortiaStatuses: {},
  }, password);

  await helperFunctions.createUser({
    _id: database.createUniqueId(),
    username: 'test5',
    name: 'Cinco Chavez',
    institution: 'mrn',
    email: 'test5@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
      headlessClients: {},
      roles: {
        admin: false,
        author: true,
      },
    },
    consortiaStatuses: {},
  }, password);

  await helperFunctions.createUser({
    _id: database.createUniqueId(),
    username: 'author',
    name: 'Arturo Andersson',
    institution: 'mrn',
    email: 'author@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
      headlessClients: {},
      roles: {
        admin: false,
        author: false,
      },
    },
  }, password);

  const adminPassword = await helperFunctions.hashPassword(process.argv[3]
    || process.env.SERVER_API_PASSWORD);

  await helperFunctions.createUser({
    _id: database.createUniqueId(),
    username: process.env.SERVER_API_USERNAME,
    name: 'Sally Serverson',
    institution: 'mrn',
    email: 'server@mrn.org',
    permissions: {
      computations: {},
      consortia: {},
      pipelines: {},
      headlessClients: {},
      roles: {
        admin: true,
        author: false,
      },
    },
    consortiaStatuses: {},
  }, adminPassword);
}

async function populateHeadlessClients() {
  const db = database.getDbInstance();

  // get ssrfsl computation
  const ssrfsl = await db.collection('computations').findOne({ 'meta.id': 'ssr-fsl' });

  return db.collection('headlessClients').insertMany([
    {
      name: 'Headless 1',
      apiKey: await helperFunctions.hashPassword('testApiKey'),
      hasApiKey: true,
      computationWhitelist: {
        [ssrfsl._id.toString()]: {
          inputMap: {
            covariates: {
              type: 'csv',
              dataMap: [
                { csvColumn: 'age', variableName: 'age', type: 'number' },
                { csvColumn: 'isControl', variableName: 'isControl', type: 'boolean' },
              ],
              dataFilePath: path.resolve('../../algorithm-development/test-data/freesurfer-test-data/site1/site1_Covariate.csv'),
            },
          },
        },
      },
      owners: {},
    },
  ]);
}

async function populate(closeConnection = true) {
  const computations = await getComputations();
  await database.connect();
  await database.dropDbInstance();
  database.getDbInstance();
  await database.createDbIndexes();
  await populateComputations(computations);
  await populateUsers();
  await populateHeadlessClients();

  if (closeConnection) {
    await database.close();
  }
}

module.exports = {
  populate,
};
