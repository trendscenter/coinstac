// @TODO port -client registry tests to -coinstac-common. improved method coverage
'use strict';

require('../helpers/boot');
const registryFactory = require('../../').services.dbRegistry;
const Pouchy = require('pouchy');
const test = require('tape');
const url = require('url');
const assign = require('lodash/assign');
const path = require('path');
const dbDir = path.join(__dirname, './test-db-dir');
const cp = require('child_process');
const fs = require('fs');

const setup = () => {
  try { cp.execSync('rm -rf ' + dbDir); } catch (err) {
    // pass
  }
  try { cp.execSync('mkdir -p ' + dbDir); } catch (err) {
    // pass
  }
};

const teardown = () => {
  try { cp.execSync('rm -rf ' + dbDir); } catch (err) {
    // pass
  }
};

test('registry - construction', t => {
  t.throws(() => {
    registryFactory();
  }, /missing db-registry opts/, 'requires opts');
  t.throws(() => {
    registryFactory({
    });
  }, /isLocal/, 'requires env flags `isLocal`/`isRemote`');
  t.throws(() => {
    registryFactory({
      isRemote: true,
    });
  }, /remote\.db/, 'requires remote db, always (p1)');
  t.throws(() => {
    registryFactory({
      isLocal: true,
    });
  }, /remote\.db/, 'requires remote db, always (p2)');
  t.throws(() => {
    registryFactory({
      isLocal: true,
      remote: { db: {} },
    });
  }, /path/, 'registry always requires path');
  t.end();
});

test('registry - local regex matching store', t => {
  setup();
  t.plan(4);
  const dbName = 'local-consortium-testing';
  const registry = registryFactory({
    isLocal: true,
    remote: { db: {} },
    path: dbDir,
  });
  const db = registry.get(dbName);
  t.ok(db instanceof Pouchy, 'Pouchy instances returned');
  t.equals(registry.constructor.Pouchy, Pouchy, 'pouchy constructor exported');
  db.save({ _id: 'dummy_id' })
  .then(() => {
    let dbPersisted;
    try {
      dbPersisted = fs.lstatSync(path.resolve(dbDir, dbName)); // LOG => leveldown file
    } catch (err) {
      return t.end(err.message);
    }
    t.ok(dbPersisted, 'db instantiated in expected path');
  })
  .then(() => registry.destroy())
  .then(() => teardown())
  .then(() => t.pass('teardown'))
  .then(t.end, t.end);
});

test('registry - regex-based store matching', t => {
  setup();
  const dbName = 'remote-consortium-test';
  const regConf = {
    isRemote: true,
    remote: {
      db: {
        protocol: 'http',
        host: 'localhost',
        port: 9999,
      },
    },
    path: dbDir,
  };
  const registry = registryFactory(regConf);
  const db = registry.get(dbName);
  t.ok(db instanceof Pouchy, 'Pouchy instances returned');
  t.ok(
    fs.lstatSync(path.join(dbDir, dbName)), // LOG => leveldown file
    'db instantiated in expected path'
  );
  registry.destroy()
  .then(() => teardown())
  .then(() => t.pass('teardown'))
  .then(t.end, t.end);
});

test('registry - only `isLocal` registries add remote url prefixes (e.g. up/ down/)', t => {
  setup();
  t.plan(5);
  const remoteConf = {
    remote: {
      db: {
        protocol: 'http',
        host: 'localhost',
        port: 9999,
      },
    },
    path: dbDir,
  };

  // test local client registry remote db connection urls
  const localDownDbName = 'remote-consortium-test-1';
  const localUpDbDbName = 'local-consortium-test-2';
  const localRegistry = registryFactory(assign(
    remoteConf,
    { isLocal: true }
  ));
  const clientLocalDownDb = localRegistry.get(localDownDbName);
  t.equal(
    clientLocalDownDb.url,
    url.format(assign({}, remoteConf.remote.db, { pathname: 'down/' + localDownDbName })),
    '`isLocal` registry "remote" downward syncing db prefixes down/ to url'
  );
  const clientLocalUpDb = localRegistry.get(localUpDbDbName);
  t.equal(
    clientLocalUpDb.url,
    url.format(assign({}, remoteConf.remote.db, { pathname: 'up/' + localUpDbDbName })),
    '`isLocal` registry "remote" upward syncing db prefixes up/ to url'
  );

  // test server registry remote db connection urls
  const serverSyncDbName = 'remote-consortium-test-3';
  const serverDownDbName = 'local-consortium-test-4';
  const remoteRegistry = registryFactory(assign(
    remoteConf,
    { isRemote: true }
  ));
  const serverSyncDb = remoteRegistry.get(serverSyncDbName);
  t.equal(
    serverSyncDb.url,
    url.format(assign({}, remoteConf.remote.db, { pathname: serverSyncDbName })),
    'server "replicate"d db adds no url prefixes'
  );
  const serverDownDb = remoteRegistry.get(serverDownDbName);
  t.equal(
    serverDownDb.url,
    url.format(assign({}, remoteConf.remote.db, { pathname: serverDownDbName })),
    'server "downward" syncing db adds no url prefixes'
  );
  Promise.all([
    localRegistry.destroy(),
    remoteRegistry.destroy(),
  ])
  .then(() => teardown())
  .then(() => t.pass('teardown'))
  .then(() => t.end(), t.end);
});
